import { red, reset } from "../2/ansi"
import { assert, unreachable } from "./assert"
import { debug } from "./debug"
import { Errors, TraceEntry } from "./error"
import type { File } from "./file"
import { decl } from "./ident"
import {
    bitCountWithVariants,
    FLOAT_BIT_SIZES,
    floatTruncate,
    intIsSafe,
    type FloatBitSize,
} from "./num"
import type { Decl, Expr, FunctionParam, Ident, Range, Stmt } from "./parse"

const usize: Type = { k: "u", v: 32 }

type Type =
    | { k: "never"; v: null }
    | { k: "void"; v: null }
    | { k: "bool"; v: null }
    | { k: "comptime_int"; v: null }
    | { k: "comptime_float"; v: null }
    | { k: "u" | "i"; v: number }
    | { k: "f"; v: FloatBitSize }
    | { k: "str"; v: null }
    | { k: "path"; v: null } // so that `@import(x)` works even when `x` is defined in another file
    | { k: "null"; v: null }
    | { k: "optional"; v: Type }
    | { k: "array"; v: { len: number; child: Type } }
    | { k: "slice"; v: Type }
    | { k: "tuple"; v: Type[] }
    | { k: "fn"; v: { params: (Type | null)[]; ret: Type | null } } // `null` means "anytype", or "type depending on previous arguments"
    | { k: "type"; v: null }
    | { k: "struct"; v: Struct }
    | { k: "enum"; v: Enum }
    | { k: "union"; v: Union }
    | { k: "opaque"; v: Opaque }

export function typeName(type: Type): string {
    const { k, v } = type

    switch (k) {
        case "never":
        case "void":
        case "bool":
        case "comptime_int":
        case "comptime_float":
        case "str":
        case "path":
        case "type":
            return k

        case "u":
        case "i":
        case "f":
            return k + v

        case "null":
            return "@TypeOf(null)"

        case "optional":
            return "?" + typeName(v)

        case "array":
            return `[${v.len}]${typeName(v.child)}`

        case "slice":
            return `[]${typeName(v)}`

        case "tuple":
            return `@Tuple(.{ ${v.map(typeName).join(", ")} })`

        case "fn":
            return `fn (${v.params.map((x) => (x ? typeName(x) : "anytype"))}) ${v.ret ? typeName(v.ret) : "anytype"}`

        case "type":
            return "type"

        case "struct":
            return `${v.ns.file.name}__struct_${v.id}`

        case "enum":
            return `${v.ns.file.name}__enum_${v.id}`

        case "union":
            return `${v.ns.file.name}__union_${v.id}`

        case "opaque":
            return `${v.ns.file.name}__opaque_${v.id}`
    }
}

type Value =
    | { k: "runtime"; v: RII }
    | { k: "void"; v: null } // type = void
    | { k: "bool"; v: boolean } // type = bool
    | { k: "int"; v: bigint } // type = comptime_int, u, i, enum
    | { k: "float"; v: number } // type = comptime_float, f
    | { k: "str"; v: string } // type = str, path
    | { k: "null"; v: null } // type = null, optional(T)
    | { k: "some"; v: Value } // type = optional(T)
    | { k: "array"; v: Value[] } // type = array, slice, tuple
    | { k: "array-u8"; v: Uint8Array } // type = array, slice
    | { k: "fn"; v: Fn } // type = fn
    | { k: "type"; v: Type } // type = type
    | { k: "struct"; v: Map<string, Value> } // type = struct
    | { k: "union"; v: { k: string; v: Value } } // type = union

interface TypedValue {
    type: Type
    value: Value
}

type Lazy<Raw, Analyzed> =
    | { k: "raw"; v: Raw }
    | { k: "progressing"; v: { ns: Namespace; p: Range } }
    | { k: "analyzed"; v: Analyzed }

type Capture = Value | { k: "runtime-var"; v: GID }

interface Struct {
    id: AID
    p: Range
    captures: Capture[]
    ns: Namespace
    members: Lazy<
        Map<string, { type: Expr; default: Expr | null }>,
        Map<string, { type: Type; default: TypedValue | null }>
    >
}

interface Enum {
    id: AID
    p: Range
    captures: Capture[]
    ns: Namespace
    backingInt: Type
    members: Lazy<Map<string, Expr | null>, Map<string, bigint>>
}

interface Union {
    id: AID
    p: Range
    captures: Capture[]
    ns: Namespace
    tag: Type & { k: "enum" }
    members: Lazy<Map<string, Expr | null>, Map<string, Type>>
}

interface Opaque {
    id: AID
    p: Range
    captures: Capture[]
    ns: Namespace
}

class Fn {
    constructor(
        public ns: Namespace,
        public id: FID,
        public params: FunctionParam[],
        public returnType: Expr,
        public body: Expr,
    ) {}
}

interface FnInstance {
    ns: Namespace

    comptimeArgs: TypedValue[]
    runtimeArgs: Type[]
    returnType: Type

    body: RuntimeInst[]
}

export class Items {
    constructor(public parent: Items | null) {}

    private self = new Map<string, Item>()

    fork(): Items {
        return new Items(this)
    }

    get(name: string): Item {
        assert(this.has(name))
        return this.self.get(name) ?? this.parent!.get(name)
    }

    getOwn(name: string): Item {
        assert(this.hasOwn(name))
        return this.self.get(name)!
    }

    has(name: string): boolean {
        return this.self.has(name) || (this.parent !== null && this.parent.has(name))
    }

    hasOwn(name: string): boolean {
        return this.self.has(name)
    }

    setOwn(name: string, value: Item): void {
        assert(!this.has(name))
        this.self.set(name, value)
    }

    *[Symbol.iterator](): Generator<[string, Item], BuiltinIteratorReturn, unknown> {
        yield* this.self
        if (this.parent !== null) yield* this.parent
    }

    *keysOwn() {
        yield* this.self.keys()
    }
}

type Item =
    | { k: "fn"; v: Fn }
    | { k: "const"; v: Lazy<{ ns: Namespace; type: Expr | null; value: Expr }, TypedValue> }
    | {
          k: "var"
          v: Lazy<{ ns: Namespace; type: Expr | null; value: Expr }, { type: Type; id: GID }>
      }
    | { k: "reserved"; v: null }

type GID = number & { __brand: "global_var" }
type RII = number & { __brand: "runtime_instruction" }
type AID = number & { __brand: "adt" } // even numbers are normal structs, odd are whole-file structs
type FID = number & { __brand: "fn_decl" }
type TID = number & { __brand: "test" }
type IID = number & { __brand: "fn_instance" }

type RuntimeInst =
    | { n: RII; k: "arg-load"; v: number }
    | { n: RII; k: "lit"; v: TypedValue }
    | { n: RII; k: "cf-unreachable"; v: null }
    | { n: RII; k: "cf-return"; v: RII }
    | { n: RII; k: "fn-call"; v: { f: FID; i: IID; args: RII[] } }
    | { n: RII; k: "get-unwrap"; v: RII }
    | { n: RII; k: "slice-from-array"; v: RII }
    | { n: RII; k: "var-load"; v: RII }

interface Test {
    ns: Namespace
    id: TID
    name: string | null
    body: Expr
}

export class Root {
    constructor(
        public errors: Errors,
        public tests: Test[] | null, // `null` if not using tests
    ) {}

    public globalVars = new Map<GID, TypedValue>()
    public fns = new Map<FID, FnInstance[]>()

    raiseAt(file: File, p: Range, message: string) {
        this.errors.raise(new TraceEntry(file, p.s, p.e, message))
    }

    createNamespace(file: File, self: Type) {
        return new Namespace(this, file, self, new Items(null))
    }
}

type BreakKind = { k: "with-value"; v: Type | null } | { k: "not-allowed"; v: null }

type ContinueKind =
    | { k: "with-value"; v: Type }
    | { k: "without-value"; v: null }
    | { k: "not-allowed"; v: null }

type BreakSite = { n: RII; value: TypedValue }

interface Label {
    n: RII
    break: BreakKind
    breakSites: BreakSite[] // so we can coerce into one type
    continue: ContinueKind
}

type Variable =
    | { k: "var" | "const"; v: { type: Type; n: RII } }
    | { k: "comptime-const"; v: TypedValue }

let nextId = 0

export class EvaluationContext {
    constructor(
        public ns: Namespace,
        public runtime: RuntimeInst[],
        public variables: Map<string, Variable>,
        public labels: Map<string, Label>,
        public returnType: Type | null, // `null` means `return` is invalid
    ) {}

