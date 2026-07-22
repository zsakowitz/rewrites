import { E, type Errors } from "../error"
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

        s.errors.push(
            E.PUnexpectedToken,
            s.tokens[s.idx]?.span ?? new Span(s.file, s.file.body.length, s.file.body.length),
            [kind],
        )

        return new Span(
            s.file,
            next?.span.start ?? s.file.body.length,
            next?.span.start ?? s.file.body.length,
        )
    }
}

/** Parses only if a specific token kind is next in the stream. */
export function onlyIf<U>(next: T, base: Parser<U>): Parser<U | null> {
    return (s) => {
        const next = s.tokens[s.idx]

        if (next?.kind === next) {
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

        s.errors.push(
            E.PUnexpectedToken,
            s.tokens[s.idx]?.span ?? new Span(s.file, s.file.body.length, s.file.body.length),
            Object.keys(args)
                .filter((x) => x !== "null")
                .map((x) => +x),
        )

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

/** Offloads parser creation until first usage. */
export function lazy<T>(base: () => Parser<T>): Parser<T> {
    let ret: Parser<T> | undefined

    return (s) => (ret ??= base())(s)
}

/** Tracks the span of the parsed value. */
export function withSpan<T extends {}>(base: Parser<T>): Parser<T & { s: Span }> {
    return (s) => {
        const start = s.tokens[s.idx]?.span.start ?? s.file.body.length
        const ret = base(s)
        const end =
            s.tokens[s.idx - 1]?.span.end ?? s.tokens[s.idx]?.span.start ?? s.file.body.length
        return Object.assign(ret, { s: new Span(s.file, start, end) })
    }
}

/** Shorthand for `lazy(() => withSpan(...))`. */
export function lazyWithSpan<T extends { s: Span }>(base: () => Parser<Omit<T, "s">>): Parser<T> {
    return withSpan(lazy(base)) as Parser<T>
}

/** Shorthand for `withSpan(match(...))`. */
export function matchWithSpan<U extends { s: Span }>(
    args: { null: Parser<Omit<U, "s">> } & Partial<Record<T, Parser<Omit<U, "s">>>>,
): Parser<U> {
    return withSpan(match(args)) as Parser<U>
}
