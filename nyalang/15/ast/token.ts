import { TraceEntry, type Errors } from "./error"
import type { File } from "./file"

export enum T {
    Eof,

    Int,
    Float,
    DotInt,
    Ident,
    Builtin,
    Char,
    Str, // "xyz"
    StrPart, // \\xyz

    KAnd,
    KBreak,
    KComptime,
    KConst,
    KContinue,
    KElse,
    KEnum,
    KExport,
    KExtern,
    KFn,
    KFor,
    KIf,
    KOr,
    KOrelse,
    KPub,
    KReturn,
    KStruct,
    KSwitch,
    KTest,
    KUnion,
    KUnreachable,
    KVar,
    KWhile,

    Amp,
    Bang,
    BangEq,
    Bar,
    Carat,
    Colon,
    Comma,
    Dot,
    DotQues,
    Eq,
    EqEq,
    Gt,
    GtEq,
    GtGt,
    LBrace,
    LBrack,
    LParen,
    Lt,
    LtEq,
    LtLt,
    Minus,
    MinusPercent,
    Plus,
    PlusPercent,
    Ques,
    RBrace,
    RBrack,
    RParen,
    Semi,
    Slash,
    Star,
    StarPercent,
    Tilde,
    Underscore,
}

export interface Tokens {
    readonly file: File
    readonly start: readonly number[]
    readonly end: readonly number[]
    readonly kind: readonly T[]
    readonly length: number
}

const IDENT = /[A-Za-z_][A-Za-z0-9_]*/y

const IDENT_KEYWORDS = new Map([
    ["and", T.KAnd],
    ["break", T.KBreak],
    ["comptime", T.KComptime],
    ["const", T.KConst],
    ["continue", T.KContinue],
    ["else", T.KElse],
    ["enum", T.KEnum],
    ["export", T.KExport],
    ["extern", T.KExtern],
    ["fn", T.KFn],
    ["for", T.KFor],
    ["if", T.KIf],
    ["or", T.KOr],
    ["orelse", T.KOrelse],
    ["pub", T.KPub],
    ["return", T.KReturn],
    ["struct", T.KStruct],
    ["switch", T.KSwitch],
    ["test", T.KTest],
    ["union", T.KUnion],
    ["unreachable", T.KUnreachable],
    ["var", T.KVar],
    ["while", T.KWhile],
    ["_", T.Underscore],
])

const NUMBER = /[0-9][A-Za-z0-9._-]*/y

const INT =
    /^(?:[0-9]+(?:_[0-9]+)*|0b[01]+(?:_[01]+)*|0x[0-9a-f]+(?:_[0-9a-f]+)*|0o[0-7]+(?:_[0-7]+)*)$/i

const FLOAT =
    /^(?:0x[0-9a-f]+(?:_[0-9a-f]+)*(?!$)(?:\.[0-9a-f]+(?:_[0-9a-f]+)*)?(?:p[+-]?[0-9]+)?|[0-9]+(?:_[0-9]+)*(?!$)(?:\.[0-9]+(?:_[0-9]+)*)?(?:e[+-]?[0-9]+)?)$/i