    createNamespace(type: Type): Namespace {
        const valueDecls = this.ns.items.fork()
        const nsDecls = valueDecls.fork()

        for (const [key, val] of this.variables) {
            if (val.k === "comptime-const") {
                valueDecls.setOwn(key, { k: "const", v: { k: "analyzed", v: val.v } })
            } else {
                valueDecls.setOwn(key, { k: "reserved", v: null })
            }
        }

        return new Namespace(this.ns.root, this.ns.file, type, nsDecls)
    }

    raiseAt(p: Range, message: string) {
        this.ns.raiseAt(p, message)
    }

    raiseMismatchedTypes(p: Range, expected: Type, actual: Type) {
        this.ns.raiseAt(p, `expected '${typeName(expected)}', but got '${typeName(actual)}'`)
    }

    raiseMismatchedPeers(p: Range, values: TypedValue[]) {
        this.ns.raiseAt(
            p,
            `cannot coerce peers ${values.map((x) => "'" + typeName(x.type) + "'").join(", ")}`,
        )
    }

    todo(p: Range, message?: string) {
        this.ns.todo(p, message ?? new Error().stack)
    }

    rtInst<K extends RuntimeInst["k"]>(k: K, v: Extract<RuntimeInst, { k: K }>["v"]): RII {
        const n = nextId++ as RII
        this.runtime.push({ n, k, v } as RuntimeInst)
        return n
    }

    rtTypedValue<K extends RuntimeInst["k"]>(
        type: Type,
        k: K,
        v: Extract<RuntimeInst, { k: K }>["v"],
    ): TypedValue {
        const n = nextId++ as RII
        this.runtime.push({ n, k, v } as RuntimeInst)
        return { type, value: { k: "runtime", v: n } }
    }

    rtResult<K extends RuntimeInst["k"]>(
        type: Type,
        k: K,
        v: Extract<RuntimeInst, { k: K }>["v"],
    ): Result<TypedValue> {
        const n = nextId++ as RII
        this.runtime.push({ n, k, v } as RuntimeInst)
        return { k: "normal", v: { type, value: { k: "runtime", v: n } } }
    }

    /** Returns `null` when loading a runtime-only variable at comptime. */
    getVariable(comptime: boolean, p: Range, name: string): TypedValue | null {
        assert(this.variables.has(name))
        const { k, v } = this.variables.get(name)!

        switch (k) {
            case "comptime-const":
                return v

            case "var":
            case "const":
                if (comptime) {
                    this.raiseAt(p, `variable '${name}' cannot be loaded at comptime`)
                    return null
                }

                return this.rtTypedValue(v.type, "var-load", v.n)
        }
    }

    makeRuntime(p: Range, el: TypedValue): RII | null {
        if (el.value.k === "runtime") {
            return el.value.v
        }

        if (!isRuntimeType(this.ns.root, el.type)) {
            this.raiseAt(p, `'${typeName(el.type)}' cannot be used at runtime`)
            return null
        }

        return this.rtInst("lit", el)
    }

    makeRuntimeResult(p: Range, el: TypedValue): Result<TypedValue> {
        const rii = this.makeRuntime(p, el)
        if (rii === null) return ERROR

        return { k: "normal", v: { type: el.type, value: { k: "runtime", v: rii } } }
    }
}

export class Namespace {
    constructor(
        public root: Root,
        public file: File,
        public self: Type, // value of @This()
        public items: Items,
    ) {}

    createEvaluationContext() {
        return new EvaluationContext(this, [], new Map(), new Map(), null)
    }

    raiseAt(p: Range, message: string) {
        this.root.errors.raise(new TraceEntry(this.file, p.s, p.e, message))
    }

    todo(p: Range, message?: string) {
        this.raiseAt(p, `TODO (${message})`)
    }
}

type ResultNontrivial =
    | { k: "error"; v: null } // compile error
    | { k: "unreachable"; v: null }
    | { k: "break"; v: BreakSite }
    | { k: "continue"; v: { n: RII; value: TypedValue } }
    | { k: "return"; v: TypedValue }

type Result<T> = ResultNontrivial | { k: "normal"; v: T }

interface ImmediateExecutables {
    comptime: Expr[]
    test: { id: number; name: string; body: Expr }[]
}

const ERROR = { k: "error" as const, v: null }

function normal(type: Type, value: Value): Result<TypedValue> {
    return { k: "normal", v: { type, value } }
}

function normalType(type: Type): Result<TypedValue> {
    return normal({ k: "type", v: null }, { k: "type", v: type })
}

const VOID: Result<TypedValue> = {
    k: "normal",
    v: { type: { k: "void", v: null }, value: { k: "void", v: null } },
}

function exprAsType(ctx: EvaluationContext, p: Expr): Result<Type> {
    const value = expr(ctx, true, { k: "type", v: null }, p)
    if (value.k !== "normal") return value

    if (value.v.type.k !== "type") {
        ctx.raiseAt(p, `expected 'type', got '${typeName(value.v.type)}'`)
        return ERROR
    }

    assert(value.v.value.k === "type")
    return { k: "normal", v: value.v.value.v }
}

/**
 * Coerces one type into another. Coercions are always lossless and injective, with the exception of
 * the `comptime_float` to `fN` cast. Currently, the following coercions are supported.
 *
 * - `comptime_float` -> `fN`
 * - `comptime_int` -> `iN` or `uN`, if it fits
 * - `T` -> `?T`, `null` -> `?T`
 * - `[N]T` -> `[]T`
 * - `T` -> `T`, the identity cast
 *
 * If `null` is returned, the cast failed and an error was issued.
 *
 * Note that `never` does not coerce into any other type. For the most part, we treat it as a
 * regular type in this compiler.
 *
 * This function does not accept a `comptime` parameter. Instead, it is guaranteed to produce
 * comptime-known values when given comptime-known input.
 */
function as(ctx: EvaluationContext, p: Range, type: Type, value: TypedValue): TypedValue | null {
    if (value.type === type) {
        return value
    }

    if (type.k === "optional") {
        if (value.type.k === "null") {
            return { type, value: { k: "null", v: null } }
        }

        if (value.type.k !== "optional") {
            const { depth, inner } = unwrapOptional(type)

            const valueAsInner = as(ctx, p, inner, value)
            if (valueAsInner === null) {
                ctx.raiseMismatchedTypes(p, type, value.type)
                return null
            }

            let val = valueAsInner.value
            for (let i = 0; i < depth; i++) {
                val = { k: "some", v: val }
            }

            return { type, value: val }
        }

        const expected = unwrapOptional(type)
        const actual = unwrapOptional(value.type)

        if (!typeEq(expected.inner, actual.inner)) {
            ctx.raiseMismatchedTypes(p, type, value.type)
            return null
        }

        if (expected.depth < actual.depth) {
            ctx.raiseMismatchedTypes(p, type, value.type)
            return null
        }

        if (expected.depth === actual.depth) return value

        let val = value.value
        for (let i = actual.depth; i < expected.depth; i++) {
            val = { k: "some", v: val }
        }

        return { type, value: val }
    }

    if (value.type.k === "array" && type.k === "slice") {
        if (!typeEq(value.type.v.child, type.v)) {
            ctx.raiseMismatchedTypes(p, type, value.type)
            return null
        }

        if (value.value.k === "array" || value.value.k === "array-u8") {
            return { type, value: value.value }
        }

        assert(value.value.k === "runtime")
        return ctx.rtTypedValue(type, "slice-from-array", value.value.v)
    }

    if (value.type.k === "comptime_float" && type.k === "f") {
        assert(value.value.k === "float")

        const v = floatTruncate(type.v, value.value.v)
        if (isFinite(value.value.v) && !isFinite(v)) {
            ctx.raiseAt(
                p,
                `cannot cast '${value.value.v}' into '${typeName(type)}' since it becomes infinite`,
            )
            return null
        }

        return { type, value: { k: "float", v } }
    }

    if (value.type.k === "comptime_int" && (type.k === "u" || type.k === "i")) {
        assert(value.value.k === "int")
        if (!intIsSafe(type.k, type.v, value.value.v)) {
            ctx.raiseAt(
                p,
                `cannot cast '${value.value.v}' into '${typeName(type)}' since it overflows`,
            )
            return null
        }
        return { type, value: value.value }
    }

    if (!typeEq(type, value.type)) {
        ctx.raiseMismatchedTypes(p, type, value.type)
        return null
    }

    return value
}

