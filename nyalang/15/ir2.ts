import { assert } from "./assert"
import { TraceEntry, type Errors } from "./error"
import type { File } from "./file"
import type { FloatBitSize } from "./num"
import type { Decl, Expr, FunctionParam, Ident, Range, Stmt } from "./parse"

type Type =
    | { k: "never"; v: null }
    | { k: "void"; v: null }
    | { k: "comptime_fn"; v: null }
    | { k: "comptime_type"; v: null }
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
    | { k: "struct"; v: Struct }
    | { k: "enum"; v: Enum }
    | { k: "union"; v: Union }
    | { k: "opaque"; v: Opaque }

type Value =
    | { k: "runtime"; v: RII }
    | { k: "void"; v: void } // type = void
    | { k: "fn"; v: Fn } // type = comptime_fn
    | { k: "type"; v: Type } // type = comptime_type
    | { k: "int"; v: bigint } // type = comptime_int, u, i
    | { k: "float"; v: number } // type = comptime_float, f
    | { k: "str"; v: string } // type = str
    | { k: "null"; v: null } // type = null, optional(T)
    | { k: "some"; v: Value } // type = optional(T)
    | { k: "array"; v: Value[] } // type = array, tuple
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
    decls: Items
    members: Lazy<
        Map<string, { type: Type; default: Expr | null }>,
        Map<string, { type: Type; default: TypedValue | null }>
    >
}

interface Enum {
    id: AID
    captures: Value[]
    decls: Items
    backingInt: Type
    members: Lazy<Map<string, Expr | null>, Map<string, number>>
}

interface Union {
    id: AID
    captures: Value[]
    decls: Items
    tag: Type & { k: "enum" }
    members: Lazy<Map<string, Expr | null>, Map<string, Type>>
}

class Fn {
    constructor(
        public ctx: NamespaceContext,
        public params: FunctionParam[],
        public returnType: Expr,
        public body: Expr,
    ) {}
}

interface Opaque {
    id: AID
    captures: Value[]
    decls: Items
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

type CompletionExpr = CompletionNontrivial | { k: "normal"; v: TypedValue }

type CompletionStmt = CompletionNontrivial | { k: "normal"; v: null }

interface ImmediateExecutables {
    comptime: Expr[]
    test: { name: string; body: Expr }[]
}

function expr(ctx: EvaluationContext, type: Type | null, p: Expr): CompletionExpr {
    const { k, v } = p

    ctx.todo(p)
    return { k: "error", v: null }
}

function stmt(ctx: EvaluationContext, p: Stmt): CompletionStmt {
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
                ctx.todo({ s, e }, "functions ")
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