const STRING = /"(?:[^"\\\r\n]|\\[\\nrt'"]|\\x[0-9a-f]{2}|\\u\{[0-9a-f]+\})*"/iy

const WS = /[ \t\n\r]+/y

const DOT_INT = /\.[0-9]+/y

const OPERATORS = new Map([
    ["&", T.Amp],
    ["!", T.Bang],
    ["!=", T.BangEq],
    ["|", T.Bar],
    ["^", T.Carat],
    [":", T.Colon],
    [",", T.Comma],
    [".", T.Dot],
    [".?", T.DotQues],
    ["=", T.Eq],
    ["==", T.EqEq],
    [">", T.Gt],
    [">=", T.GtEq],
    [">>", T.GtGt],
    ["{", T.LBrace],
    ["[", T.LBrack],
    ["(", T.LParen],
    ["<", T.Lt],
    ["<=", T.LtEq],
    ["<<", T.LtLt],
    ["-", T.Minus],
    ["-%", T.MinusPercent],
    ["+", T.Plus],
    ["+%", T.PlusPercent],
    ["?", T.Ques],
    ["}", T.RBrace],
    ["]", T.RBrack],
    [")", T.RParen],
    [";", T.Semi],
    ["/", T.Slash],
    ["*", T.Star],
    ["*%", T.StarPercent],
    ["~", T.Tilde],
])

const OPERATOR = /!=|<=|>=|<<|>>|.?|[+\-*]%|[&!|^:,.=>{[(<\-+?}\]);/\*~]/y

export function tokenize(errors: Errors, file: File): Tokens {
    const { body } = file

    const start: number[] = []
    const end: number[] = []
    const kind: T[] = []
    let index = 0

    while (index < body.length) {
        IDENT.lastIndex = index
        if (IDENT.test(body)) {
            start.push(index)
            end.push(IDENT.lastIndex)
            const value = body.slice(index, (index = IDENT.lastIndex))
            kind.push(IDENT_KEYWORDS.get(value) ?? T.Ident)
            continue
        }

        NUMBER.lastIndex = index
        if (NUMBER.test(body)) {
            const i0 = index
            const i1 = (index = NUMBER.lastIndex)

            if (INT.test(body.slice(i0, i1))) {
                start.push(i0)
                end.push(i1)
                kind.push(T.Int)
                continue
            }

            if (FLOAT.test(body.slice(i0, i1))) {
                start.push(i0)
                end.push(i1)
                kind.push(T.Float)
                continue
            }

            errors.raise(
                new TraceEntry(
                    file,
                    i0,
                    i1,
                    body.slice(i0, i1).includes("-") ?
                        "Invalid numeric literal; if `-` is meant to subtract numbers, surround it with whitespace"
                    :   "Invalid numeric literal",
                ),
            )

            continue
        }

        WS.lastIndex = index
        if (WS.test(body)) {
            index = WS.lastIndex
            continue
        }

        STRING.lastIndex = index
        if (STRING.test(body)) {
            start.push(index)
            end.push((index = STRING.lastIndex))
            kind.push(T.Str)
            continue
        }

        DOT_INT.lastIndex = index
        if (DOT_INT.test(body)) {
            start.push(index)
            end.push((index = DOT_INT.lastIndex))
            kind.push(T.DotInt)
            continue
        }

        OPERATOR.lastIndex = index
        if (OPERATOR.test(body)) {
            start.push(index)
            end.push(OPERATOR.lastIndex)
            kind.push(OPERATORS.get(body.slice(index, (index = OPERATOR.lastIndex)))!)
            continue
        }

        if (body.charAt(index) === "@" && body.charAt(index + 1) === '"') {
            STRING.lastIndex = index + 1
            if (!STRING.test(body)) {
                errors.raise(TraceEntry.at(file, index, "Invalid string literal"))
                index = file.lineEnd[file.row(index)]!
                continue
            }

            start.push(index)
            end.push((index = STRING.lastIndex))
            kind.push(T.Ident)

            continue
        }

        if (body.charAt(index) === "@") {
            IDENT.lastIndex = index + 1
            if (!IDENT.test(body)) {
                errors.raise(TraceEntry.at(file, index, "Invalid builtin name"))
                index = file.lineEnd[file.row(index)]!
                continue
            }

            start.push(index)
            end.push((index = IDENT.lastIndex))
            kind.push(T.Builtin)

            continue
        }

        if (body.charAt(index) === "\\" && body.charAt(index + 1) === "\\") {
            start.push(index)
            end.push((index = file.lineEnd[file.row(index)]!))
            continue
        }

        errors.raise(TraceEntry.at(file, index, "Invalid token"))
        index = file.lineEnd[file.row(index)]!
    }

    return { file, start, end, kind, length: kind.length }
}