/** `as(..., ..., type, value)` should return `null` precisely when this function returns `false`. */
function canCoerce(type: Type, value: TypedValue): boolean {
    if (value.type === type) return true

    if (type.k === "optional") {
        if (value.type.k === "null") return true
        if (value.type.k !== "optional") return canCoerce(unwrapOptional(type).inner, value)

        const expected = unwrapOptional(type)
        const actual = unwrapOptional(value.type)

        return typeEq(expected.inner, actual.inner) && expected.depth >= actual.depth
    }

    if (value.type.k === "array" && type.k === "slice") {
        return typeEq(value.type.v.child, type.v)
    }

    if (value.type.k === "comptime_float" && type.k === "f") {
        assert(value.value.k === "float")

        const v = floatTruncate(type.v, value.value.v)
        return !(isFinite(value.value.v) && !isFinite(v))
    }

    if (value.type.k === "comptime_int" && (type.k === "u" || type.k === "i")) {
        assert(value.value.k === "int")
        return intIsSafe(type.k, type.v, value.value.v)
    }

    return typeEq(type, value.type)
}

function unwrapOptional(type: Type): { depth: number; inner: Type } {
    let depth = 0

    while (type.k === "optional") {
        depth++
        type = type.v
    }

    return { depth, inner: type }
}

/** Gets the innermost type of trivial type wrappers like `?T` and (once we have it) `!T`. */
function innerType(type: Type) {
    while (type.k === "optional") {
        type = type.v
    }

    return type
}

/**
 * Finds a type which all values coerce into. If `null` is returned, no join was found and an error
 * was issued.
 *
 * This algorithm is not very clever yet. It only finds `null` and `T` into `?T`, and otherwise
 * requires that all types match.
 *
 * TODO: Currently, this algorithm only has nontrivial behavior so that we know it's working. In the
 * future, the `null` + `T` = `?T` join should be removed, as it could cause different behavior at
 * comptime and runtime.
 */
function join(ctx: EvaluationContext, p: Range, values: TypedValue[]): Type | null {
    if (values.length === 0) {
        return { k: "never", v: null }
    }

    if (values.length === 1) {
        return values[0]!.type
    }

    if (values.some((x) => x.type.k === "null" || x.type.k === "optional")) {
        const optional = values.filter((x) => x.type.k === "optional")
        const plain = values.filter((x) => x.type.k !== "null" && x.type.k !== "optional")

        if (optional.length === 0) {
            const child = join(ctx, p, plain)
            if (child === null) return null

            return { k: "optional", v: child }
        }

        let { depth, inner } = unwrapOptional(optional[0]!.type)
        for (let i = 1; i < optional.length; i++) {
            const { depth: myDepth, inner: myInner } = unwrapOptional(optional[i]!.type)
            depth = Math.max(depth, myDepth)
            if (!typeEq(inner, myInner)) {
                ctx.raiseMismatchedPeers(p, values)
                return null
            }
        }

        for (const el of plain) {
            if (!canCoerce(inner, el)) {
                ctx.raiseMismatchedPeers(p, values)
                return null
            }
        }

        for (let i = 0; i < depth; i++) {
            inner = { k: "optional", v: inner }
        }
        return inner
    }

    const fst = values[0]!.type
    for (const el of values) {
        if (!typeEq(fst, el.type)) {
            ctx.raiseMismatchedPeers(p, values)
            return null
        }
    }
    return fst
}

export function exprAs(
    ctx: EvaluationContext,
    comptime: boolean,
    type: Type,
    p: Expr,
): Result<TypedValue> {
    const value = expr(ctx, comptime, type, p)
    if (value.k !== "normal") return value

    const result = as(ctx, p, type, value.v)
    if (result === null) return ERROR

    return { k: "normal", v: result }
}

