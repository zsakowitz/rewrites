import { assert, unreachable } from "../assert"
import { readFrac, type Frac } from "../frac"
import { Errors, TraceEntry } from "./error"
import { T, type Tokens } from "./token"

export class ParseContext {
    index = 0

    constructor(
        readonly errors: Errors,
        readonly tokens: Tokens,
    ) {}

    /** Start of next token. */
    get s() {
        return this.tokens.start[this.index] ?? this.tokens.file.body.length
    }

    /** End of previous token. */
    get e() {
        return this.tokens.end[this.index - 1] ?? 0
    }

    raise(message: string) {
        const { tokens } = this
        const { file } = tokens

        if (this.index >= this.tokens.length) {
            this.errors.raise(new TraceEntry(file, file.body.length, file.body.length, message))
            return
        }

        this.errors.raise(TraceEntry.at(file, tokens.start[this.index]!, message))
    }

    peek(): T {
        if (this.index >= this.tokens.length) return T.Eof
        return this.tokens.kind[this.index]!
    }

    peekN(n: number): T {
        if (this.index + n >= this.tokens.length) return T.Eof
        return this.tokens.kind[this.index + n]!
    }

    take(expected: T) {
        if (this.peek() === expected) this.index++
        else this.raise(`Expected ${T[expected]}`)
    }

    /** Assumes a token is available. */
    peekText() {
        return this.tokens.file.body.slice(
            this.tokens.start[this.index]!,
            this.tokens.end[this.index]!,
        )
    }
}

export type OpPrefix = "!" | "~" | "-" | "/"

// prettier-ignore
export type OpInfix =
    | "+"  | "+%" | "-" | "-%" | "*"  | "*%" | "/"  | "%"
    | "~"  | "&"  | "|" | "<<" | ">>"
    | "==" | "!=" | "<" | ">"  | "<=" | ">=" | "==" | "!="

export type Ident = { s: number; e: number; raw: boolean; name: string }
export type Label = { s: number; e: number; name: string } | null
export type Pat = { s: number; e: number; k: "else"; v: null } | Expr
export type ForInput =
    | { s: number; e: number; k: "range"; v: { lhs: Expr; rhs: Expr | null } }
    | { s: number; e: number; k: "plain"; v: Expr }
export type TestName =
    | { s: number; e: number; k: "lit-string"; v: string }
    | { s: number; e: number; k: "ident"; v: string }

export type Expr = { s: number; e: number } & (
    | { k: "error"; v: null }
    | { k: "lit-int"; v: /* nonnegative */ bigint }
    | { k: "lit-frac"; v: Frac }
    | { k: "lit-string"; v: string }
    | { k: "ty-optional"; v: { child: Expr } }
    | { k: "ty-array"; v: { len: Expr | null; child: Expr } }
    | { k: "ty-fn"; v: { args: Expr[]; ret: Expr } }
    | { k: "ns-struct"; v: { extern: boolean; child: Decl[] } }
    | { k: "ns-enum"; v: { extern: boolean; tag: Expr | null; child: Decl[] } }
    | { k: "ns-union"; v: { child: Decl[] } }
    | { k: "dot-tuple"; v: Expr[] } // .{2, 3}
    | { k: "dot-struct"; v: { name: Ident; value: Expr }[] } // .{a: 2}
    | { k: "dot-field"; v: string } // .a
    | { k: "dot-method"; v: { name: Ident; args: Expr[] } } // .a(2, 3)
    | { k: "dot-call"; v: Expr[] } // .(2, 3)
    | { k: "op-prefix"; v: { name: OpPrefix; arg: Expr } }
    | { k: "op-infix"; v: { name: OpInfix; lhs: Expr; rhs: Expr } }
    | { k: "cf-unreachable"; v: null }
    | { k: "cf-and"; v: { lhs: Expr; rhs: Expr } }
    | { k: "cf-or"; v: { lhs: Expr; rhs: Expr } }
    | { k: "cf-orelse"; v: { lhs: Expr; rhs: Expr } }
    | { k: "cf-if"; v: { cond: Expr; capture: Ident | null; if: Expr; else: Expr | null } }
    | {
          k: "cf-switch"
          v: { input: Expr; arms: { pat: Pat[]; capture: Ident | null; body: Expr }[] }
      }
    | {
          k: "cf-for"
          v: { label: Label; inputs: ForInput[]; capture: Ident[]; body: Expr; else: Expr | null }
      }
    | {
          k: "cf-while"
          v: { label: Label; input: Expr; capture: Ident | null; body: Expr; else: Expr | null }
      }
    | { k: "cf-break"; v: { label: Label; value: Expr | null } }
    | { k: "cf-continue"; v: { label: Label } }
    | { k: "cf-return"; v: { value: Expr | null } }
    | { k: "cf-comptime"; v: Expr }
    | { k: "get-prop"; v: { target: Expr; name: Ident } }
    | { k: "get-method"; v: { target: Expr; name: Ident; args: Expr[] } }
    | { k: "get-index"; v: { target: Expr; index: Expr } }
    | { k: "get-call"; v: { target: Expr; args: Expr[] } }
    | { k: "get-unwrap"; v: { target: Expr } }
    | { k: "block"; v: { label: Label; body: Stmt[] } }
    | { k: "builtin"; v: { name: string; args: Expr[] } }
    | { k: "ident"; v: string }
    | { k: "underscore"; v: null }
    | { k: "closure"; v: { args: { name: Ident; type: Expr | null }[]; body: Expr } }
    | { k: "paren"; v: Expr }
)

