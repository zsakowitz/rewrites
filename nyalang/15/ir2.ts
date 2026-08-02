import { assert } from "./assert"
import { TraceEntry, type Errors } from "./error"
import type { File } from "./file"
import type { FloatBitSize } from "./num"
import type { Decl, Expr, FunctionParam, Ident, Range, Stmt } from "./parse"

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

function typeName({ k, v }: Type): string {
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
        public params: FunctionParam[],
        public returnType: Expr,
        public body: Expr,
    ) {}
}

class Items {
    constructor(
        public parent: Items | null,
        private self: Map<string, Item>,
    ) {}

    fork(): Items {
        return new Items(this, Object.create(null))
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
type AID = number & { __brand: "adt" }

type RuntimeInst = { n: RII; k: "runtime"; v: TypedValue }

class RootContext {
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

class EvaluationContext {
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

    todo(p: Range, message?: string) {
        this.ns.todo(p, message)
    }
}

class NamespaceContext {
    constructor(
        public root: RootContext,
        public file: File,
        public self: Type, // value of @This()
        public items: Items,
    ) {}

    createEvaluationContext() {
        return new EvaluationContext(this, [], Object.create(null), Object.create(null), null)
    }

    raiseAt(pos: Range, message: string) {
        this.root.errors.raise(new TraceEntry(this.file, pos.s, pos.e, message))
    }

    todo(pos: Range, message?: string) {
        this.raiseAt(pos, `TODO (${message})`)
    }
}

type CompletionNontrivial =
    | { k: "error"; v: null } // compile error
    | { k: "unreachable"; v: null }
    | { k: "break"; v: BreakSite }
    | { k: "continue"; v: { n: RII; value: TypedValue } }
    | { k: "return"; v: { value: TypedValue } }

type Completion<T> = CompletionNontrivial | { k: "normal"; v: T }

interface ImmediateExecutables {
    comptime: Expr[]
    test: { name: string; body: Expr }[]
}

const ERROR = { k: "error" as const, v: null }

function normal(type: Type, value: Value): Completion<TypedValue> {
    return { k: "normal", v: { type, value } }
}

function normalType(type: Type): Completion<TypedValue> {
    return normal({ k: "type", v: null }, { k: "type", v: type })
}

const VOID: Completion<TypedValue> = {
    k: "normal",
    v: { type: { k: "void", v: null }, value: { k: "void", v: null } },
}

function exprAsType(ctx: EvaluationContext, p: Expr): Completion<Type> {
    const value = expr(ctx, true, { k: "type", v: null }, p)
    if (value.k !== "normal") return value

    if (value.v.type.k !== "type") {
        ctx.raiseAt(p, `expected 'type', got '${typeName(value.v.type)}'`)
        return ERROR
    }

    assert(value.v.value.k === "type")
    return { k: "normal", v: value.v.value.v }
}

export function expr(
    ctx: EvaluationContext,
    comptime: boolean,
    type: Type | null,
    p: Expr,
): Completion<TypedValue> {
    const { k, v } = p

    switch (k) {
        case "error":
            return ERROR

        case "lit-void":
            return VOID

        case "lit-int":
            return normal({ k: "comptime_int", v: null }, { k: "int", v })

        case "lit-float":
            return normal({ k: "comptime_float", v: null }, { k: "float", v })

        case "lit-str":
            return normal({ k: "str", v: null }, { k: "str", v })

        case "ty-optional": {
            const type = exprAsType(ctx, p)
            if (type.k !== "normal") return type

            return normalType({ k: "optional", v: type.v })
        }

        case "ty-array":
        case "ty-fn":
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

export function stmt(ctx: EvaluationContext, comptime: boolean, p: Stmt): Completion<null> {
    const { k, v } = p

    ctx.todo(p)
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
                    v: new Fn(ctx, v.params, v.ret, v.body),
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
        !ident.raw && /^(?:[uif]\d+|comptime_.*|never|void|str|null|true|false)$/.test(ident.name)
    )
}