export function expr(
    ctx: EvaluationContext,
    comptime: boolean,
    type: Type | null,
    p: Expr,
): Result<TypedValue> {
    const { k, v } = p

    switch (k) {
        case "error":
            return ERROR

        case "lit-void":
            return VOID

        case "lit-int":
            if (type !== null) {
                type = innerType(type)
                if (type.k === "u" || type.k === "i") {
                    if (!intIsSafe(type.k, type.v, v)) {
                        ctx.raiseAt(p, `'${v}' does not fit in '${typeName(type)}'`)
                    }
                    return normal(type, { k: "int", v })
                }
            }

            return normal({ k: "comptime_int", v: null }, { k: "int", v })

        case "lit-float":
            if (type !== null) {
                type = innerType(type)
                if (type.k === "f") {
                    const val = floatTruncate(type.v, v)
                    if (!isFinite(val)) {
                        ctx.raiseAt(p, `'${v}' does not fit in '${typeName(type)}'`)
                    }
                    return normal(type, { k: "float", v })
                }
            }

            return normal({ k: "comptime_float", v: null }, { k: "float", v })

        case "lit-str":
            if (type !== null) {
                const value = encodeStr(ctx, type, p, v)
                if (value === null) return ERROR
                return { k: "normal", v: value }
            }

            return normal({ k: "str", v: null }, { k: "str", v })

        case "ty-optional": {
            const type = exprAsType(ctx, v.child)
            if (type.k !== "normal") return type

            return normalType({ k: "optional", v: type.v })
        }

        case "ty-array": {
            if (v.len === null) {
                const child = exprAsType(ctx, v.child)
                if (child.k !== "normal") return child

                return normalType({ k: "slice", v: child.v })
            }

            const len = exprAs(ctx, true, usize, v.len)
            if (len.k !== "normal") return len
            assert(len.v.value.k === "int")

            const child = exprAsType(ctx, v.child)
            if (child.k !== "normal") return child

            return normalType({ k: "array", v: { len: Number(len.v.value.v), child: child.v } })
        }

        case "ty-fn": {
            const params: (Type | null)[] = []
            for (const param of v.params) {
                if (param === null) {
                    params.push(null)
                    continue
                }

                const type = exprAsType(ctx, param)
                if (type.k !== "normal") return type

                params.push(type.v)
            }

            let ret: Type | null = null
            if (v.ret) {
                const type = exprAsType(ctx, v.ret)
                if (type.k !== "normal") return type

                ret = type.v
            }

            return normalType({ k: "fn", v: { params, ret } })
        }

        case "ns-struct": {
            if (v.extern) {
                ctx.todo(p, "extern structs")
                return ERROR
            }

            const captures = getCaptures(ctx, v.child)
            if (captures === null) return ERROR

            const members = new Map<string, { type: Expr; default: Expr | null }>()
            for (const p of v.child) {
                if (p.k === "field-ident") {
                    ctx.raiseAt(p, "expected type of struct field")
                    return ERROR
                }

                if (p.k === "field-plain") {
                    if (members.has(p.v.name.name)) {
                        ctx.raiseAt(p, "struct field declared twice")
                        return ERROR
                    }

                    members.set(p.v.name.name, { type: p.v.type, default: p.v.default })
                }
            }

            const struct: Struct = {
                id: (v.id << 1) as AID,
                p,
                captures,
                ns: null!,
                members: { k: "raw", v: members },
            }
            const ns = ctx.createNamespace({ k: "struct", v: struct })
            struct.ns = ns

            if (!finalizeNamespace(ns, "field", members, v.child)) return ERROR
            return normalType(ns.self)
        }

        case "ns-enum": {
            if (v.extern) {
                ctx.todo(p, "extern enums")
                return ERROR
            }

            let tag: Type | null = null
            if (v.tag) {
                const result = exprAsType(ctx, v.tag)
                if (result.k !== "normal") return result

                tag = result.v

                // TODO: zig allows enum tag type to be nearly anything apparently? we should take that
                if (!(tag.k === "u" || tag.k === "i")) {
                    ctx.raiseAt(v.tag, `enum tag type must be an integer, got '${typeName(tag)}'`)
                }
            }

            const captures = getCaptures(ctx, v.child)
            if (captures === null) return ERROR

            const members = new Map<string, Expr | null>()
            let isAnyExplicit = false
            for (const p of v.child) {
                if (p.k === "field-plain") {
                    ctx.raiseAt(p, "enum variants cannot have types")
                    return ERROR
                }

                if (p.k === "field-ident") {
                    if (members.has(p.v.name.name)) {
                        ctx.raiseAt(p, "enum variant declared twice")
                        return ERROR
                    }

                    members.set(p.v.name.name, p.v.value)
                    if (p.v.value !== null) isAnyExplicit = true
                }
            }

            let membersExplicit: Map<string, bigint> | null = null
            if (tag === null) {
                if (isAnyExplicit) {
                    ctx.raiseAt(p, "enum with explicit values must have tag type")
                    return ERROR
                }

                membersExplicit = new Map()
                let i = 0n
                for (const k of members.keys()) {
                    membersExplicit.set(k, i++)
                }
                tag = { k: "u", v: bitCountWithVariants(Number(i)) }
            }

            const type: Enum = {
                id: (v.id << 1) as AID,
                p,
                captures,
                ns: null!,
                backingInt: tag,
                members:
                    membersExplicit ?
                        { k: "analyzed", v: membersExplicit }
                    :   { k: "raw", v: members },
            }
            const ns = ctx.createNamespace({ k: "enum", v: type })
            type.ns = ns

            if (!finalizeNamespace(ns, "variant", members, v.child)) return ERROR
            return normalType(ns.self)
        }

        case "ns-union": {
            const captures = getCaptures(ctx, v.child)
            if (captures === null) return ERROR

            const members = new Map<string, Expr | null>()
            for (const p of v.child) {
                if (p.k === "field-ident") {
                    if (members.has(p.v.name.name)) {
                        ctx.raiseAt(p, "union variant declared twice")
                        return ERROR
                    }

                    members.set(p.v.name.name, null)
                } else if (p.k === "field-plain") {
                    if (members.has(p.v.name.name)) {
                        ctx.raiseAt(p, "union variant declared twice")
                        return ERROR
                    }

                    if (p.v.default !== null) {
                        ctx.raiseAt(p, "union variants cannot specify tag values")
                    }

                    members.set(p.v.name.name, p.v.type)
                }
            }

            let tag: Type
            if (v.tag === "enum") {
                const adt: Enum = {
                    id: ((v.id - 1) << 1) as AID,
                    p,
                    captures: [],
                    ns: null!,
                    backingInt: { k: "u", v: bitCountWithVariants(members.size) },
                    members: {
                        k: "analyzed",
                        v: new Map(Array.from(members.keys()).map((k, i) => [k, BigInt(i)])),
                    },
                }
                adt.ns = ctx.createNamespace({ k: "enum", v: adt })
                tag = { k: "enum", v: adt }
            } else if (v.tag === null) {
                ctx.todo(p, "untagged unions are not supported yet")
                return ERROR
            } else {
                const tagType = exprAsType(ctx, v.tag)
                if (tagType.k !== "normal") return tagType

                if (tagType.v.k !== "enum") {
                    ctx.raiseAt(
                        v.tag,
                        `union tag type must be an 'enum', got '${typeName(tagType.v)}'`,
                    )
                    return ERROR
                }

                if (tagType.v.v.members.k === "progressing") {
                    ctx.raiseAt(v.tag, "dependency loop when analyzing union tag type")
                    return ERROR
                }

                const enumKeys = Array.from(tagType.v.v.members.v.keys())
                const unionKeys = Array.from(members.keys())

                for (let i = 0; i < enumKeys.length; i++) {
                    const key = enumKeys[i]!

                    if (!members.has(key)) {
                        ctx.raiseAt(
                            p,
                            `union is missing variant '${key}' from enum '${typeName(tagType.v)}'`,
                        )
                        return ERROR
                    }

                    if (unionKeys[i] !== key) {
                        ctx.raiseAt(
                            p,
                            `union variant order does not match its tag type '${typeName(tagType.v)}'; variant #${i} should be '${key}'`,
                        )
                        return ERROR
                    }
                }

                if (unionKeys.length > enumKeys.length) {
                    const extra = unionKeys[enumKeys.length]!
                    ctx.raiseAt(
                        p,
                        `union variant '${extra}' is not present in tag type '${typeName(tagType.v)}'`,
                    )
                    return ERROR
                }

                tag = tagType.v
            }

            const union: Union = {
                id: (v.id << 1) as AID,
                p,
                captures,
                ns: null!,
                tag,
                members: { k: "raw", v: members },
            }
            const ns = ctx.createNamespace({ k: "union", v: union })
            union.ns = ns

            if (!finalizeNamespace(ns, "variant", members, v.child)) return ERROR
            return normalType(ns.self)
        }

        case "ns-opaque": {
            const captures = getCaptures(ctx, v.child)
            if (captures === null) return ERROR

            const opaque: Opaque = { id: (v.id << 1) as AID, p, captures, ns: null! }
            const ns = ctx.createNamespace({ k: "opaque", v: opaque })
            opaque.ns = ns

            if (!finalizeNamespace(ns, null! /* never used */, new Map(), v.child)) return ERROR
            return normalType(ns.self)
        }

        case "dot-tuple": {
            if (type !== null) type = innerType(type)

            if (type !== null && (type.k === "array" || type.k === "slice")) {
                if (type.k === "array" && v.value.length !== type.v.len) {
                    ctx.raiseAt(
                        p,
                        `expected '${typeName(type)}', but array literal has ${v.value.length} elements`,
                    )
                    return ERROR
                }

                const child = type.k === "slice" ? type.v : type.v.child

                const values: Value[] = []
                for (const el of v.value) {
                    const result = exprAs(ctx, comptime, child, el)
                    if (result.k !== "normal") return ERROR

                    values.push(result.v.value)
                }

                return normal(type, { k: "array", v: values })
            }

            if (type !== null && type.k === "tuple") {
                if (v.value.length !== type.v.length) {
                    ctx.raiseAt(
                        p,
                        `expected '${typeName(type)}', but tuple literal has ${v.value.length} elements`,
                    )
                    return ERROR
                }

                const values: Value[] = []
                for (let i = 0; i < type.v.length; i++) {
                    const result = exprAs(ctx, comptime, type.v[i]!, v.value[i]!)
                    if (result.k !== "normal") return ERROR

                    values.push(result.v.value)
                }

                return normal(type, { k: "array", v: values })
            }

            const types: Type[] = []
            const values: Value[] = []
            for (let i = 0; i < v.value.length; i++) {
                const result = expr(ctx, comptime, null, v.value[i]!)
                if (result.k !== "normal") return ERROR

                types.push(result.v.type)
                values.push(result.v.value)
            }

            return normal({ k: "tuple", v: types }, { k: "array", v: values })
        }

        case "dot-record": {
            if (type === null) {
                ctx.todo(p, `record literal syntax requires an expected type`)
                return ERROR
            }

            type = innerType(type)

            if (!(type.k === "struct" || type.k === "union")) {
                ctx.raiseAt(
                    p,
                    `record literal syntax requires the expected type to be a struct or union`,
                )
                return ERROR
            }

            if (type.k === "union") {
                if (v.value.length !== 1) {
                    ctx.raiseAt(
                        p,
                        `record literal must specify exactly one field when expected type is a union`,
                    )
                    return ERROR
                }

                const members = resolveUnion(type.v)
                if (members === null) return ERROR

                const { name, value: valueRaw } = v.value[0]!

                if (!members.has(name.name)) {
                    ctx.raiseAt(name, `'${typeName(type)}' does not have variant '${name.name}'`)
                    return ERROR
                }

                const member = members.get(name.name)!

                const value = exprAs(ctx, comptime, member, valueRaw)
                if (value.k !== "normal") return ERROR

                return normal(type, { k: "union", v: { k: name.name, v: value.v.value } })
            }

            const members = resolveStruct(type.v)
            if (members === null) return ERROR

            const map = new Map<string, Value>()
            for (const {
                name: { name },
                value: valueRaw,
            } of v.value) {
                if (!members.has(name)) {
                    ctx.raiseAt(
                        p,
                        `struct '${typeName(type)}' does not have a field named '${name}'`,
                    )
                    return ERROR
                }

                const fieldType = members.get(name)!

                const value = exprAs(ctx, comptime, fieldType.type, valueRaw)
                if (value.k !== "normal") return value

                map.set(name, value.v.value)
            }

            for (const [key, { default: defaultValue }] of members) {
                if (map.has(key)) continue

                if (defaultValue === null) {
                    ctx.raiseAt(
                        p,
                        `field '${key}' is missing from record literal of type '${typeName(type)}'`,
                    )
                    return ERROR
                }

                map.set(key, defaultValue.value)
            }

            return normal(type, { k: "struct", v: map })
        }

        case "dot-empty": {
            if (type !== null) type = innerType(type)

            if (type !== null && (type.k === "array" || type.k === "slice")) {
                if (type.k === "array" && type.v.len !== 0) {
                    ctx.raiseAt(p, `expected '${typeName(type)}', but array literal has 0 elements`)
                    return ERROR
                }

                return normal(type, { k: "array", v: [] })
            }

            if (type !== null && type.k === "tuple") {
                if (type.v.length !== 0) {
                    ctx.raiseAt(p, `expected '${typeName(type)}', but tuple literal has 0 elements`)
                    return ERROR
                }

                return normal(type, { k: "array", v: [] })
            }

            if (type !== null && type.k === "struct") {
                ctx.todo(p, "struct with all default fields")
            }

            return normal({ k: "tuple", v: [] }, { k: "array", v: [] })
        }

        case "dot-field": {
            if (type === null) {
                ctx.raiseAt(p, `'.xyz' syntax requires an expected type`)
                return ERROR
            }

            const value = getProp(ctx, type, p, v.name)
            if (value === null) return ERROR
            return { k: "normal", v: value }
        }

        case "dot-method":
        case "dot-call":
        case "op-prefix":
        case "op-infix":
            break

        case "cf-unreachable": {
            if (comptime) {
                ctx.raiseAt(p, "reached 'unreachable'")
                return ERROR
            }

            ctx.rtInst("cf-unreachable", null)
            return { k: "unreachable", v: null }
        }

        case "cf-and":
        case "cf-or":
        case "cf-orelse":
        case "cf-maybe":
        case "cf-if":
        case "cf-switch":
        case "cf-for":
        case "cf-while":
        case "cf-break":
        case "cf-continue":
            break

        case "cf-return": {
            if (ctx.returnType === null) {
                ctx.raiseAt(p, `'return' statement outside of function body`)
                return ERROR
            }

            if (v.value === null) {
                const value = as(ctx, p, ctx.returnType, {
                    type: { k: "void", v: null },
                    value: { k: "void", v: null },
                })
                if (value === null) return ERROR

                return { k: "return", v: value }
            }

            const value = exprAs(ctx, comptime, ctx.returnType, v.value)
            if (value.k !== "normal") return value

            return { k: "return", v: value.v }
        }

        case "cf-comptime":
        case "get-prop":
        case "get-method":
        case "get-index":
            break

        case "get-call": {
            if (v.target.k === "ident") {
                if (isReservedIdent(v.target.v)) {
                    ctx.raiseAt(p, `cannot call builtin identifier '${v.target.v}'`)
                    return ERROR
                }

                if (ctx.variables.has(v.target.v.name)) {
                    ctx.todo(p, "calling variables")
                    return ERROR
                }

                const item = ctx.ns.items.get(v.target.v.name)
                if (item.k !== "fn") {
                    ctx.todo(p, "calling non-fns")
                    return ERROR
                }

                return call(
                    ctx,
                    comptime,
                    p,
                    item.v,
                    v.args.map((x) => ({ p: x, evaluated: false, value: x })),
                )
            }

            ctx.todo(p, "calling non-identifiers")
            return ERROR
        }

        case "get-unwrap": {
            const inner = expr(ctx, comptime, type ? { k: "optional", v: type } : null, v.target)
            if (inner.k !== "normal") return inner

            if (inner.v.type.k !== "optional") {
                ctx.raiseAt(p, `expected optional type, but got '${typeName(inner.v.type)}'`)
                return ERROR
            }

            if (inner.v.value.k === "null") {
                ctx.raiseAt(p, "unwrapped 'null'")
                return ERROR
            }

            if (inner.v.value.k === "some") {
                return normal(inner.v.type.v, inner.v.value.v)
            }

            assert(inner.v.value.k === "runtime")
            assert(!comptime)

            return ctx.rtResult(inner.v.type.v, "get-unwrap", inner.v.value.v)
        }

        case "block": {
            if (v.label !== null) {
                ctx.todo(p, "labeled block")
                return ERROR
            }

            for (const el of v.body) {
                const ret = stmt(ctx, comptime, el)
                if (ret.k !== "normal") return ret
            }

            return normal({ k: "void", v: null }, { k: "void", v: null })
        }

        case "builtin":
            return builtin(ctx, comptime, type, p, v.name, v.args)

        case "ident": {
            if (isReservedIdent(v)) {
                switch (v.name) {
                    case "never":
                    case "void":
                    case "comptime_int":
                    case "comptime_float":
                    case "str":
                    case "path":
                    case "type":
                        return normalType({ k: v.name, v: null })

                    case "null":
                        return normal({ k: "null", v: null }, { k: "null", v: null })

                    case "true":
                    case "false":
                        return normal({ k: "bool", v: null }, { k: "bool", v: v.name === "true" })

                    case "inf":
                    case "nan": {
                        const value: Value = {
                            k: "float",
                            v: v.name === "inf" ? Infinity : NaN,
                        }

                        if (type !== null && type.k === "f") {
                            return normal(type, value)
                        }

                        return normal({ k: "comptime_float", v: null }, value)
                    }
                }

                if (/^u\d+/.test(v.name)) {
                    const bits = Number(v.name.slice(1))
                    if (bits >= 2n ** 16n) {
                        ctx.raiseAt(p, `integers can only have at most 65535 bits`)
                        return ERROR
                    }

                    return normalType({ k: "u", v: bits })
                }

                if (/^i\d+/.test(v.name)) {
                    const bits = Number(v.name.slice(1))
                    if (bits >= 2n ** 16n) {
                        ctx.raiseAt(p, `integers can only have at most 65535 bits`)
                        return ERROR
                    }

                    return normalType({ k: "i", v: bits })
                }

                if (/^f\d+/.test(v.name)) {
                    const bits = Number(v.name.slice(1))
                    if (!FLOAT_BIT_SIZES.includes(bits as any)) {
                        ctx.raiseAt(p, `invalid number of bits for floating-point number type`)
                        return ERROR
                    }

                    return normalType({ k: "f", v: bits as FloatBitSize })
                }

                ctx.raiseAt(p, `'${v.name}' is not defined`)
            }

            if (ctx.variables.has(v.name)) {
                const value = ctx.getVariable(comptime, p, v.name)
                if (value === null) return ERROR

                return { k: "normal", v: value }
            }

            ctx.todo(p, "non-local identifiers")
            return ERROR
        }

        case "underscore":
            ctx.raiseAt(p, "'_' cannot be used as an expression")
            break

        case "closure":
            break

        case "paren":
            return expr(ctx, comptime, type, v)
    }

    ctx.todo(p)
    return { k: "error", v: null }
}

