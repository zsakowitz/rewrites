import { assert, unreachable } from "./assert"
import { Errors, TraceEntry } from "./error"
import { readFrac, type Frac } from "./frac"
import { T, type Tokens } from "./token"

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
export type Label = { s: number; e: number; name: string } | null
export type SwitchPat = { s: number; e: number; k: "else"; v: null } | Expr
export type ForInput =
    // | { s: number; e: number; k: "range"; v: { lhs: Expr; rhs: Expr | null } }
    // | { s: number; e: number; k: "plain"; v: Expr }
    Expr
export type TestName =
    | { s: number; e: number; k: "lit-str"; v: string }
    | { s: number; e: number; k: "ident"; v: string }

export type Expr = { s: number; e: number } & (
    | { k: "error"; v: null }
    | { k: "lit-void"; v: null } // not expressable in surface syntax, use {}
    | { k: "lit-int"; v: /* nonnegative */ bigint }
    | { k: "lit-frac"; v: Frac }
    | { k: "lit-str"; v: string }
    | { k: "ty-optional"; v: { child: Expr } }
    | { k: "ty-array"; v: { len: Expr | null; child: Expr } }
    | { k: "ty-fn"; v: { args: Expr[]; ret: Expr } }
    | { k: "ns-struct"; v: { id: number; extern: boolean; child: Decl[] } }
    | { k: "ns-enum"; v: { id: number; extern: boolean; tag: Expr | null; child: Decl[] } }
    | { k: "ns-union"; v: { id: number; tag: Expr | null; child: Decl[] } }
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
    | { k: "cf-if"; v: { cond: Expr; capture: Ident | null; if: Expr; else: Expr | null } }
    | { k: "cf-switch"; v: { input: Expr; arms: SwitchArm[] } }
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

export type Decl = { s: number; e: number } & (
    | { k: "field-ident"; v: { name: Ident; default: Expr | null } } // a, (could be a field in a tuple or a field name for an enum)
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
        let defaultValue = null
        if (context.peek() === T.Eq) {
            context.index++
            defaultValue = parseExpr(context)
        }
        if (context.peek() !== T.RBrace) {
            context.take(T.Comma)
        }
        return { s, e: context.e, k: "field-ident", v: { name, default: defaultValue } }
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
            if (!name) throw new Error("TODO: argument name is required")
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
    const ret = parseDeclBlockInner(context)
    context.take(T.RBrace)
    return ret
}

function parseDeclBlockInner(context: ParseContext): Decl[] {
    const ret: Decl[] = []
    while (context.peek() !== T.RBrace && context.peek() !== T.Eof) {
        const i = context.index
        ret.push(parseDecl(context))
        if (i === context.index) break
    }
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

        case T.Str: {
            const raw = parseStr(context)!
            return { s, e: context.e, k: "lit-str", v: raw }
        }

        case T.Ident: {
            const raw = parseIdent(context)!
            // todo: labeled block, for, while, switch
            return { s, e: context.e, k: "ident", v: raw }
        }

        case T.Builtin: {
            const name = context.peekText().slice(1)
            context.index++
            const args = parseArguments(context)
            return { s, e: context.e, k: "builtin", v: { name, args } }
        }

        case T.Char:
            break

        case T.StrPart:
            break

        case T.KBreak: {
            context.index++
            const label = parseLabel(context)
            const value = parseExprMaybe(context)
            return { s, e: context.e, k: "cf-break", v: { label, value } }
        }

        case T.KComptime: {
            context.index++
            const v = parseExpr(context)
            return { s, e: context.e, k: "cf-comptime", v }
        }

        case T.KContinue: {
            context.index++
            const label = parseLabel(context)
            return { s, e: context.e, k: "cf-continue", v: { label } }
        }

        case T.KEnum: {
            context.index++
            const tag = parseTagType(context)
            const child = parseDeclBlock(context)
            return { s, e: context.e, k: "ns-enum", v: { id: nextId++, extern: false, tag, child } }
        }

        case T.KExtern: {
            context.index++
            const k =
                context.peek() === T.KEnum ? "ns-enum"
                : context.peek() === T.KStruct ? "ns-struct"
                : null
            if (k === null) {
                context.raise("Expected `enum` or `struct`")
                return { s, e: context.e, k: "error", v: null }
            }
            context.index++
            const tag = k !== "ns-struct" ? parseTagType(context) : null
            const child = parseDeclBlock(context)
            if (k === "ns-enum")
                return { s, e: context.e, k, v: { id: nextId++, extern: true, tag, child } }
            return { s, e: context.e, k, v: { id: nextId++, extern: true, child } }
        }

        case T.KFor: {
            context.index++
            const args = parseArguments(context)
            const captures = parseCaptureN(context)
            const body = parseExpr(context)
            const belse = parseElse(context)
            return {
                s,
                e: context.e,
                k: "cf-for",
                v: { label: null, inputs: args, capture: captures, body, else: belse },
            }
        }

        case T.KIf: {
            context.index++
            context.take(T.LParen)
            const condition = parseExpr(context)
            context.take(T.RParen)
            const capture = parseCapture1(context)
            const bif = parseExpr(context)
            const belse = parseElse(context)
            return {
                s,
                e: context.e,
                k: "cf-if",
                v: { cond: condition, capture, if: bif, else: belse },
            }
        }

        case T.KReturn: {
            context.index++
            const value = parseExprMaybe(context)
            return { s, e: context.e, k: "cf-return", v: { value } }
        }

        case T.KStruct: {
            context.index++
            const child = parseDeclBlock(context)
            return { s, e: context.e, k: "ns-struct", v: { id: nextId++, extern: false, child } }
        }

        case T.KSwitch: {
            context.index++
            context.take(T.LParen)
            const scrutinee = parseExpr(context)
            context.take(T.RParen)
            context.take(T.LBrace)
            const arms: SwitchArm[] = []
            while (context.peek() !== T.RBrace && context.peek() !== T.Eof) {
                const i = context.index
                const pat = [parseSwitchPattern(context)]
                while (context.peek() === T.Comma) {
                    context.index++
                    pat.push(parseSwitchPattern(context))
                }
                context.take(T.EqGt)
                const capture = parseCapture1(context)
                const body = parseExpr(context)
                if (context.peek() === T.RBrace) break
                context.take(T.Comma)
                arms.push({ pat, capture, body })
                if (context.index === i) break
            }
            context.take(T.RBrace)
            return { s, e: context.e, k: "cf-switch", v: { input: scrutinee, arms } }
        }

        case T.KUnion: {
            context.index++
            const tag = parseTagType(context)
            const child = parseDeclBlock(context)
            return { s, e: context.e, k: "ns-union", v: { id: nextId++, tag, child } }
        }

        case T.KUnreachable: {
            context.index++
            return { s, e: context.e, k: "cf-unreachable", v: null }
        }

        case T.KWhile: {
            context.index++
            context.take(T.LParen)
            const condition = parseExpr(context)
            context.take(T.RParen)
            const capture = parseCapture1(context)
            const body = parseExpr(context)
            const belse = parseElse(context)
            return {
                s,
                e: context.e,
                k: "cf-while",
                v: { label: null, input: condition, capture, body, else: belse },
            }
        }

        case T.Dot:
            return parseExprAtomDot(context)

        case T.LBrace:
            return parseBlock(context)

        case T.LBrack: {
            context.index++
            const len = parseExprMaybe(context)
            context.take(T.RBrack)
            const child = parseExpr(context)
            return { s, e: context.e, k: "ty-array", v: { len, child } }
        }

        case T.LParen: {
            context.index++
            const v = parseExpr(context)
            context.take(T.RParen)
            return { s, e: context.e, k: "paren", v }
        }

        case T.Underscore:
            context.index++
            return { s, e: context.e, k: "underscore", v: null }

        default:
            context.raise("Expected expression")
            return { s, e: context.e, k: "error", v: null }
    }

    context.raise("Expression type not implemented")
    return { s, e: context.e, k: "error", v: null }
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
    const e = context.e
    if (context.s !== e) {
        context.raise("Expected identifier to immediately follow `:` in label")
    }
    const ident = parseIdent(context)
    return ident
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
                if (!name) throw new Error("Invalid expression")
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
    while (context.peek() === T.KAnd) {
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
        context.raise("Invalid declaration")
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
