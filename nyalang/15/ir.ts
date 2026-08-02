import { assert } from "./assert"
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
    | { k: "str"; v: string } // type = str
    | { k: "null"; v: null } // type = null, optional(T)
    | { k: "some"; v: Value } // type = optional(T)
    | { k: "array"; v: Value[] } // type = array, slice, tuple
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
    | { k: "progressing"; v: { ns: NamespaceContext; p: Range } }
    | { k: "analyzed"; v: Analyzed }

type Capture = Value | { k: "runtime-var"; v: GID }

interface Struct {
    id: AID
    p: Range
    captures: Capture[]
    ns: NamespaceContext
    members: Lazy<
        Map<string, { type: Expr; default: Expr | null }>,
        Map<string, { type: Type; default: TypedValue | null }>
    >
}

interface Enum {
    id: AID
    p: Range
    captures: Capture[]
    ns: NamespaceContext
    backingInt: Type
    members: Lazy<Map<string, Expr | null>, Map<string, bigint>>
}

interface Union {
    id: AID
    p: Range
    captures: Capture[]
    ns: NamespaceContext
    tag: Type & { k: "enum" }
    members: Lazy<Map<string, Expr | null>, Map<string, Type>>
}

interface Opaque {
    id: AID
    p: Range
    captures: Capture[]
    ns: NamespaceContext
}

class Fn {
    constructor(
        public ctx: NamespaceContext,
        public id: FID,
        public params: FunctionParam[],
        public returnType: Expr,
        public body: Expr,
    ) {}
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

    has(name: string): boolean {
        return this.self.has(name) || (this.parent !== null && this.parent.has(name))
    }

    set(name: string, value: Item): void {
        assert(!this.has(name))
        this.self.set(name, value)
    }

    *[Symbol.iterator](): Generator<[string, Item], BuiltinIteratorReturn, unknown> {
        yield* this.self
        if (this.parent !== null) yield* this.parent
    }

    *own() {
        yield* this.self.keys()
    }
}

type Item =
    | { k: "fn"; v: Fn }
    | { k: "const"; v: Lazy<{ ns: NamespaceContext; type: Expr | null; value: Expr }, TypedValue> }
    | {
          k: "var"
          v: Lazy<{ ns: NamespaceContext; type: Expr | null; value: Expr }, { type: Type; id: GID }>
      }
    | { k: "reserved"; v: null }

type GID = number & { __brand: "global_var" }
type RII = number & { __brand: "runtime_instruction" }
type AID = number & { __brand: "adt" }
type FID = number & { __brand: "fn_decl" }
type TID = number & { __brand: "test" }

type RuntimeInst =
    | { n: RII; k: "lit"; v: TypedValue }
    | { n: RII; k: "cf-unreachable"; v: null }
    | { n: RII; k: "slice-from-array"; v: RII }
    | { n: RII; k: "get-unwrap"; v: RII }

interface Test {
    ns: NamespaceContext
    id: TID
    name: string
    body: Expr
}

export class RootContext {
    constructor(
        public errors: Errors,
        public tests: Test[] | null, // `null` if not using tests
    ) {}

    public globalVars: Map<GID, TypedValue> = Object.create(null)
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
        public ns: NamespaceContext,
        public runtime: RuntimeInst[],
        public variables: Map<string, Variable>,
        public labels: Map<string, Label>,
        public returnType: Type | null, // `null` means `return` is invalid
    ) {}

    createNamespaceContext(type: Type) {
        const valueDecls = this.ns.items.fork()
        const nsDecls = valueDecls.fork()

        for (const [key, val] of this.variables) {
            if (val.k === "comptime-const") {
                valueDecls.set(key, { k: "const", v: { k: "analyzed", v: val.v } })
            } else {
                valueDecls.set(key, { k: "reserved", v: null })
            }
        }

        return new NamespaceContext(this.ns.root, this.ns.file, type, nsDecls)
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
        this.ns.todo(p, message)
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
}

export class NamespaceContext {
    constructor(
        public root: RootContext,
        public file: File,
        public self: Type, // value of @This()
        public items: Items,
    ) {}