export function builtin(
    ctx: EvaluationContext,
    comptime: boolean,
    type: Type | null,
    p: Range,
    name: string,
    args: Expr[],
): Result<TypedValue> {
    switch (name) {
        case "as": {
            if (args.length !== 2) {
                ctx.raiseAt(p, `'@as(...)' requires exactly two arguments`)
                return ERROR
            }

            const type = exprAsType(ctx, args[0]!)
            if (type.k !== "normal") return type

            return exprAs(ctx, comptime, type.v, args[1]!)
        }

        case "compileError": {
            if (args.length !== 1) {
                ctx.raiseAt(p, `'@compileError(...)' requires exactly one argument`)
                return ERROR
            }

            const type = exprAs(ctx, true, { k: "str", v: null }, args[0]!)
            if (type.k !== "normal") return type

            assert(type.v.value.k === "str")
            ctx.raiseAt(p, type.v.value.v)
            return ERROR
        }

        case "compileLog": {
            if (args.length !== 1) {
                ctx.raiseAt(p, `'@compileLog(...)' requires exactly one argument`)
                return ERROR
            }

            const value = expr(ctx, true, null, args[0]!)
            if (value.k !== "normal") return value

            ctx.raiseAt(p, reset + debug(value.v) + red)
            return ERROR
        }

        case "runtime": {
            if (args.length !== 1) {
                ctx.raiseAt(p, `'@runtime(...)' requires exactly one argument`)
                return ERROR
            }

            if (comptime) {
                ctx.raiseAt(p, `'@runtime(...)' cannot be used at comptime`)
                return ERROR
            }

            const value = expr(ctx, comptime, type, args[0]!)
            if (value.k !== "normal") return value

            if (!isRuntimeType(ctx.ns.root, value.v.type)) {
                ctx.raiseAt(p, `type '${typeName(value.v.type)}' is comptime-only`)
                return ERROR
            }

            return ctx.makeRuntimeResult(p, value.v)
        }

        case "This": {
            if (args.length !== 0) {
                ctx.raiseAt(p, `'@This()' does not accept any arguments`)
                return ERROR
            }

            return normalType(ctx.ns.self)
        }

        case "Tuple": {
            if (args.length !== 1) {
                ctx.raiseAt(p, `'@Tuple(...)' required exactly one argument`)
                return ERROR
            }

            const result = exprAs(ctx, true, { k: "slice", v: { k: "type", v: null } }, args[0]!)
            if (result.k !== "normal") return result
            assert(result.v.value.k === "array")

            const types: Type[] = []
            for (const el of result.v.value.v) {
                assert(el.k === "type")
                types.push(el.v)
            }

            return normalType({ k: "tuple", v: types })
        }

        case "TypeOf": {
            if (args.length !== 1) {
                ctx.raiseAt(p, `'@TypeOf(...)' requires exactly one argument`)
                return ERROR
            }

            const value = expr(ctx, comptime, null, args[0]!)
            if (value.k !== "normal") return value

            return normalType(value.v.type)
        }
    }

    ctx.raiseAt(p, `'@${name}' does not exist or is not implemented`)
    return ERROR
}

