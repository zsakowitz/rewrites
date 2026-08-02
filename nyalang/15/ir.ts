import { assert } from "./assert"
import { Errors, TraceEntry } from "./error"
import type { File } from "./file"
import { floatTruncate, intIsSafe, type FloatBitSize } from "./num"
import type { Decl, Expr, FunctionParam, Ident, Range, Stmt } from "./parse"

const usize: Type = { k: "u", v: 32 }

type Type =
    | { k: "never"; v: null }
    | { k: "void"; v: null }
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
    | { k: "int"; v: bigint } // type = comptime_int, u, i
    | { k: "float"; v: number } // type = comptime_float, f
    | { k: "str"; v: string } // type = str
    | { k: "null"; v: null } // type = null, optional(T)
    | { k: "some"; v: Value } // type = optional(T)
    | { k: "array"; v: Value[] } // type = array, slice, tuple
    | { k: "fn"; v: Fn } // type = fn
    | { k: "type"; v: Type } // type = type
    | { k: "struct"; v: Map<string, Value> } // type = struct
    | { k: "enum"; v: string } // type = enum
    | { k: "union"; v: { k: string; v: Value } } // type = union

interface TypedValue {
    type: Type
    value: Value
}

type Lazy<Raw, Analyzed> =
    | { k: "raw"; v: Raw }
    | { k: "progressing"; v: null }
    | { k: "analyzed"; v: Analyzed }

interface Struct {
    id: AID
    captures: Value[]
    ns: NamespaceContext
    members: Lazy<
        Map<string, { type: Type; default: Expr | null }>,
        Map<string, { type: Type; default: TypedValue | null }>
    >
}

interface Enum {
    id: AID
    captures: Value[]
    ns: NamespaceContext
    backingInt: Type
    members: Lazy<Map<string, Expr | null>, Map<string, number>>
}

interface Union {
    id: AID
    captures: Value[]
    ns: NamespaceContext
    tag: Type & { k: "enum" }
    members: Lazy<Map<string, Expr | null>, Map<string, Type>>
}

interface Opaque {
    id: AID
    captures: Value[]
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

    has(name: string): boolean {
        return this.self.has(name) || (this.parent !== null && this.parent.has(name))
    }

    set(name: string, value: Item) {
        assert(!this.has(name))
        this.self.set(name, value)
    }
}

type Item =
    | { k: "fn"; v: Fn }
    | { k: "const"; v: Lazy<{ type: Expr | null; value: Expr }, TypedValue> }
    | { k: "var"; v: Lazy<{ type: Expr | null; value: Expr }, { type: Type; id: GID }> }
    | { k: "reserved"; v: null }

type GID = number & { __brand: "global_var" }
type RII = number & { __brand: "runtime_instruction" }
type AID = number & { __brand: "adt_decl" }
type FID = number & { __brand: "fn_decl" }

type RuntimeInst = { n: RII; k: "lit"; v: TypedValue } | { n: RII; k: "slice-from-array"; v: RII }