export type Decl = { s: number; e: number } & (
    | { k: "field-ident"; v: Ident } // a, (could be a field in a tuple or a field name for an enum)
    | { k: "field-expr"; v: Expr } // Map(i32, i32), (must be some kind of tuple field type)
    | { k: "field-plain"; v: { name: Ident; type: Expr; default: Expr | null } } // a: i32 = 4,
    | { k: "comptime"; v: Expr }
    | { k: "test"; v: { name: string; body: Expr } }
    | { k: "const"; v: { name: Ident; type: Expr | null; body: Expr } }
    | { k: "var"; v: { name: Ident; type: Expr | null; body: Expr } }
    | {
          k: "fn"
          v: {
              name: Ident | null
              args: { comptime: boolean; name: Ident; type: Expr }[]
              ret: Expr
              body: Expr
          }
      }
)

export type Stmt = { s: number; e: number } & (
    | { k: "expr"; v: Expr }
    | { k: "assign"; v: { lhs: AssignTarget[]; rhs: Expr } }
)

export type AssignTarget = { s: number; e: number } & (
    | { k: "var" | "const"; v: { name: Ident; type: Expr | null } }
    | { k: "expr"; v: Expr }
)

/** @param body Excludes quotes. */
function readStr(body: string): string {
    let ret = ""

    for (let i = 0; i < body.length; i++) {
        const nextBackslash = body.indexOf("\\", i)
        if (nextBackslash !== i) {
            ret += body.slice(i, nextBackslash)
            if (nextBackslash === -1) break
            i = nextBackslash
        }

        switch (body.charAt(i + 1)) {
            case "n":
                ret += "\n"
                i += 2
                break

            case "r":
                ret += "\r"
                i += 2
                break

            case "t":
                ret += "\t"
                i += 2
                break

            case "u": {
                const closingQuote = body.indexOf("}", i + 3)
                assert(closingQuote !== -1)
                ret += String.fromCodePoint(parseInt(body.slice(i + 3, closingQuote), 16))
                i = closingQuote + 1
                break
            }

            case "x":
                ret += String.fromCodePoint(parseInt(body.slice(i + 2, i + 4), 16))
                i += 2
                break

            default:
                unreachable()
        }
    }

    return ret
}

function readInt(body: string): bigint {
    return BigInt(body.replaceAll("_", ""))
}

function parseIdent(context: ParseContext): Ident | null {
    const next = context.peek()

    if (next !== T.Ident) {
        context.raise(`Expected identifier`)
        return null
    }

    const { index, tokens } = context
    const s = tokens.start[index]!
    const e = tokens.end[index]!
    context.index++

    const name = context.tokens.file.body.slice(s, e)

    if (name.startsWith("@")) {
        return { s, e, raw: true, name: readStr(name.slice(2, -1)) }
    }

    return { s, e, raw: false, name: name }
}

function parseStr(context: ParseContext): string | null {
    const next = context.peek()

    if (next !== T.Str) {
        context.raise(`Expected string`)
        return null
    }

    const { index, tokens } = context
    const s = tokens.start[index]!
    const e = tokens.end[index]!
    context.index++

    const body = context.tokens.file.body.slice(s + 1, e - 1)
    return readStr(body)
}

function parseSemi(context: ParseContext) {
    if (context.peek() === T.Semi) {
        context.index++
    } else {
        context.raise(`Expected semicolon.`)
    }
}

function parseStmtAssign(
    context: ParseContext,
    s: number,
    nextToken: "target" | "punctuation",
    targets: AssignTarget[],
): Stmt | null {
    if (nextToken === "target") {
        targets.push(parseAssignTarget(context))
    }

    while (context.peek() === T.Comma) {
        context.index++
        targets.push(parseAssignTarget(context))
    }

    let rhs = null

    if (context.peek() === T.Eq) {
        context.index++
        rhs = parseExpr(context)
    }

    parseSemi(context)

    if (rhs === null) {
        return null
    }

    return { s, e: context.e, k: "assign", v: { lhs: targets, rhs } }
}