export function stmt(ctx: EvaluationContext, comptime: boolean, p: Stmt): Result<null> {
    const { k, v } = p

    if (k === "expr") {
        const result = exprAs(ctx, comptime, { k: "void", v: null }, v)
        if (result.k !== "normal") return result

        return { k: "normal", v: null }
    }

    ctx.todo(p, "assignments are not supported")
    return { k: "error", v: null }
}

/** Returns `false` on error. */
function finalizeNamespace(
    ns: Namespace,
    memberKind: "field" | "variant",
    members: Map<string, unknown>,
    ps: Decl[],
): boolean {
    const comptime: Expr[] = []

    for (const { k, v, s, e } of ps) {
        switch (k) {
            case "field-ident":
            case "field-plain":
                // `resolveNamespaceDecls` ignores these
                break

            case "comptime":
                comptime.push(v)
                break

            case "test":
                if (ns.root.tests !== null) {
                    ns.root.tests.push({ ns: ns, id: v.id as TID, name: v.name, body: v.body })
                }
                break

            case "const":
            case "var":
                if (isReservedIdent(v.name)) {
                    ns.raiseAt(v.name, "declaration shadows a reserved identifier")
                    return false
                }
                if (members.has(v.name.name)) {
                    ns.raiseAt(v.name, `declaration cannot have same name as ${memberKind}`)
                    return false
                }
                if (ns.items.has(v.name.name)) {
                    ns.raiseAt(v.name, "declaration shadows a name from an outer scope")
                    return false
                }
                ns.items.setOwn(v.name.name, {
                    k,
                    v: { k: "raw", v: { ns: ns, type: v.type, value: v.body } },
                })
                break

            case "fn":
                if (!v.name) {
                    ns.todo({ s, e }, "functions must have names")
                    return false
                }
                if (isReservedIdent(v.name)) {
                    ns.raiseAt(v.name, "declaration shadows a reserved identifier")
                    return false
                }
                if (members.has(v.name.name)) {
                    ns.raiseAt(v.name, `declaration cannot have same name as ${memberKind}`)
                    return false
                }
                if (ns.items.has(v.name.name)) {
                    ns.raiseAt(v.name, "declaration shadows a name from an outer scope")
                    return false
                }
                ns.items.setOwn(v.name.name, {
                    k: "fn",
                    v: new Fn(ns, v.id as FID, v.params, v.ret, v.body),
                })
                break

            default:
                k satisfies never
        }
    }

    for (const p of comptime) {
        const ret = exprAs(ns.createEvaluationContext(), true, { k: "void", v: null }, p)
        if (ret.k === "error") return false
        assert(ret.k === "normal")
    }

    return true
}

function isReservedIdent(ident: Ident): boolean {
    return (
        !ident.raw
        && /^(?:[uif]\d+|comptime_.*|never|void|bool|str|path|type|null|true|false|inf|nan)$/.test(
            ident.name,
        )
    )
}

function typeEq(a: Type, b: Type): boolean {
    if (a === b) return true
    if (a.k !== b.k) return false

    switch (a.k) {
        case "never":
        case "void":
        case "bool":
        case "comptime_int":
        case "comptime_float":
        case "str":
        case "path":
        case "null":
        case "type":
            return true

        case "u":
        case "i":
        case "f":
            return a.v === b.v

        case "optional":
        case "slice":
            assert(a.k === b.k)
            return typeEq(a.v, b.v)

        case "array":
            assert(a.k === b.k)
            return a.v.len === b.v.len && typeEq(a.v.child, b.v.child)

        case "tuple":
            assert(a.k === b.k)
            return a.v.length === b.v.length && a.v.every((_, i) => typeEq(a.v[i]!, b.v[i]!))

        case "fn":
            assert(a.k === b.k)
            return (
                a.v.params.length === b.v.params.length
                && a.v.params.every((_, i) => typeEqOrBothNull(a.v.params[i]!, b.v.params[i]!))
                && typeEqOrBothNull(a.v.ret, b.v.ret)
            )

        case "struct":
        case "enum":
        case "union":
        case "opaque":
            assert(a.k === b.k)
            if (a.v.id !== b.v.id) return false
            assert(a.v.captures.length === b.v.captures.length)
            return a.v.captures.every((_, i) => {
                const av = a.v.captures[i]!
                const bv = b.v.captures[i]!

                return (
                    av.k === "runtime-var" && bv.k === "runtime-var" ? av.v === bv.v
                    : av.k === "runtime-var" || bv.k === "runtime-var" ? false
                    : valueEq(av, bv)
                )
            })
    }
}

function typeEqOrBothNull(a: Type | null, b: Type | null): boolean {
    if (a === null && b === null) return true
    if (a === null || b === null) return false
    return typeEq(a, b)
}

/** Only for comptime-known values. Assumes corresponding types are equal. */
function valueEq(a: Value, b: Value): boolean {
    assert(a.k !== "runtime")
    assert(b.k !== "runtime")

    if (a === b) return true

    if (a.k !== b.k) {
        if (a.k === "array" && b.k === "array-u8") {
            assert(a.v.every((x) => x.k === "int" && x.v >= 0n && x.v < 256n))
            return a.v.length === b.v.length && a.v.every((_, i) => Number(a.v[i]!) === b.v[i]!)
        }
        if (a.k === "array-u8" && b.k === "array") {
            assert(b.v.every((x) => x.k === "int" && x.v >= 0n && x.v < 256n))
            return a.v.length === b.v.length && a.v.every((_, i) => a.v[i]! === Number(b.v[i]!))
        }

        return false
    }

    switch (a.k) {
        case "void":
        case "null":
            return true

        case "bool":
        case "int":
        case "float":
        case "str":
            return a.v === b.v

        case "some":
            assert(a.k === b.k)
            return valueEq(a.v, b.v)

        case "array":
            assert(a.k === b.k)
            if (a.v.length !== b.v.length) return false // necessary for slices, assertion for arrays and tuples
            return a.v.every((_, i) => valueEq(a.v[i]!, b.v[i]!))

        case "array-u8":
            assert(a.k === b.k)
            if (a.v.length !== b.v.length) return false // necessary for slices, assertion for arrays
            return a.v.every((_, i) => a.v[i]! === b.v[i]!)

        case "fn":
            assert(a.k === b.k)
            return a.v.id === b.v.id && typeEq(a.v.ns.self, b.v.ns.self) // ensure namespaces have equal captures

        case "type":
            assert(a.k === b.k)
            return typeEq(a.v, b.v)

        case "struct":
            assert(a.k === b.k)
            assert(a.v.size === b.v.size)
            for (const [key, aval] of a.v) {
                assert(b.v.has(key))
                const bval = b.v.get(key)!
                if (!valueEq(aval, bval)) return false
            }
            return true

        case "union":
            assert(a.k === b.k)
            return a.v.k === b.v.k && valueEq(a.v.v, b.v.v)
    }
}

/** Whether a value is fully comptime-known. */
function isComptimeValue(value: Value): boolean {
    const { k, v } = value

    switch (k) {
        case "runtime":
            return false

        case "void":
        case "bool":
        case "int":
        case "float":
        case "str":
        case "null":
        case "array-u8":
        case "fn":
        case "type":
            return true

        case "some":
            return isComptimeValue(v)

        case "array":
            return v.every(isComptimeValue)

        case "struct":
            for (const el of v.values()) {
                if (!isComptimeValue(el)) {
                    return false
                }
            }
            return true

        case "union":
            return isComptimeValue(v.v)
    }
}

/**
 * Whether a type can be used at runtime.
 *
 * Returns `null` on compile error. Currently, this only happens if `isRuntimeType` encounters an
 * unanalyzed `struct` or `union`, then errors while resolving its members.
 */
function isRuntimeType(root: Root, type: Type): boolean | null {
    const { k, v } = type

    switch (k) {
        case "never":
        case "void":
        case "bool":
        case "u":
        case "i":
        case "f":
        case "str":
        case "null":
        case "enum":
        case "opaque":
            return true

        case "comptime_int":
        case "comptime_float":
        case "path":
        case "fn":
        case "type":
            return false

        case "optional":
        case "slice":
            return isRuntimeType(root, v)

        case "array":
            return isRuntimeType(root, v.child)

        case "tuple": {
            for (const el of v) {
                const rt = isRuntimeType(root, el)
                if (rt !== true) return rt
            }
            return true
        }

        case "struct": {
            const fields = resolveStruct(type.v)
            if (fields === null) return null

            for (const el of fields.values()) {
                const rt = isRuntimeType(root, el.type)
                if (rt !== true) return rt
            }
            return true
        }

        case "union": {
            const fields = resolveUnion(type.v)
            if (fields === null) return null

            for (const el of fields.values()) {
                const rt = isRuntimeType(root, el)
                if (rt !== true) return rt
            }
            return true
        }
    }
}

