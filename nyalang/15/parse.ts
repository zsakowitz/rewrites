import { assert, unreachable } from "./assert"
import { Errors, TraceEntry } from "./error"
import { readFloat } from "./frac"
import { T, type Tokens } from "./token"

/** Accessed using `nextId++`. */
let nextId = 0

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

export type OpPrefix = "!" | "~" | "-" | "/" | "-%"

// prettier-ignore
export type OpInfix =
    | "+"  | "+%" | "-" | "-%" | "*"  | "*%" | "/"  | "%"
    | "~"  | "&"  | "|" | "<<" | ">>"
    | "==" | "!=" | "<" | ">"  | "<=" | ">=" | "==" | "!="

export type Ident = { s: number; e: number; raw: boolean; name: string }
export type SwitchPat = { s: number; e: number; k: "else"; v: null } | Expr
export type ForInput =
    // | { s: number; e: number; k: "range"; v: { lhs: Expr; rhs: Expr | null } }
    // | { s: number; e: number; k: "plain"; v: Expr }
    Expr
export type TestName =
    | { s: number; e: number; k: "lit-str"; v: string }
    | { s: number; e: number; k: "ident"; v: string }

/** If a `block` parameter is nearby, `block.file` should be set to the file which owns this range. */
export type Range = { s: number; e: number }

export type Expr = Range
    & (
        | { k: "error"; v: null }
        | { k: "lit-void"; v: null } // not expressable in surface syntax, use {}
        | { k: "lit-int"; v: /* nonnegative */ bigint }
        | { k: "lit-float"; v: number }
        | { k: "lit-str"; v: string }
        | { k: "ty-optional"; v: { child: Expr } }
        | { k: "ty-array"; v: { len: Expr | null; child: Expr } }
        | { k: "ty-fn"; v: { params: (Expr | null)[]; ret: Expr | null } }
        | { k: "ns-struct"; v: { id: number; extern: boolean; child: Decl[] } }
        | { k: "ns-enum"; v: { id: number; extern: boolean; tag: Expr | null; child: Decl[] } }
        | { k: "ns-union"; v: { id: number; tag: Expr | "enum" | null; child: Decl[] } } // if `tag == "enum"`, `id-1` is available for the tag type
        | { k: "ns-opaque"; v: { id: number; child: Decl[] } }
        | { k: "dot-tuple"; v: { id: number; value: Expr[] } } // .{2, 3}
        | { k: "dot-record"; v: { id: number; value: { name: Ident; value: Expr }[] } } // .{a: 2}
        | { k: "dot-empty"; v: { id: number } } // .{}
        | { k: "dot-field"; v: Ident } // .a
        | { k: "dot-method"; v: { name: Ident; args: Expr[] } } // .a(2, 3)
        | { k: "dot-call"; v: Expr[] } // .(2, 3)
        | { k: "op-prefix"; v: { name: OpPrefix; arg: Expr } }
        | { k: "op-infix"; v: { name: OpInfix; lhs: Expr; rhs: Expr } }
        | { k: "cf-unreachable"; v: null }
        | { k: "cf-and"; v: { lhs: Expr; rhs: Expr } }
        | { k: "cf-or"; v: { lhs: Expr; rhs: Expr } }
        | { k: "cf-orelse"; v: { lhs: Expr; rhs: Expr } }
        | { k: "cf-maybe"; v: Expr }
        | { k: "cf-if"; v: { cond: Expr; capture: Ident | null; if: Expr; else: Expr | null } }
        | { k: "cf-switch"; v: { label: Ident | null; input: Expr; arms: SwitchArm[] } }
        | {
              k: "cf-for"
              v: {
                  label: Ident | null
                  inputs: ForInput[]
                  capture: Ident[]
                  body: Expr
                  else: Expr | null
              }
          }
        | {
              k: "cf-while"
              v: {
                  label: Ident | null
                  input: Expr
                  capture: Ident | null
                  body: Expr
                  else: Expr | null
              }
          }
        | { k: "cf-break"; v: { label: Ident | null; value: Expr | null } }
        | { k: "cf-continue"; v: { label: Ident | null; value: Expr | null } }
        | { k: "cf-return"; v: { value: Expr | null } }
        | { k: "cf-comptime"; v: Expr }
        | { k: "get-prop"; v: { target: Expr; name: Ident } }
        | { k: "get-method"; v: { target: Expr; name: Ident; args: Expr[] } }
        | { k: "get-index"; v: { target: Expr; index: Expr } }
        | { k: "get-call"; v: { target: Expr; args: Expr[] } }
        | { k: "get-unwrap"; v: { target: Expr } }
        | { k: "block"; v: { label: Ident | null; body: Stmt[] } }
        | { k: "builtin"; v: { name: string; args: Expr[] } }
        | { k: "ident"; v: Ident }
        | { k: "underscore"; v: null }
        | { k: "closure"; v: { args: { name: Ident; type: Expr | null }[]; body: Expr } }
        | { k: "paren"; v: Expr }
    )