    createEvaluationContext() {
        return new EvaluationContext(this, [], Object.create(null), Object.create(null), null)
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
    | { k: "return"; v: { value: TypedValue } }

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

        if (value.value.k === "array") {
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
            if (type !== null && (type.k === "u" || type.k === "i")) {
                if (!intIsSafe(type.k, type.v, v)) {
                    ctx.raiseAt(p, `'${v}' does not fit in '${typeName(type)}'`)
                }
                return normal(type, { k: "int", v })
            }

            return normal({ k: "comptime_int", v: null }, { k: "int", v })

        case "lit-float":
            if (type !== null && type.k === "f") {
                const val = floatTruncate(type.v, v)
                if (!isFinite(val)) {
                    ctx.raiseAt(p, `'${v}' does not fit in '${typeName(type)}'`)
                }
                return normal(type, { k: "float", v })
            }

            return normal({ k: "comptime_float", v: null }, { k: "float", v })

        case "lit-str":
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
                id: v.id as AID,
                p,
                captures,
                ns: null!,
                members: { k: "raw", v: members },
            }
            const ns = ctx.createNamespaceContext({ k: "struct", v: struct })
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
                id: v.id as AID,
                p,
                captures,
                ns: null!,
                backingInt: tag,
                members:
                    membersExplicit ?
                        { k: "analyzed", v: membersExplicit }
                    :   { k: "raw", v: members },
            }
            const ns = ctx.createNamespaceContext({ k: "enum", v: type })
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
                    id: (v.id - 1) as AID,
                    p,
                    captures: [],
                    ns: null!,
                    backingInt: { k: "u", v: bitCountWithVariants(members.size) },
                    members: {
                        k: "analyzed",
                        v: new Map(Array.from(members.keys()).map((k, i) => [k, BigInt(i)])),
                    },
                }
                adt.ns = ctx.createNamespaceContext({ k: "enum", v: adt })
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
                id: v.id as AID,
                p,
                captures,
                ns: null!,
                tag,
                members: { k: "raw", v: members },
            }
            const ns = ctx.createNamespaceContext({ k: "union", v: union })
            union.ns = ns

            if (!finalizeNamespace(ns, "variant", members, v.child)) return ERROR
            return normalType(ns.self)
        }

        case "ns-opaque": {
            const captures = getCaptures(ctx, v.child)
            if (captures === null) return ERROR

            const opaque: Opaque = { id: v.id as AID, p, captures, ns: null! }
            const ns = ctx.createNamespaceContext({ k: "opaque", v: opaque })
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

        case "dot-record":
            break

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

        case "dot-field":
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
        case "cf-return":
        case "cf-comptime":
        case "get-prop":
        case "get-method":
        case "get-index":
        case "get-call":
            break

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

        case "block":
            break

        case "builtin":
            return builtin(ctx, comptime, type, p, v.name, v.args)

        case "ident":
            if (isReservedIdent(v)) {
                switch (v.name) {
                    case "never":
                    case "void":
                    case "comptime_int":
                    case "comptime_float":
                    case "str":
                        return normalType({ k: v.name, v: null })

                    case "null":
                        return normal({ k: "null", v: null }, { k: "null", v: null })

                    case "true":
                    case "false":
                        return normal({ k: "bool", v: null }, { k: "bool", v: v.name === "true" })

                    case "inf":
                    case "nan": {
                        const value: Value = { k: "float", v: v.name === "inf" ? Infinity : NaN }

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

            ctx.todo(p, "general identifiers")
            return ERROR

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

            return ctx.rtResult(value.v.type, "lit", value.v)
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
    ns: NamespaceContext,
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
                ns.items.set(v.name.name, {
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
                ns.items.set(v.name.name, {
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
        && /^(?:[uif]\d+|comptime_.*|never|void|bool|str|null|true|false|inf|nan)$/.test(ident.name)
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
    if (a.k !== b.k) return false

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

        case "fn":
            assert(a.k === b.k)
            return a.v.id === b.v.id && typeEq(a.v.ctx.self, b.v.ctx.self) // ensure namespaces have equal captures

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

/**
 * Whether a value is fully comptime-known.
 *
 * Excludes `runtime`, along with any value containing it.
 */
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
            return true

        case "some":
            return isComptimeValue(v)

        case "array":
            return v.every(isComptimeValue)

        case "fn":
            return true

        case "type":
            return true

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
 * Excludes `comptime_int`, `comptime_float`, `fn`, and `type`, along with any type containing them.
 */
function isRuntimeType(ctx: RootContext, type: Type): boolean {
    const { k, v } = type

    switch (k) {
        case "never":
        case "void":
        case "bool":
            return true

        case "comptime_int":
        case "comptime_float":
            return false

        case "u":
        case "i":
        case "f":
        case "str":
        case "null":
            return true

        case "optional":
        case "slice":
            return isRuntimeType(ctx, v)

        case "array":
            return isRuntimeType(ctx, v.child)

        case "tuple":
            return v.every((x) => isRuntimeType(ctx, x))

        case "fn":
        case "type":
            return false

        case "struct":
            throw new Error("cannot check if struct is a runtime type")

        case "enum":
            return true

        case "union":
            throw new Error("cannot check if union is a runtime type")

        case "opaque":
            return true
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

        parent.todo(null!)
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

function topLevelType(ctx: NamespaceContext, p: Expr): Type | null {
    const val = exprAsType(ctx.createEvaluationContext(), p)
    if (val.k === "error") return null
    assert(val.k === "normal")
    return val.v
}

function topLevelValue(ctx: NamespaceContext, type: Expr | null, value: Expr): TypedValue | null {
    const ec = ctx.createEvaluationContext()

    if (type === null) {
        const result = expr(ec, true, type, value)
        if (result.k === "error") return null
        assert(result.k === "normal")
        return result.v
    }

    const ty = topLevelType(ctx, type)
    if (ty === null) return null

    const result = exprAs(ec, true, ty, value)
    if (result.k === "error") return null
    assert(result.k === "normal")
    return result.v
}

function topLevelValueAs(ctx: NamespaceContext, type: Type, value: Expr): TypedValue | null {
    const ec = ctx.createEvaluationContext()

    const result = exprAs(ec, true, type, value)
    if (result.k === "error") return null
    assert(result.k === "normal")
    return result.v
}
