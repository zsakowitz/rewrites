// @ts-nocheck

export type CapturingGroups = (string | undefined)[]

export type GetCapturingGroups<
    T extends RegexPart<CapturingGroups, NamedGroups>,
> = T[typeof CSymbol]

export type NamedGroups = Record<string, string | undefined>

export type GetNamedGroups<T extends RegexPart<CapturingGroups, NamedGroups>> =
    T[typeof NSymbol]

export type AsUndefined<T> = { [K in keyof T]: undefined }

export type ExpandAsUndefined<T> = Expand<AsUndefined<T>>

export type AnyRegexPart = RegexPart<CapturingGroups, NamedGroups>

export type UnionToIntersection<T> =
    (T extends any ? (x: T) => void : never) extends (x: infer U) => void ? U
    :   never

export type Expand<T> = T extends infer U ? { [K in keyof U]: U[K] } : never

declare const CSymbol: unique symbol
declare const NSymbol: unique symbol

export class RegexPart<
    C extends CapturingGroups = [],
    N extends NamedGroups = {},
> {
    [CSymbol]!: C;
    [NSymbol]!: N

    constructor(readonly source: string) {
        Object.freeze(this)
    }

    optional() {
        return new QuantifiedRegexPart<
            C | AsUndefined<C>,
            N | ExpandAsUndefined<N>
        >("(?:" + this.source + ")?")
    }

    zeroOrMore() {
        return new QuantifiedRegexPart<
            C | AsUndefined<C>,
            N | ExpandAsUndefined<N>
        >("(?:" + this.source + ")*")
    }

    oneOrMore() {
        return new QuantifiedRegexPart<C, N>("(?:" + this.source + ")+")
    }

    nOrMore(n: 0): never
    nOrMore(n: number): QuantifiedRegexPart<C, N>
    nOrMore(n: number) {
        if (n == 0) {
            throw new Error("Use `.zeroOrMore()` instead.")
        }

        return new QuantifiedRegexPart<C, N>(
            "(?:" + this.source + "){" + n + ",}",
        )
    }

    repeat(n: 0): never
    repeat(n: number): QuantifiedRegexPart<C, N>
    repeat(n: number) {
        if (n == 0) {
            throw new Error("Cannot repeat something zero times.")
        }

        return new QuantifiedRegexPart<C, N>(
            "(?:" + this.source + "){" + n + "}",
        )
    }

    withQuantifier(
        min: 0,
        max: number,
    ): QuantifiedRegexPart<C | AsUndefined<C>, N | ExpandAsUndefined<N>>

    withQuantifier(
        min: number,
        max: 0,
    ): QuantifiedRegexPart<C | AsUndefined<C>, N | ExpandAsUndefined<N>>

    withQuantifier(min: number, max: number): QuantifiedRegexPart<C, N>

    withQuantifier(min: number, max: number) {
        return new QuantifiedRegexPart<C, N>(
            "(?:" + this.source + "){" + min + "," + max + "}",
        )
    }

    not() {
        return new QuantifiedRegexPart<AsUndefined<C>, ExpandAsUndefined<N>>(
            "(?!" + this.source + ")",
        )
    }

    asGroup() {
        return new AtomicRegexPart<[string, ...C], N>("(" + this.source + ")")
    }

    asNamedGroup<K extends string>(name: K) {
        if (!/[$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*/u.test(name)) {
            throw new Error("Invalid group name.")
        }

        return new AtomicRegexPart<C, N & { K: string }>(
            "(?<" + escape(name) + ">" + this.source + ")",
        )
    }

    compile(flags = "") {
        return new RegExp(this.source, flags)
    }

    toRegexPart(): RegexPart<C, N> {
        return this
    }
}

export class AtomicRegexPart<
    C extends CapturingGroups = [],
    N extends NamedGroups = {},
> extends RegexPart<C, N> {
    optional() {
        return new QuantifiedRegexPart<
            C | AsUndefined<C>,
            N | ExpandAsUndefined<N>
        >(this.source + "?")
    }

    zeroOrMore() {
        return new QuantifiedRegexPart<
            C | AsUndefined<C>,
            N | ExpandAsUndefined<N>
        >(this.source + "*")
    }

    oneOrMore() {
        return new QuantifiedRegexPart<C, N>(this.source + "+")
    }

    nOrMore(n: 0): never
    nOrMore(n: number): QuantifiedRegexPart<C, N>
    nOrMore(n: number) {
        if (n == 0) {
            throw new Error("Use `.zeroOrMore()` instead.")
        }

        return new QuantifiedRegexPart<C, N>(this.source + "{" + n + ",}")
    }

    repeat(n: 0): never
    repeat(n: number): QuantifiedRegexPart<C, N>
    repeat(n: number) {
        if (n == 0) {
            throw new Error("Cannot repeat something zero times.")
        }

        return new QuantifiedRegexPart<C, N>(this.source + "{" + n + "}")
    }

    withQuantifier(
        min: 0,
        max: number,
    ): QuantifiedRegexPart<C | AsUndefined<C>, N | ExpandAsUndefined<N>>

    withQuantifier(
        min: number,
        max: 0,
    ): QuantifiedRegexPart<C | AsUndefined<C>, N | ExpandAsUndefined<N>>

    withQuantifier(min: number, max: number): QuantifiedRegexPart<C, N>

    withQuantifier(min: number, max: number) {
        return new QuantifiedRegexPart<C, N>(
            this.source + "{" + min + "," + max + "}",
        )
    }
}

export class QuantifiedRegexPart<
    C extends CapturingGroups = [],
    N extends NamedGroups = {},
> extends RegexPart<C, N> {
    lazy() {
        return new RegexPart<C, N>(this.source + "?")
    }
}

export class WithAlternatesRegexPart<
    C extends CapturingGroups = [],
    N extends NamedGroups = {},
> extends RegexPart<C, N> {
    toRegexPart(): RegexPart<C, N> {
        return new RegexPart<C, N>("(?:" + this.source + ")")
    }
}

export function escape(text: string) {
    return text.replace(/[\^$\\.*+?()[\]{}|-]/g, "\\$&")
}

export const start = new AtomicRegexPart("^")

export const end = new AtomicRegexPart("$")

export function chars(chars: string) {
    return new AtomicRegexPart("[" + escape(chars) + "]")
}

export function inverseChars(chars: string) {
    return new AtomicRegexPart("[^" + escape(chars) + "]")
}

export function text(text: string) {
    if (text.length == 1) {
        return new AtomicRegexPart(escape(text))
    } else {
        return new RegexPart(escape(text))
    }
}

export type Flat<U, T extends U[][], O extends U[] = []> =
    T extends [infer A extends any[], ...infer B extends any[][]] ?
        Flat<U, B, [...O, ...A]>
    : O extends U[] ? O
    : never

export type AnyC<T extends AnyRegexPart[]> = {
    [I in keyof T]: Flat<
        any,
        {
            [J in keyof T]: I extends J ? T[J][typeof CSymbol]
            :   AsUndefined<T[J][typeof CSymbol]>
        } extends infer Q extends any[] ?
            Q
        :   never
    >
}[number]

export type AnyN<T extends AnyRegexPart[]> = {
    [I in keyof T]: Expand<
        UnionToIntersection<
            {
                [J in keyof T]: I extends J ? T[J][typeof NSymbol]
                :   AsUndefined<T[J][typeof NSymbol]>
            }[number]
        >
    >
}[number]

export function any<T extends [AnyRegexPart, ...AnyRegexPart[]]>(...parts: T) {
    return new WithAlternatesRegexPart<AnyC<T>, AnyN<T>>(
        parts.map((x) => x.source).join("|"),
    )
}

export function anyText(...parts: [string, ...string[]]) {
    return new WithAlternatesRegexPart(parts.map((x) => escape(x)).join("|"))
}

export type SeqC<C extends CapturingGroups, T extends AnyRegexPart[]> =
    T extends (
        [infer A extends AnyRegexPart, ...infer B extends AnyRegexPart[]]
    ) ?
        SeqC<[...C, ...A[typeof CSymbol]], B>
    :   C

export type SeqN<N extends NamedGroups, T extends AnyRegexPart[]> =
    T extends (
        [infer A extends AnyRegexPart, ...infer B extends AnyRegexPart[]]
    ) ?
        SeqN<N & A[typeof NSymbol], B>
    :   N

export function seq<T extends [AnyRegexPart, ...AnyRegexPart[]]>(...parts: T) {
    return new RegexPart<SeqC<[], T>, SeqN<{}, T>>(
        parts.map((x) => x.toRegexPart().source).join(""),
    )
}