function getCaptures(parent: EvaluationContext, body: Decl[]): Capture[] | null {
    const capturable = new Map<string, boolean>()

    for (const [k, v] of parent.ns.items) {
        if (v.k === "const" || v.k === "var") {
            capturable.set(k, true)
        }
    }

    for (const [k, v] of parent.variables) {
        if (v.k === "comptime-const") {
            capturable.set(k, true)
        }
    }

    for (const el of body) {
        decl(capturable, el)
    }

    const captures: Capture[] = []

    for (const [k, v] of capturable) {
        if (!v) continue

        if (parent.variables.has(k)) {
            const variable = parent.variables.get(k)!
            assert(variable.k === "comptime-const")
            captures.push(variable.v.value)
            continue
        }

        const item = parent.ns.items.get(k)
        assert(item.k === "const" || item.k === "var")

        if (item.k === "const") {
            const resolved = resolveConst(item)
            if (resolved === null) return null
            captures.push(resolved.value)
        } else {
            const resolved = resolveVar(item)
            if (resolved === null) return null
            captures.push({ k: "runtime-var", v: resolved.id })
        }
    }

    return captures
}

function resolveConst(item: Extract<Item, { k: "const" }>): TypedValue | null {
    if (item.v.k === "analyzed") {
        return item.v.v
    }

    if (item.v.k === "progressing") {
        item.v.v.ns.raiseAt(item.v.v.p, "dependency loop when analyzing 'const' declaration")
        return null
    }

    const v = item.v.v
    item.v = { k: "progressing", v: { ns: v.ns, p: v.value } }

    const value = topLevelValue(v.ns, v.type, v.value)
    if (value === null) return null

    item.v = { k: "analyzed", v: value }
    return value
}

function resolveVar(item: Extract<Item, { k: "var" }>): { type: Type; id: GID } | null {
    if (item.v.k === "analyzed") {
        return item.v.v
    }

    if (item.v.k === "progressing") {
        item.v.v.ns.raiseAt(item.v.v.p, "dependency loop when analyzing 'var' declaration")
        return null
    }

    const v = item.v.v
    item.v = { k: "progressing", v: { ns: v.ns, p: v.value } }

    const value = topLevelValue(v.ns, v.type, v.value)
    if (value === null) return null

    if (!isRuntimeType(v.ns.root, value.type)) {
        v.ns.raiseAt(v.value, `type '${typeName(value.type)}' cannot be used at runtime`)
    }

    const gid = nextId++ as GID
    v.ns.root.globalVars.set(gid, value)

    item.v = { k: "analyzed", v: { type: value.type, id: gid } }
    return item.v.v
}

function resolveEnum(item: Enum): Map<string, bigint> | null {
    if (item.members.k === "analyzed") {
        return item.members.v
    }

    if (item.members.k === "progressing") {
        item.members.v.ns.raiseAt(
            item.members.v.p,
            "dependency loop when analyzing 'enum' variants",
        )
        return null
    }

    const membersRaw = item.members.v
    item.members = { k: "progressing", v: { ns: item.ns, p: item.p } }

    const ret = new Map<string, bigint>()
    const assigned = new Map<bigint, string>()
    let next = 0n
    for (const [k, v] of membersRaw) {
        if (v === null) {
            const value = next++
            if (assigned.has(value)) {
                item.ns.raiseAt(
                    item.p,
                    `enum variant '${k}' has the same value as variant '${assigned.get(value)}'`,
                )
                return null
            }

            ret.set(k, value)
            assigned.set(value, k)
            continue
        }

        const value = topLevelValueAs(item.ns, item.ns.self, v)
        if (value === null) return null

        assert(value.value.k === "int")
        if (assigned.has(value.value.v)) {
            item.ns.raiseAt(
                item.p,
                `enum variant '${k}' has the same value as variant '${assigned.get(value.value.v)}'`,
            )
            return null
        }
        ret.set(k, value.value.v)
        assigned.set(value.value.v, k)
        next = value.value.v + 1n
    }

    item.members = { k: "analyzed", v: ret }
    return item.members.v
}

function resolveStruct(
    item: Struct,
): Map<string, { type: Type; default: TypedValue | null }> | null {
    if (item.members.k === "analyzed") {
        return item.members.v
    }

    if (item.members.k === "progressing") {
        item.members.v.ns.raiseAt(
            item.members.v.p,
            "dependency loop when analyzing 'struct' fields",
        )
        return null
    }

    const membersRaw = item.members.v
    item.members = { k: "progressing", v: { ns: item.ns, p: item.p } }

    const ret = new Map<string, { type: Type; default: TypedValue | null }>()
    for (const [k, { type: typeRaw, default: defaultRaw }] of membersRaw) {
        const type = topLevelType(item.ns, typeRaw)
        if (type === null) return null

        let defaultValue: TypedValue | null = null
        if (defaultRaw !== null) {
            const result = topLevelValueAs(item.ns, type, defaultRaw)
            if (result === null) return null

            defaultValue = result
        }

        ret.set(k, { type, default: defaultValue })
    }

    item.members = { k: "analyzed", v: ret }
    return item.members.v
}

function resolveUnion(item: Union): Map<string, Type> | null {
    if (item.members.k === "analyzed") {
        return item.members.v
    }

    if (item.members.k === "progressing") {
        item.members.v.ns.raiseAt(
            item.members.v.p,
            "dependency loop when analyzing 'union' variants",
        )
        return null
    }

    const membersRaw = item.members.v
    item.members = { k: "progressing", v: { ns: item.ns, p: item.p } }

    const ret = new Map<string, Type>()
    for (const [k, typeRaw] of membersRaw) {
        if (typeRaw === null) {
            ret.set(k, { k: "void", v: null })
            continue
        }

        const type = topLevelType(item.ns, typeRaw)
        if (type === null) return null
        ret.set(k, type)
    }

    item.members = { k: "analyzed", v: ret }
    return item.members.v
}

function topLevelType(ns: Namespace, p: Expr): Type | null {
    const val = exprAsType(ns.createEvaluationContext(), p)
    if (val.k === "error") return null
    assert(val.k === "normal")
    return val.v
}

function topLevelValue(ns: Namespace, type: Expr | null, value: Expr): TypedValue | null {
    const ctx = ns.createEvaluationContext()

    if (type === null) {
        const result = expr(ctx, true, type, value)
        if (result.k === "error") return null
        assert(result.k === "normal")
        return result.v
    }

    const ty = topLevelType(ns, type)
    if (ty === null) return null

    const result = exprAs(ctx, true, ty, value)
    if (result.k === "error") return null
    assert(result.k === "normal")
    return result.v
}

function topLevelValueAs(ns: Namespace, type: Type, value: Expr): TypedValue | null {
    const ctx = ns.createEvaluationContext()

    const result = exprAs(ctx, true, type, value)
    if (result.k === "error") return null
    assert(result.k === "normal")
    return result.v
}

/** Guaranteed to run at `comptime`. */
function getProp(ctx: EvaluationContext, type: Type, p: Range, name: string): TypedValue | null {
    type = innerType(type)

    if (!(type.k === "struct" || type.k === "enum" || type.k === "union" || type.k === "opaque")) {
        ctx.raiseAt(p, `'.xyz' syntax cannot be used when the expected type is '${typeName(type)}'`)
        return null
    }

    if (type.k === "enum") {
        const members = resolveEnum(type.v)
        if (members === null) return null

        if (members.has(name)) {
            return { type, value: { k: "int", v: members.get(name)! } }
        }
    }

    if (type.k === "union") {
        const members = resolveUnion(type.v)
        if (members === null) return null

        if (members.has(name)) {
            const memberType = members.get(name)!
            if (memberType.k !== "void") {
                ctx.raiseAt(
                    p,
                    `variant '${name}' of union '${typeName(type)}' has non-void type '${typeName(memberType)}', so dot literal syntax cannot be used`,
                )
                return null
            }

            return { type, value: { k: "union", v: { k: name, v: { k: "void", v: null } } } }
        }
    }

    if (!type.v.ns.items.hasOwn(name)) {
        ctx.raiseAt(p, `type '${typeName(type)}' does not have a declaration named '${name}'`)
        return null
    }

    const item = type.v.ns.items.getOwn(name)

    switch (item.k) {
        case "fn":
            ctx.todo(p, `functions are not real values yet`)
            return null

        case "const":
            return resolveConst(item)

        case "var":
            ctx.raiseAt(p, `'.xyz' syntax cannot be used to access variables`)
            return null

        case "reserved":
            unreachable()
    }
}