export class RootContext {
    constructor(public errors: Errors) {}

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

let nextRII = 0

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
        const n = nextRII++ as RII
        this.runtime.push({ n, k, v } as RuntimeInst)
        return n
    }

    rtTypedValue<K extends RuntimeInst["k"]>(
        type: Type,
        k: K,
        v: Extract<RuntimeInst, { k: K }>["v"],
    ): TypedValue {
        const n = nextRII++ as RII
        this.runtime.push({ n, k, v } as RuntimeInst)
        return { type, value: { k: "runtime", v: n } }
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
    test: { name: string; body: Expr }[]
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
            for (let i = 0; i <= depth; i++) {
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
                if (type.k === "u" || type.k === "i") {
                    if (!intIsSafe(type.k, type.v, v)) {
                        ctx.raiseAt(p, `'${v}' does not fit in '${typeName(type)}'`)
                    }
                    return normal(type, { k: "int", v })
                }

                if (type.k === "comptime_int") {
                    return normal({ k: "comptime_int", v: null }, { k: "int", v })
                }

                ctx.raiseAt(p, `Expected '${typeName(type)}', but got integer`)
            }

            return normal({ k: "comptime_int", v: null }, { k: "int", v })

        case "lit-float":
            if (type !== null) {
                if (type.k === "f") {
                    const val = floatTruncate(type.v, v)
                    if (!isFinite(val)) {
                        ctx.raiseAt(p, `'${v}' does not fit in '${typeName(type)}'`)
                    }
                    return normal(type, { k: "float", v })
                }

                if (type.k === "comptime_float") {
                    return normal({ k: "comptime_float", v: null }, { k: "float", v })
                }

                ctx.raiseAt(p, `Expected '${typeName(type)}', but got floating-point value`)
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

        case "ns-struct":
        case "ns-enum":
        case "ns-union":
        case "dot-tuple":
        case "dot-record":
        case "dot-empty":
        case "dot-field":
        case "dot-method":
        case "dot-call":
        case "op-prefix":
        case "op-infix":
        case "cf-unreachable":
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
        case "get-unwrap":
        case "block":
        case "builtin":
        case "ident":
        case "underscore":
        case "closure":
        case "paren":
            break
    }

    ctx.todo(p)
    return { k: "error", v: null }
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

/** Returns `null` on error. */
function resolveNamespaceDecls(ctx: NamespaceContext, ps: Decl[]): ImmediateExecutables | null {
    const ret: ImmediateExecutables = {
        comptime: [],
        test: [],
    }

    for (const { k, v, s, e } of ps) {
        switch (k) {
            case "field-ident":
            case "field-plain":
                // `resolveNamespaceDecls` ignores these
                break

            case "comptime":
                ret.comptime.push(v)
                break

            case "test":
                ret.test.push(v)
                break

            case "const":
            case "var":
                if (isReservedIdent(v.name)) {
                    ctx.raiseAt(v.name, "declaration shadows a reserved word")
                    return null
                }
                if (ctx.items.has(v.name.name)) {
                    ctx.raiseAt(v.name, "declaration shadows a name from an outer scope")
                    return null
                }
                ctx.items.set(v.name.name, {
                    k,
                    v: { k: "raw", v: { type: v.type, value: v.body } },
                })
                break

            case "fn":
                if (!v.name) {
                    ctx.todo({ s, e }, "functions must have names")
                    return null
                }
                if (isReservedIdent(v.name)) {
                    ctx.raiseAt(v.name, "declaration shadows a reserved word")
                    return null
                }
                if (ctx.items.has(v.name.name)) {
                    ctx.raiseAt(v.name, "declaration shadows a name from an outer scope")
                    return null
                }
                ctx.items.set(v.name.name, {
                    k: "fn",
                    v: new Fn(ctx, v.id as FID, v.params, v.ret, v.body),
                })
                break

            default:
                k satisfies never
        }
    }

    return ret
}

function isReservedIdent(ident: Ident): boolean {
    return (
        !ident.raw
        && /^(?:[uif]\d+|comptime_.*|never|void|str|null|true|false|inf|nan)$/.test(ident.name)
    )
}

function typeEq(a: Type, b: Type): boolean {
    if (a === b) return true
    if (a.k !== b.k) return false

    switch (a.k) {
        case "never":
        case "void":
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
            return a.v.captures.every((_, i) => valueEq(a.v.captures[i]!, b.v.captures[i]!))
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

        case "enum":
            assert(a.k === b.k)
            return a.v === b.v

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
function isComptimeValue({ k, v }: Value): boolean {
    switch (k) {
        case "runtime":
            return false

        case "void":
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

        case "enum":
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
function isRuntimeType(ctx: RootContext, { k, v }: Type): boolean {
    switch (k) {
        case "never":
        case "void":
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