export interface SwitchArm {
    pat: SwitchPat[]
    capture: Ident | null
    body: Expr
}

export type Decl = Range
    & (
        | { k: "field-ident"; v: { name: Ident; value: Expr | null } } // a, b = 7,
        | { k: "field-plain"; v: { name: Ident; type: Expr; default: Expr | null } } // a: i32, b: i32 = 4,
        | { k: "comptime"; v: Expr }
        | { k: "test"; v: { id: number; name: string; body: Expr } }
        | { k: "const"; v: { name: Ident; type: Expr | null; body: Expr } }
        | { k: "var"; v: { name: Ident; type: Expr | null; body: Expr } }
        | {
              k: "fn"
              v: { id: number; name: Ident | null; params: FunctionParam[]; ret: Expr; body: Expr }
          }
    )

export type FunctionParam = { comptime: boolean; name: Ident | null; type: Expr }

export type Stmt = Range
    & ({ k: "expr"; v: Expr } | { k: "assign"; v: { lhs: AssignTarget[]; rhs: Expr } })

export type AssignTarget = Range
    & (
        | { k: "var" | "const" | "comptime-const"; v: { name: Ident; type: Expr | null } }
        | { k: "expr"; v: Expr }
    )

/** @param body Excludes quotes. */
function readStr(body: string): string | null {
    let ret = ""

    for (let i = 0; i < body.length; ) {
        const nextBackslash = body.indexOf("\\", i)
        if (nextBackslash !== i) {
            if (nextBackslash === -1) {
                ret += body.slice(i)
                break
            }

            ret += body.slice(i, nextBackslash)
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
                i += 4
                break

            default:
                unreachable()
        }
    }

    if (!ret.isWellFormed()) {
        return null
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

    const name = context.tokens.file.body.slice(s, e)

    if (name.startsWith("@")) {
        const body = readStr(name.slice(2, -1))
        if (body === null) {
            context.raise("invalid string literal")
            context.index++
            return null
        }

        context.index++
        return { s, e, raw: true, name: body }
    }

    context.index++
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

    const body = readStr(context.tokens.file.body.slice(s + 1, e - 1))
    if (body === null) {
        context.raise("invalid string literal")
        context.index++
        return null
    }

    context.index++
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

    if (
        next === T.KVar
        || next === T.KConst
        || (next === T.KComptime && context.peekN(1) === T.KConst)
    ) {
        const s = context.s
        const kind =
            next === T.KVar ? "var"
            : next === T.KComptime ? "comptime-const"
            : "const"
        if (kind === "comptime-const") context.index++
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

    if (
        next === T.KVar
        || next === T.KConst
        || (next === T.KComptime && context.peekN(1) === T.KConst)
    ) {
        return parseStmtAssign(context, s, "target", [])
    }

    // TODO: special case `if (2) { ... } + 4` and siblings (for/while/comptime/block)

    const v = parseExpr(context)
    if (context.peek() === T.Comma || context.peek() === T.Eq) {
        return parseStmtAssign(context, s, "punctuation", [{ s, e: v.e, k: "expr", v }])
    }

    context.take(T.Semi)
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

function parseCaptureN(context: ParseContext): Ident[] {
    context.take(T.Bar)
    const ret = []
    while (context.peek() !== T.Bar && context.peek() !== T.Eof) {
        const i = context.index
        ret.push(parseIdent(context))
        if (i === context.index) break
        if (context.peek() !== T.Bar) context.take(T.Comma)
    }
    context.take(T.Bar)
    return ret.filter((x) => x !== null)
}

export function parseDecl(context: ParseContext): Decl | null {
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
        let value = null
        if (context.peek() === T.Eq) {
            context.index++
            value = parseExpr(context)
        }
        if (context.peek() !== T.RBrace) {
            context.take(T.Comma)
        }
        return { s, e: context.e, k: "field-ident", v: { name, value: value } }
    }

    if (context.peek() === T.KFn) {
        context.index++
        const name = parseIdent(context)
        context.take(T.LParen)
        const args = []
        while (context.peek() === T.Ident || context.peek() === T.KComptime) {
            const i = context.index
            const comptime = context.peek() === T.KComptime
            if (comptime) context.index++
            const name = parseIdent(context)
            context.take(T.Colon)
            const type = parseExpr(context)
            if (context.peek() !== T.RParen) context.take(T.Comma)
            args.push({ comptime, name, type })
            if (i === context.index) break
        }
        context.take(T.RParen)
        const returnType = parseExpr(context)
        if (context.peek() !== T.LBrace) {
            context.take(T.Eq)
        }
        const body = parseExpr(context)
        return {
            s,
            e: context.e,
            k: "fn",
            v: { id: nextId++, name, params: args, ret: returnType, body },
        }
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
        const body = parseExpr(context)
        context.take(T.Semi)
        if (name === null) return null
        return { s, e: context.e, k: "test", v: { id: nextId++, name, body } }
    }

    context.raise("Expected field or declaration")
    return null
}

function parseDeclBlock(context: ParseContext): Decl[] {
    context.take(T.LBrace)
    const ret = parseDeclBlockInner(context)
    context.take(T.RBrace)
    return ret
}

function parseDeclBlockInner(context: ParseContext): Decl[] {
    const ret: Decl[] = []
    while (context.peek() !== T.RBrace && context.peek() !== T.Eof) {
        const i = context.index
        const decl = parseDecl(context)
        if (decl === null) break
        ret.push(decl)
        if (i === context.index) break
    }
    return ret
}

function parseExprAtom(ctx: ParseContext): Expr {
    const s = ctx.s

    switch (ctx.peek()) {
        case T.Int: {
            const raw = ctx.peekText()
            ctx.index++
            return { s, e: ctx.e, k: "lit-int", v: readInt(raw) }
        }

        case T.Float: {
            const raw = ctx.peekText()
            ctx.index++
            return { s, e: ctx.e, k: "lit-float", v: readFloat(raw) }
        }

        case T.Str: {
            const raw = parseStr(ctx)!
            return { s, e: ctx.e, k: "lit-str", v: raw }
        }

        case T.Ident: {
            const ident = parseIdent(ctx)!

            if (ctx.peek() === T.Colon) {
                ctx.index++

                const inner = parseExprAtom(ctx)
                if (
                    inner.k === "cf-for"
                    || inner.k === "cf-switch"
                    || inner.k === "cf-while"
                    || inner.k === "block"
                ) {
                    inner.v.label = ident
                    return inner
                }

                ctx.errors.raise(
                    new TraceEntry(
                        ctx.tokens.file,
                        inner.s,
                        inner.e,
                        "Only `for`, `switch`, `while`, and blocks can be labeled",
                    ),
                )
                return inner
            }

            // todo: labeled block, for, while, switch
            return { s, e: ctx.e, k: "ident", v: ident }
        }

        case T.Builtin: {
            const name = ctx.peekText().slice(1)
            ctx.index++
            const args = parseArguments(ctx)
            return { s, e: ctx.e, k: "builtin", v: { name, args } }
        }

        case T.Char:
            break

        case T.StrPart:
            break

        case T.KBreak: {
            ctx.index++
            const label = parseLabel(ctx)
            const value = parseExprMaybe(ctx)
            return { s, e: ctx.e, k: "cf-break", v: { label, value } }
        }

        case T.KComptime: {
            ctx.index++
            const v = parseExpr(ctx)
            return { s, e: ctx.e, k: "cf-comptime", v }
        }

        case T.KContinue: {
            ctx.index++
            const label = parseLabel(ctx)
            const value = parseExprMaybe(ctx)
            return { s, e: ctx.e, k: "cf-continue", v: { label, value } }
        }

        case T.KEnum: {
            ctx.index++
            const tag = parseTagType(ctx)
            const child = parseDeclBlock(ctx)
            return { s, e: ctx.e, k: "ns-enum", v: { id: nextId++, extern: false, tag, child } }
        }

        case T.KExtern: {
            ctx.index++
            const k =
                ctx.peek() === T.KEnum ? "ns-enum"
                : ctx.peek() === T.KStruct ? "ns-struct"
                : null
            if (k === null) {
                ctx.raise("Expected `enum` or `struct`")
                return { s, e: ctx.e, k: "error", v: null }
            }
            ctx.index++
            const tag = k !== "ns-struct" ? parseTagType(ctx) : null
            const child = parseDeclBlock(ctx)
            if (k === "ns-enum")
                return { s, e: ctx.e, k, v: { id: nextId++, extern: true, tag, child } }
            return { s, e: ctx.e, k, v: { id: nextId++, extern: true, child } }
        }

        case T.KFn: {
            ctx.index++
            const params = parseArguments(ctx)
            const ret = parseExpr(ctx)
            return { s, e: ctx.e, k: "ty-fn", v: { params, ret } }
        }

        case T.KFor: {
            ctx.index++
            const args = parseArguments(ctx)
            const captures = parseCaptureN(ctx)
            const body = parseExpr(ctx)
            const belse = parseElse(ctx)
            return {
                s,
                e: ctx.e,
                k: "cf-for",
                v: { label: null, inputs: args, capture: captures, body, else: belse },
            }
        }

        case T.KIf: {
            ctx.index++
            ctx.take(T.LParen)
            const condition = parseExpr(ctx)
            ctx.take(T.RParen)
            const capture = parseCapture1(ctx)
            const bif = parseExpr(ctx)
            const belse = parseElse(ctx)
            return {
                s,
                e: ctx.e,
                k: "cf-if",
                v: { cond: condition, capture, if: bif, else: belse },
            }
        }

        case T.KMaybe: {
            ctx.index++
            const v = parseExpr(ctx)
            return { s, e: ctx.e, k: "cf-maybe", v }
        }

        case T.KReturn: {
            ctx.index++
            const value = parseExprMaybe(ctx)
            return { s, e: ctx.e, k: "cf-return", v: { value } }
        }

        case T.KStruct: {
            ctx.index++
            const child = parseDeclBlock(ctx)
            return { s, e: ctx.e, k: "ns-struct", v: { id: nextId++, extern: false, child } }
        }

        case T.KSwitch: {
            ctx.index++
            ctx.take(T.LParen)
            const scrutinee = parseExpr(ctx)
            ctx.take(T.RParen)
            ctx.take(T.LBrace)
            const arms: SwitchArm[] = []
            while (ctx.peek() !== T.RBrace && ctx.peek() !== T.Eof) {
                const i = ctx.index
                const pat = [parseSwitchPattern(ctx)]
                while (ctx.peek() === T.Comma) {
                    ctx.index++
                    pat.push(parseSwitchPattern(ctx))
                }
                ctx.take(T.EqGt)
                const capture = parseCapture1(ctx)
                const body = parseExpr(ctx)
                if (ctx.peek() === T.RBrace) break
                ctx.take(T.Comma)
                arms.push({ pat, capture, body })
                if (ctx.index === i) break
            }
            ctx.take(T.RBrace)
            return { s, e: ctx.e, k: "cf-switch", v: { label: null, input: scrutinee, arms } }
        }

        case T.KUnion: {
            ctx.index++
            const tag =
                ctx.peek() === T.LParen && ctx.peekN(1) === T.KEnum && ctx.peekN(2) === T.RParen ?
                    ((ctx.index += 3), "enum")
                :   parseTagType(ctx)
            const child = parseDeclBlock(ctx)
            return { s, e: ctx.e, k: "ns-union", v: { id: nextId++, tag, child } }
        }

        case T.KUnreachable: {
            ctx.index++
            return { s, e: ctx.e, k: "cf-unreachable", v: null }
        }

        case T.KWhile: {
            ctx.index++
            ctx.take(T.LParen)
            const condition = parseExpr(ctx)
            ctx.take(T.RParen)
            const capture = parseCapture1(ctx)
            const body = parseExpr(ctx)
            const belse = parseElse(ctx)
            return {
                s,
                e: ctx.e,
                k: "cf-while",
                v: { label: null, input: condition, capture, body, else: belse },
            }
        }

        case T.Dot:
            return parseExprAtomDot(ctx)

        case T.LBrace:
            return parseBlock(ctx)

        case T.LBrack: {
            ctx.index++
            const len = parseExprMaybe(ctx)
            ctx.take(T.RBrack)
            const child = parseExpr(ctx)
            return { s, e: ctx.e, k: "ty-array", v: { len, child } }
        }

        case T.LParen: {
            ctx.index++
            const v = parseExpr(ctx)
            ctx.take(T.RParen)
            return { s, e: ctx.e, k: "paren", v }
        }

        case T.Underscore:
            ctx.index++
            return { s, e: ctx.e, k: "underscore", v: null }

        default:
            ctx.raise("Expected expression")
            return { s, e: ctx.e, k: "error", v: null }
    }

    ctx.raise("Expression type not implemented")
    return { s, e: ctx.e, k: "error", v: null }
}

function parseExprAtomDot(context: ParseContext): Expr {
    const s = context.s
    context.take(T.Dot)

    switch (context.peek()) {
        case T.Ident: {
            const id = parseIdent(context)!
            if (context.peek() === T.LParen) {
                const args = parseArguments(context)
                return { s, e: context.e, k: "dot-method", v: { name: id, args } }
            }
            return { s, e: context.e, k: "dot-field", v: id }
        }

        case T.LParen: {
            const args = parseArguments(context)
            return { s, e: context.e, k: "dot-call", v: args }
        }

        case T.LBrace: {
            const args = parseRecordBody(context)

            switch (args.k) {
                case "tuple":
                    return { s, e: context.e, k: "dot-tuple", v: { id: nextId++, value: args.v } }

                case "record":
                    return { s, e: context.e, k: "dot-record", v: { id: nextId++, value: args.v } }

                case "empty":
                    return { s, e: context.e, k: "dot-empty", v: { id: nextId++ } }
            }
        }
    }

    context.raise("Expected `(`, `{`, or identifier")
    return { s, e: context.e, k: "error", v: null }
}

type RecordBody =
    | { k: "tuple"; v: Expr[] }
    | { k: "record"; v: { name: Ident; value: Expr }[] }
    | { k: "empty"; v: null }
    | { k: "error"; v: null }

function parseRecordBody(context: ParseContext): RecordBody {
    context.take(T.LBrace)
    if (context.peek() === T.RBrace) {
        context.index++
        return { k: "empty", v: null }
    }

    if (context.peek() === T.Dot && context.peekN(1) === T.Ident && context.peekN(2) === T.Eq) {
        const v: { name: Ident; value: Expr }[] = []
        while (context.peek() !== T.RBrace) {
            context.take(T.Dot)
            const name = parseIdent(context)
            if (!name) {
                context.raise("Expected identifier")
                return { k: "error", v: null }
            }
            context.take(T.Eq)

            const value = parseExpr(context)
            if (context.peek() !== T.RBrace) context.take(T.Comma)
            v.push({ name, value })
        }
        context.take(T.RBrace)
        return { k: "record", v }
    }

    const v: Expr[] = []
    while (context.peek() !== T.RBrace) {
        const i = context.index
        const value = parseExpr(context)
        if (context.peek() !== T.RBrace) context.take(T.Comma)
        v.push(value)
        if (context.index === i) break
    }
    context.take(T.RBrace)
    return { k: "tuple", v }
}

function parseBlock(context: ParseContext): Expr {
    const s = context.s
    const ret = parseBlockRaw(context)
    return { s, e: context.e, k: "block", v: { label: null, body: ret } }
}

function parseBlockRaw(context: ParseContext): Stmt[] {
    context.take(T.LBrace)
    const ret: Stmt[] = []
    while (context.peek() !== T.RBrace && context.peek() !== T.Eof) {
        const i = context.index
        const stmt = parseStmt(context)
        if (stmt === null) break
        ret.push(stmt)
        if (context.index === i) break
    }
    context.take(T.RBrace)
    return ret
}

function parseElse(context: ParseContext): Expr | null {
    if (context.peek() !== T.KElse) return null

    context.take(T.KElse)
    return parseExpr(context)
}

function parseExprMaybe(context: ParseContext): Expr | null {
    if (
        [T.KAnd, T.KOr, T.KOrelse, T.KElse, T.Comma, T.Semi, T.RParen, T.RBrack, T.RBrace].includes(
            context.peek(),
        )
    ) {
        return null
    }

    return parseExpr(context)
}

function parseLabel(context: ParseContext): Ident | null {
    if (context.peek() !== T.Colon) {
        return null
    }

    context.take(T.Colon)
    return parseIdent(context)
}

function parseArguments(context: ParseContext): Expr[] {
    context.take(T.LParen)
    const ret: Expr[] = []
    while (context.peek() !== T.RParen && context.peek() !== T.Eof) {
        const i = context.index
        ret.push(parseExpr(context))
        if (context.index === i) break
        if (context.peek() !== T.RParen) context.take(T.Comma)
    }
    context.take(T.RParen)
    return ret
}

function parseTagType(context: ParseContext): Expr | null {
    if (context.peek() !== T.LParen) {
        return null
    }
    context.take(T.LParen)
    const ret = parseExpr(context)
    context.take(T.RParen)
    return ret
}

function parseExprWithSuffixes(context: ParseContext): Expr {
    let base = parseExprAtom(context)
    let next

    while (
        ((next = context.peek()),
        next === T.Dot || next === T.DotQues || next === T.LBrack || next === T.LParen)
    ) {
        switch (next) {
            case T.Dot: {
                context.index++
                const name = parseIdent(context)
                if (name === null) break
                if (context.peek() !== T.LParen) {
                    base = { s: base.s, e: context.e, k: "get-prop", v: { target: base, name } }
                    break
                }
                const args = parseArguments(context)
                base = { s: base.s, e: context.e, k: "get-method", v: { target: base, name, args } }
                break
            }

            case T.DotQues: {
                context.index++
                base = { s: base.s, e: context.e, k: "get-unwrap", v: { target: base } }
                break
            }

            case T.LBrack: {
                context.index++
                const index = parseExpr(context)
                context.take(T.RBrack)
                base = { s: base.s, e: context.e, k: "get-index", v: { target: base, index } }
                break
            }

            case T.LParen: {
                const args = parseArguments(context)
                base = { s: base.s, e: context.e, k: "get-call", v: { target: base, args } }
                break
            }

            default:
                unreachable()
        }
    }

    return base
}

const OP_PREFIX = {
    [T.Bang]: "!",
    [T.Tilde]: "~",
    [T.Slash]: "/",
    [T.Minus]: "-",
    [T.MinusPercent]: "-%",
} as const

function parseExprWithPrefixes(context: ParseContext): Expr {
    const prefixes = []

    let next

    while (
        (next = context.peek())
        && (next === T.Ques
            || next === T.Bang
            || next === T.Tilde
            || next === T.Slash
            || next === T.Minus
            || next === T.MinusPercent)
    ) {
        prefixes.push({ s: context.s, k: next })
        context.index++
    }

    let base = parseExprWithSuffixes(context)

    while (prefixes.length) {
        const { s, k } = prefixes.pop()!
        if (k === T.Ques) {
            base = { s, e: base.e, k: "ty-optional", v: { child: base } }
            continue
        }

        base = { s, e: base.e, k: "op-prefix", v: { name: OP_PREFIX[k], arg: base } }
    }

    return base
}

function createInfixParser(
    base: (context: ParseContext) => Expr,
    infixes: Partial<Record<T, OpInfix>>,
) {
    return (context: ParseContext): Expr => {
        let lhs = base(context)
        let next
        while (((next = context.peek()), Object.hasOwn(infixes, next))) {
            context.index++
            const rhs = base(context)
            lhs = { s: lhs.s, e: rhs.e, k: "op-infix", v: { name: infixes[next]!, lhs, rhs } }
        }
        return lhs
    }
}

// todo: wgsl operator precedence. it's generally clearer, but I don't care to implement it right now

const iProd = createInfixParser(parseExprWithPrefixes, {
    [T.Star]: "*",
    [T.StarPercent]: "*%",
    [T.Slash]: "/",
    [T.Percent]: "%",
})

const iSum = createInfixParser(iProd, {
    [T.Plus]: "+",
    [T.PlusPercent]: "+%",
    [T.Minus]: "-",
    [T.MinusPercent]: "-%",
})

const iShift = createInfixParser(iSum, { [T.LtLt]: "<<", [T.GtGt]: ">>" })
const iBitOp = createInfixParser(iShift, { [T.Tilde]: "~", [T.Amp]: "&", [T.Bar]: "|" })

function iOrelse(context: ParseContext): Expr {
    let lhs = iBitOp(context)
    while (context.peek() === T.KOrelse) {
        context.index++
        const rhs = iBitOp(context)
        lhs = { s: lhs.s, e: rhs.e, k: "cf-orelse", v: { lhs, rhs } }
    }
    return lhs
}

const iCmp = createInfixParser(iOrelse, {
    [T.EqEq]: "==",
    [T.BangEq]: "!=",
    [T.Lt]: "<",
    [T.LtEq]: "<=",
    [T.Gt]: ">",
    [T.GtEq]: ">=",
})

function iAnd(context: ParseContext): Expr {
    let lhs = iCmp(context)
    while (context.peek() === T.KAnd) {
        context.index++
        const rhs = iCmp(context)
        lhs = { s: lhs.s, e: rhs.e, k: "cf-and", v: { lhs, rhs } }
    }
    return lhs
}

function iOr(context: ParseContext): Expr {
    let lhs = iAnd(context)
    while (context.peek() === T.KOr) {
        context.index++
        const rhs = iAnd(context)
        lhs = { s: lhs.s, e: rhs.e, k: "cf-or", v: { lhs, rhs } }
    }
    return lhs
}

export function parseExpr(context: ParseContext): Expr {
    return iOr(context)
}

export function parseFile(context: ParseContext): Decl[] {
    const ret = parseDeclBlockInner(context)
    if (context.peek() !== T.Eof) {
        context.raise("expected declaration or end of file")
    }
    return ret
}

function parseSwitchPattern(context: ParseContext): SwitchPat {
    if (context.peek() === T.KElse) {
        const s = context.s
        context.take(T.KElse)
        return { s, e: context.e, k: "else", v: null }
    }
    return parseExpr(context)
}