function encodeStr(ctx: EvaluationContext, type: Type, p: Range, v: string): TypedValue | null {
    type = innerType(type)

    if (type.k === "path") {
        return { type, value: { k: "str", v } }
    }

    if (type.k === "str") {
        return { type, value: { k: "str", v } }
    }

    if (type.k === "array" && type.v.child.k === "u") {
        if (type.v.child.k !== "u" || !(type.v.child.v === 7 || type.v.child.v === 8)) {
            ctx.raiseAt(p, `string literals only coerce into arrays of 'u7' or 'u8'`)
            return null
        }

        const body = new TextEncoder().encode(v)

        if (body.length !== type.v.len) {
            ctx.raiseAt(p, `expected '${typeName(type)}', but string has ${body.length} bytes`)
            return null
        }

        if (type.v.child.v === 7 && !body.every((x) => x < 128)) {
            ctx.raiseAt(p, `expected '${typeName(type)}', but string has non-ASCII bytes`)
            return null
        }

        return { type, value: { k: "array-u8", v: body } }
    }

    if (type.k === "slice" && type.v.k === "u") {
        if (type.v.k !== "u" || !(type.v.v === 7 || type.v.v === 8)) {
            ctx.raiseAt(p, `string literals only coerce into arrays of 'u7' or 'u8'`)
            return null
        }

        const body = new TextEncoder().encode(v)

        if (type.v.v === 7 && !body.every((x) => x < 128)) {
            ctx.raiseAt(p, `expected '${typeName(type)}', but string has non-ASCII bytes`)
            return null
        }

        return { type, value: { k: "array-u8", v: body } }
    }

    ctx.raiseAt(p, `expected '${typeName(type)}', but found string literal`)
    return null
}

export function topLevel(root: Root, file: File, body: Decl[]): Type | null {
    const members = new Map<string, { type: Expr; default: Expr | null }>()
    for (const p of body) {
        if (p.k === "field-ident") {
            root.raiseAt(file, p, "expected type of struct field")
            return null
        }

        if (p.k === "field-plain") {
            if (members.has(p.v.name.name)) {
                root.raiseAt(file, p, "struct field declared twice")
                return null
            }

            members.set(p.v.name.name, { type: p.v.type, default: p.v.default })
        }
    }

    const struct: Struct = {
        id: ((file.id << 1) + 1) as AID,
        p: { s: 0, e: file.body.length },
        captures: [],
        ns: null!,
        members: { k: "raw", v: members },
    }
    const ns = root.createNamespace(file, { k: "struct", v: struct })
    struct.ns = ns

    if (!finalizeNamespace(ns, "field", members, body)) return null
    return ns.self
}

interface CompiledTest {
    body: RuntimeInst[]
    value: TypedValue | null
}

export function compileTests(root: Root): CompiledTest[] | null {
    assert(root.tests !== null)

    const alreadyRun = new Map<number, Type[]>()
    const ret: CompiledTest[] = []

    for (let i = 0; i < root.tests.length; i++) {
        const test = root.tests[i]!

        if (alreadyRun.has(test.id)) {
            const previousContexts = alreadyRun.get(test.id)!
            if (previousContexts.some((x) => typeEq(x, test.ns.self))) {
                continue
            }
        }

        const ctx = test.ns.createEvaluationContext()
        const value = expr(ctx, false, null, test.body)
        if (value.k === "error") return null
        assert(value.k === "normal" || value.k === "unreachable")

        alreadyRun.getOrInsert(test.id, []).push(test.ns.self)

        ret.push({ body: ctx.runtime, value: value.v })
    }

    return ret
}

type FnArg =
    | { p: Range; evaluated: true; value: TypedValue }
    | { p: Range; evaluated: false; value: Expr }

/** `null` is for errors. */
function call(
    ctx: EvaluationContext,
    comptime: boolean,
    p: Range,
    f: Fn,
    argsRaw: FnArg[],
): Result<TypedValue> {
    if (argsRaw.length !== f.params.length) {
        ctx.raiseAt(
            p,
            `function requires ${f.params.length} parameter(s), but caller specified ${argsRaw.length}`,
        )
        return ERROR
    }

    const callContext = f.ns.createEvaluationContext()

    const comptimeArgs: TypedValue[] = []
    const runtimeArgTypes: Type[] = []
    const runtimeRII: RII[] = []
    let lastComptimeArg: number | null = null

    for (let i = 0; i < f.params.length; i++) {
        const param = f.params[i]!

        const paramType = exprAsType(callContext, param.type)
        if (paramType.k === "error") return ERROR
        assert(paramType.k === "normal")

        const paramComptime = comptime || param.comptime || !isRuntimeType(ctx.ns.root, paramType.v)

        const raw = argsRaw[i]!

        let arg: TypedValue
        if (raw.evaluated) {
            const result = as(ctx, raw.p, paramType.v, raw.value)
            if (result === null) return ERROR
            if (paramComptime && !isComptimeValue(result.value)) {
                ctx.raiseAt(raw.p, `function parameter cannot be resolved at comptime`)
                return ERROR
            }
            arg = result
        } else {
            const result = exprAs(ctx, paramComptime, paramType.v, raw.value)
            if (result.k !== "normal") return result
            assert(!(paramComptime && !isComptimeValue(result.v.value)))
            arg = result.v
        }

        if (paramComptime) {
            comptimeArgs.push(arg)
            lastComptimeArg = i
        }
        if (param.name !== null) {
            if (paramComptime) {
                callContext.variables.set(param.name.name, { k: "comptime-const", v: arg })
            } else {
                callContext.variables.set(param.name.name, {
                    k: "const",
                    v: {
                        type: arg.type,
                        n: callContext.rtInst("arg-load", runtimeArgTypes.length),
                    },
                })
                runtimeArgTypes.push(arg.type)
                const rii = ctx.makeRuntime(p, arg)
                if (rii === null) return ERROR
                runtimeRII.push(rii)
            }
        }
    }

    const returnType = exprAsType(callContext, f.returnType)
    if (returnType.k === "error") return ERROR
    assert(returnType.k === "normal")

    if (comptime || !isRuntimeType(ctx.ns.root, returnType.v)) {
        assert(runtimeArgTypes.length === 0)
        const result = exprCall(callContext, comptime, returnType.v, f.body)
        assert(result.k === "normal" || result.k === "error")
        return result
    }

    const instances = ctx.ns.root.fns.getOrInsert(f.id, [])
    findExisting: for (let i = 0; i < instances.length; i++) {
        const el = instances[i]!

        if (!typeEq(el.ns.self, f.ns.self)) continue
        if (el.comptimeArgs.length !== comptimeArgs.length) continue

        for (let i = 0; i < comptimeArgs.length; i++) {
            const expected = el.comptimeArgs[i]!
            const actual = comptimeArgs[i]!

            if (!typeEq(expected.type, actual.type)) continue findExisting
            if (!valueEq(expected.value, actual.value)) continue findExisting
        }

        assert(runtimeArgTypes.length === el.runtimeArgs.length)
        for (let i = 0; i < el.runtimeArgs.length; i++) {
            assert(typeEq(el.runtimeArgs[i]!, runtimeArgTypes[i]!))
        }
        assert(typeEq(el.returnType, returnType.v))

        return ctx.rtResult(el.returnType, "fn-call", {
            f: f.id,
            i: i as IID,
            args: runtimeRII,
        })
    }

    const result = exprCall(callContext, false, returnType.v, f.body)
    assert(result.k === "normal" || result.k === "error" || result.k === "unreachable")
    if (result.k === "error") return ERROR
    if (result.k === "normal") {
        const rii = callContext.makeRuntime({ s: f.body.e, e: f.body.e }, result.v)
        if (rii === null) return ERROR
        callContext.rtInst("cf-return", rii)
    }

    const instance: FnInstance = {
        ns: f.ns,
        comptimeArgs,
        runtimeArgs: runtimeArgTypes,
        returnType: returnType.v,
        body: callContext.runtime,
    }
    instances.push(instance)
    return ctx.rtResult(returnType.v, "fn-call", {
        f: f.id,
        i: (instances.length - 1) as IID,
        args: runtimeRII,
    })
}

function exprCall(
    ctx: EvaluationContext,
    comptime: boolean,
    returnType: Type,
    body: Expr,
): Result<TypedValue> {
    ctx.returnType = returnType

    const result = exprAs(ctx, comptime, { k: "void", v: null }, body)
    if (result.k === "error" || result.k === "unreachable") return result
    if (result.k === "return") return { k: "normal", v: result.v }

    const voidCast = as(ctx, { s: body.e, e: body.e }, returnType, {
        type: { k: "void", v: null },
        value: { k: "void", v: null },
    })
    if (voidCast === null) return ERROR
    return { k: "normal", v: voidCast }
}
