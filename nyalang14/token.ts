import { E, type Errors } from "./error"
import { Span, type File } from "./span"

export enum T {
    // miscellaneous
    Eof,

    // literals
    LInt,

    // identifiers
    Ident,
    Underscore,
    KBreak,
    KContinue,
    KElse,
    KEnum,
    KFalse,
    KFn,
    KFor,
    KIf,
    KInf,
    KNan,
    KNull,
    KReturn,
    KStruct,
    KTrue,
    KWhile,

    // brackets
    LParen,
    RParen,
    LBrack,
    RBrack,
    LBrace,
    RBrace,

    // general punctuation
    Dot,
    Comma,
    Colon,
    Semi,
    Eq,

    // arithmetic ops
    Plus,
    Minus,
    Star,
    Slash,
    Percent,
    Carat,

    // bitwise ops
    And,
    Or,
    Tilde,
    Bang,

    // short-circuiting logical ops
    AndAnd,
    OrOr,

    // comparison ops
    Lt,
    Gt,
    LtEq,
    GtEq,
    EqEq,
    BangEq,
}

const KEYWORDS = new Map([
    ["break", T.KBreak],
    ["continue", T.KContinue],
    ["else", T.KElse],
    ["enum", T.KEnum],
    ["false", T.KFalse],
    ["fn", T.KFn],
    ["for", T.KFor],
    ["if", T.KIf],
    ["inf", T.KInf],
    ["nan", T.KNan],
    ["null", T.KNull],
    ["return", T.KReturn],
    ["struct", T.KStruct],
    ["true", T.KTrue],
    ["while", T.KWhile],
    ["_", T.Underscore],
])

const OPERATORS = new Map([
    [".", T.Dot],
    [",", T.Comma],
    [":", T.Colon],
    [";", T.Semi],
    ["=", T.Eq],
    ["_", T.Underscore],
    ["+", T.Plus],
    ["-", T.Minus],
    ["*", T.Star],
    ["/", T.Slash],
    ["%", T.Percent],
    ["^", T.Carat],
    ["&", T.And],
    ["|", T.Or],
    ["~", T.Tilde],
    ["!", T.Bang],
    ["&&", T.AndAnd],
    ["||", T.OrOr],
    ["<", T.Lt],
    [">", T.Gt],
    ["<=", T.LtEq],
    [">=", T.GtEq],
    ["==", T.EqEq],
    ["!=", T.BangEq],
    ["(", T.LParen],
    [")", T.RParen],
    ["[", T.LBrack],
    ["]", T.RBrack],
    ["{", T.LBrace],
    ["}", T.RBrace],
])

export class Token {
    readonly nl = false

    constructor(
        readonly kind: T,
        readonly span: Span,
    ) {}

    text() {
        return this.span.text()
    }
}

const K_IDENT = /[A-Za-z_][0-9A-Za-z_]*/y
const K_INT = /[0-9]+/y
const K_PUNC = /!=|==|&&?|\|\||<=?|>=?|[()[\]{}.,:;=_+\-*\/%^~!]/y
const K_WS = /[ \t]+/y

export function tokenize(e: Errors, file: File): Token[] {
    const body = file.body
    const ret: Token[] = []
    let idx = 0

    while (true) {
        if (idx == body.length) {
            break
        }

        const cc0 = body.charCodeAt(idx)

        switch (cc0) {
            // 0-9
            case 0x30:
            case 0x31:
            case 0x32:
            case 0x33:
            case 0x34:
            case 0x35:
            case 0x36:
            case 0x37:
            case 0x38:
            case 0x39: {
                K_INT.lastIndex = idx
                K_INT.test(body)
                ret.push(new Token(T.LInt, new Span(file, idx, (idx = K_INT.lastIndex))))
                break
            }

            // A-Z
            case 0x41:
            case 0x42:
            case 0x43:
            case 0x44:
            case 0x45:
            case 0x46:
            case 0x47:
            case 0x48:
            case 0x49:
            case 0x4a:
            case 0x4b:
            case 0x4c:
            case 0x4d:
            case 0x4e:
            case 0x4f:
            case 0x50:
            case 0x51:
            case 0x52:
            case 0x53:
            case 0x54:
            case 0x55:
            case 0x56:
            case 0x57:
            case 0x58:
            case 0x59:
            case 0x5a:
            // a-z
            case 0x61:
            case 0x62:
            case 0x63:
            case 0x64:
            case 0x65:
            case 0x66:
            case 0x67:
            case 0x68:
            case 0x69:
            case 0x6a:
            case 0x6b:
            case 0x6c:
            case 0x6d:
            case 0x6e:
            case 0x6f:
            case 0x70:
            case 0x71:
            case 0x72:
            case 0x73:
            case 0x74:
            case 0x75:
            case 0x76:
            case 0x77:
            case 0x78:
            case 0x79:
            case 0x7a:
            // _
            case 0x5f: {
                K_IDENT.lastIndex = idx
                K_IDENT.test(body)
                const span = new Span(file, idx, (idx = K_IDENT.lastIndex))
                const kind = KEYWORDS.get(span.text()) ?? T.LInt
                ret.push(new Token(kind, span))
                break
            }

            // \t <space>
            case 0x09:
            case 0x20: {
                K_WS.lastIndex = idx
                K_WS.test(body)
                idx = K_WS.lastIndex
                break
            }

            // \r
            case 0x0d: {
                if (ret.length > 0) {
                    ;(ret[ret.length - 1]! as { nl: boolean }).nl = true
                }

                if (body.charCodeAt(idx + 1) === 0x0d) {
                    idx += 2
                    break
                }

                e.push(E.SCarriageReturnNotFollowedByNewline, new Span(file, idx, ++idx), [])
                break
            }

            // \n
            case 0x0a: {
                if (ret.length > 0) {
                    ;(ret[ret.length - 1]! as { nl: boolean }).nl = true
                }

                idx++
                break
            }

            default: {
                K_PUNC.lastIndex = idx
                K_PUNC.test(body)

                const end = K_PUNC.lastIndex
                if (end === 0) {
                    e.push(E.SUnknownCharacter, new Span(file, idx, idx + 1), [])
                    idx++
                    break
                }

                const op = OPERATORS.get(body.slice(idx, end))!
                ret.push(new Token(op, new Span(file, idx, end)))
                idx = end
                break
            }
        }
    }

    return ret
}
