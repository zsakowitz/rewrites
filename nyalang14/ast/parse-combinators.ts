import { type Errors } from "../error"
import { Span, type File } from "./span"
import { T, Token } from "./token"

export class Stream {
    idx = 0

    constructor(
        readonly errors: Errors,
        readonly file: File,
        readonly tokens: Token[] = [],
    ) {}
}

export type Parser<T> = (s: Stream) => T

/** Takes a specific token kind, otherwise returns an empty span. */
export function token(kind: T): Parser<Span> {
    return (s) => {
        const next = s.tokens[s.idx]

        if (next?.kind === kind) {
            s.idx++
            return next.span
        }

        return new Span(s.file, s.idx, s.idx)
    }
}

/** Parses only if a specific token kind is next in the stream. */
export function maybe<U>(onlyIf: T, base: Parser<U>): Parser<U | null> {
    return (s) => {
        const next = s.tokens[s.idx]

        if (next?.kind === onlyIf) {
            return base(s)
        }

        return null
    }
}

/** Runs all parsers sequentially. */
export function seq<const T extends readonly Parser<any>[]>(
    args: T,
): Parser<{ -readonly [K in keyof T]: ReturnType<T[K]> }> {
    return (s): any => {
        const ret = []
        for (const el of args) ret.push(el(s))
        return ret
    }
}

/** Runs parsers depending on what kind of token is next, defaulting to `.null`. */
export function match<U>(args: { null: Parser<U> } & Partial<Record<T, Parser<U>>>): Parser<U> {
    return (s) => {
        const kind = s.tokens[s.idx]?.kind
        if (kind !== void 0 && kind in args) {
            return args[kind]!(s)
        }
        return args.null(s)
    }
}

/** Maps the output of a parser. */
export function map<T, U>(base: Parser<T>, map: (x: T) => U): Parser<U> {
    return (s) => map(base(s))
}

/** Gets a specific property of a parser's output. */
export function key<T, K extends keyof T>(base: Parser<T>, key: K): Parser<T[K]> {
    return (s) => base(s)[key]
}