function parseAssignTarget(context: ParseContext): AssignTarget {
    const next = context.peek()

    if (next === T.KVar || next === T.KConst) {
        const s = context.s
        const kind = next === T.KVar ? "var" : "const"
        context.index++

        const name = parseIdent(context)

        let type = null
        if (context.peek() === T.Colon) {
            context.index++
            type = parseExpr(context)
        }

        if (name === null) {
            return { s, e: context.e, k: "expr", v: { k: "underscore", s, e: context.e, v: null } }
        }

        return { s, e: context.e, k: kind, v: { name, type } }
    }

    const expr = parseExpr(context)
    return { s: expr.s, e: expr.e, k: "expr", v: expr }
}

/** `null` is for when the statement is syntactically invalid. */
export function parseStmt(context: ParseContext): Stmt | null {
    const s = context.s
    const next = context.peek()

    if (next === T.KVar || next === T.KConst) {
        return parseStmtAssign(context, s, "target", [])
    }

    // TODO: special case `if (2) { ... } + 4` and siblings (for/while/comptime/block)
    const v = parseExpr(context)
    return { s, e: context.e, k: "expr", v }
}

function parseCapture1(context: ParseContext): Ident | null {
    if (context.peek() !== T.Bar) {
        return null
    }

    context.index++
    const ident = parseIdent(context)
    context.take(T.Bar)
    return ident
}

export function parseDecl(context: ParseContext): Decl {
    const s = context.s

    if (context.peek() === T.Ident && context.peekN(1) === T.Colon) {
        const name = parseIdent(context)!
        context.take(T.Colon)
        const type = parseExpr(context)
        let defaultValue = null
        if (context.peek() === T.Eq) {
            context.index++
            defaultValue = parseExpr(context)
        }
        if (context.peek() !== T.RBrace) {
            context.take(T.Comma)
        }
        return { s, e: context.e, k: "field-plain", v: { name, type, default: defaultValue } }
    }

    if (context.peek() === T.Ident) {
        const name = parseIdent(context)!
        if (context.peek() !== T.RBrace) {
            context.take(T.Comma)
        }
        return { s, e: context.e, k: "field-ident", v: name }
    }

    if (context.peek() === T.KFn) {
        context.index++
        const name = parseIdent(context)
        context.take(T.LParen)
        const args = []
        while (context.peek() === T.Ident || context.peek() === T.KComptime) {
            const comptime = context.peek() === T.KComptime
            if (comptime) context.index++
            const name = parseIdent(context)
            if (!name) throw new Error("TODO: function name is required")
            context.take(T.Colon)
            const type = parseExpr(context)
            if (context.peek() !== T.RParen) context.take(T.Comma)
            args.push({ comptime, name, type })
        }
        context.take(T.RParen)
        const returnType = parseExpr(context)
        if (context.peek() !== T.LBrace) {
            context.take(T.Eq)
        }
        const body = parseExpr(context)
        return { s, e: context.e, k: "fn", v: { name, args, ret: returnType, body } }
    }

    if (context.peek() === T.KVar || context.peek() === T.KConst) {
        const k = context.peek() === T.KVar ? "var" : "const"
        context.index++
        const name = parseIdent(context)
        if (!name) throw new Error("requires name")
        let type = null
        if (context.peek() === T.Colon) {
            context.index++
            type = parseExpr(context)
        }
        context.take(T.Eq)
        const body = parseExpr(context)
        context.take(T.Semi)
        return { s, e: context.e, k, v: { name, type, body } }
    }

    if (context.peek() === T.KComptime) {
        context.index++
        const v = parseExpr(context)
        context.take(T.Semi)
        return { s, e: context.e, k: "comptime", v }
    }

    if (context.peek() === T.KTest) {
        context.index++
        const name = parseStr(context)
        if (!name) throw new Error("Name required for tests")
        const body = parseExpr(context)
        context.take(T.Semi)
        return { s, e: context.e, k: "test", v: { name, body } }
    }

    const type = parseExpr(context)
    if (context.peek() !== T.RBrace) {
        context.take(T.Comma)
    }
    return { s, e: context.e, k: "field-expr", v: type }
}

function parseDeclBlock(context: ParseContext): Decl[] {
    context.take(T.LBrace)
    const ret: Decl[] = []
    while (context.peek() !== T.RBrace && context.peek() !== T.Eof) {
        const si = context.index
        ret.push(parseDecl(context))
        if (si === context.index) {
            context.raise("Invalid declaration")
            break
        }
    }
    context.take(T.RBrace)
    return ret
}

function parseExprAtom(context: ParseContext): Expr {
    const s = context.s

    switch (context.peek()) {
        case T.Int: {
            const raw = context.peekText()
            context.index++
            return { s, e: context.e, k: "lit-int", v: readInt(raw) }
        }

        case T.Float: {
            const raw = context.peekText()
            context.index++
            return { s, e: context.e, k: "lit-frac", v: readFrac(raw) }
        }
    }

    context.raise("Invalid expression")
    return { s, e: context.e, k: "error", v: null }
}

export function parseExpr(context: ParseContext): Expr {
    return parseExprAtom(context)
}
