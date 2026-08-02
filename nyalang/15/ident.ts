import type { Decl, Expr, Stmt } from "./parse"

function decl(used: Map<string, boolean>, v: Decl | null) {
    if (v === null) return

    switch (v.k) {
        case "field-ident":
            expr(used, v.v.value)
            break

        case "field-plain":
            expr(used, v.v.type)
            expr(used, v.v.default)
            break

        case "comptime":
            expr(used, v.v)
            break

        case "test":
            expr(used, v.v.body)
            break

        case "const":
        case "var":
            expr(used, v.v.type)
            expr(used, v.v.body)
            break

        case "fn":
            for (const el of v.v.params) {
                expr(used, el.type)
            }
            expr(used, v.v.ret)
            expr(used, v.v.body)
            break

        default:
            v satisfies never
    }
}

function expr(used: Map<string, boolean>, v: Expr | null) {
    if (v === null) return

    switch (v.k) {
        case "error":
        case "lit-void":
        case "lit-int":
        case "lit-float":
        case "lit-str":
            break

        case "ty-optional":
            expr(used, v.v.child)
            break

        case "ty-array":
            expr(used, v.v.len)
            expr(used, v.v.child)
            break

        case "ty-fn":
            for (const el of v.v.params) expr(used, el)
            expr(used, v.v.ret)
            break

        case "ns-struct":
            for (const el of v.v.child) decl(used, el)
            break

        case "ns-enum":
            expr(used, v.v.tag)
            for (const el of v.v.child) decl(used, el)
            break

        case "ns-union":
            if (v.v.tag !== "enum") expr(used, v.v.tag)
            for (const el of v.v.child) decl(used, el)
            break

        case "dot-tuple":
            for (const el of v.v.value) expr(used, el)
            break

        case "dot-record":
            for (const el of v.v.value) expr(used, el.value)
            break

        case "dot-empty":
        case "dot-field":
            break

        case "dot-method":
            for (const el of v.v.args) expr(used, el)
            break

        case "dot-call":
            for (const el of v.v) expr(used, el)
            break

        case "op-prefix":
            expr(used, v.v.arg)
            break

        case "op-infix":
            expr(used, v.v.lhs)
            expr(used, v.v.rhs)
            break

        case "cf-unreachable":
            break

        case "cf-and":
        case "cf-or":
        case "cf-orelse":
            expr(used, v.v.lhs)
            expr(used, v.v.rhs)
            break

        case "cf-maybe":
            expr(used, v.v)
            break

        case "cf-if":
            expr(used, v.v.cond)
            expr(used, v.v.if)
            expr(used, v.v.else)
            break

        case "cf-switch":
            expr(used, v.v.input)
            for (const arm of v.v.arms) {
                for (const pat of arm.pat) if (pat.k !== "else") expr(used, pat)
                expr(used, arm.body)
            }
            break

        case "cf-for":
            for (const el of v.v.inputs) expr(used, el)
            expr(used, v.v.body)
            expr(used, v.v.else)
            break

        case "cf-while":
            expr(used, v.v.input)
            expr(used, v.v.body)
            expr(used, v.v.else)
            break

        case "cf-break":
        case "cf-continue":
        case "cf-return":
            expr(used, v.v.value)
            break

        case "cf-comptime":
            expr(used, v.v)
            break

        case "get-prop":
            expr(used, v.v.target)
            break

        case "get-method":
            expr(used, v.v.target)
            for (const el of v.v.args) expr(used, el)
            break

        case "get-index":
            expr(used, v.v.target)
            expr(used, v.v.index)
            break

        case "get-call":
            expr(used, v.v.target)
            for (const el of v.v.args) expr(used, el)
            break

        case "get-unwrap":
            expr(used, v.v.target)
            break

        case "block":
            for (const el of v.v.body) stmt(used, el)
            break

        case "builtin":
            for (const el of v.v.args) expr(used, el)
            break

        case "ident":
            if (!v.v.raw && isReservedIdent(v.v.name)) break
            if (used.has(v.v.name)) used.set(v.v.name, true)
            break

        case "underscore":
            break

        case "closure":
            for (const el of v.v.args) expr(used, el.type)
            expr(used, v.v.body)
            break

        case "paren":
            expr(used, v.v)
            break

        default:
            v satisfies never
    }
}

function stmt(used: Map<string, boolean>, v: Stmt) {
    if (v === null) return

    switch (v.k) {
        case "expr":
            expr(used, v.v)
            break

        case "assign":
            for (const el of v.v.lhs) {
                if (el.k === "expr") {
                    expr(used, el.v)
                }
            }
            expr(used, v.v.rhs)
            break

        default:
            v satisfies never
    }
}

const RESERVED =
    /^(?:comptime_int|comptime_float|bool|never|type|void|str|true|false|null|[uif]\d+)$/

export function isReservedIdent(name: string) {
    return RESERVED.test(name)
}

export { decl, expr, stmt }
