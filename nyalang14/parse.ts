import { E, type Errors } from "./error"
import { join, Span, type File } from "./span"
import { T, Token } from "./token"

export class Stream {
    idx = 0

    constructor(
        readonly e: Errors,
        readonly file: File,
        readonly tokens: Token[] = [],
    ) {}

    spanHere(): Span {
        return new Span(this.file, this.idx, this.idx)
    }

    peek(): T {
        return this.tokens[this.idx]?.kind ?? T.Eof
    }

    peekSpan(): Span {
        if (this.idx === this.tokens.length) {
            return new Span(this.file, this.file.body.length, this.file.body.length)
        }

        return this.tokens[this.idx]!.span
    }

    /** Assumes that a token is available. */
    take(): Token {
        return this.tokens[this.idx++]!
    }

    takeExpecting(kind: Exclude<T, T.Eof>): Token {
        if (this.peek() !== kind) {
            return new Token(kind, this.spanHere())
        }

        return this.tokens[this.idx++]!
    }
}

/** Instructions are evaluated in order */
export type Expr =
    | { s: Span; k: "ident"; v: string }
    | { s: Span; k: "lit-int"; v: bigint }
    | { s: Span; k: "error"; v: null }
    | { s: Span; k: "paren"; v: Expr }
    | { s: Span; k: "lit-dot"; v: { name: Span } }

export function exprAtom(s: Stream): Expr {
    switch (s.peek()) {
        case T.Ident: {
            const token = s.take()
            return { s: token.span, k: "ident", v: token.text() }
        }

        case T.LInt: {
            const token = s.take()
            return { s: token.span, k: "lit-int", v: BigInt(token.text()) }
        }

        case T.LParen: {
            const lparen = s.take()
            const inner = expr(s)
            const rparen = s.takeExpecting(T.RParen)
            return { s: join(lparen.span, rparen.span), k: "paren", v: inner }
        }

        default:
            s.e.push(E.PExpectedExpr, s.peekSpan(), [])
            return { s: s.spanHere(), k: "error", v: null }
    }
}

export function exprWithSuffixes(s: Stream): Expr {
    const base = exprAtom(s)

    while (true) {
        if (s.peek()) {
        }
    }
}

export function expr(s: Stream): Expr {
    return exprAtom(s)
}

// type syntax:
//
// type.path
// struct { decl* }
// enum { decl* }
// []type
// fn(type, type) type
//
// fn +(a: Self, b: Self) Self {
//     .{ re: a.re + b.re, im: a.im + b.im }
// }
