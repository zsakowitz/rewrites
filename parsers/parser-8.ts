// #::exclude

export type Ok<out T> = {
    readonly ok: true
    readonly source: string
    readonly index: number
    readonly value: T
}

export type Error = {
    readonly ok: false
    readonly source: string
    readonly index: number
    readonly error: string
}

export type Result<T> = Ok<T> | Error

export function ok<T>(
    state: Ok<unknown>,
    newIndex: number,
    newValue: T,
): Ok<T> {
    return {
        ok: true,
        source: state.source,
        index: newIndex,
        value: newValue,
    }
}

export function error(state: Result<unknown>, newError: string): Error {
    return {
        ok: false,
        source: state.source,
        index: state.index,
        error: newError,
    }
}

export function initial(text: string): Ok<undefined> {
    return {
        ok: true,
        source: text,
        index: 0,
        value: undefined,
    }
}

export type Infer<T extends Parser<unknown>> =
    T extends Parser<infer U> ? U : never

export class Parser<T> {
    #p: (state: Ok<unknown>) => Result<T>

    constructor(p: (state: Ok<unknown>) => Result<T>) {
        this.#p = p
    }

    get p() {
        return this.#p
    }

    parse(text: string) {
        return this.#p(initial(text))
    }

    transform<U>(fn: (state: Ok<T>) => Result<U>): Parser<U> {
        return new Parser((state) => {
            const next = this.#p(state)

            if (!next.ok) {
                return next
            }

            return fn(next)
        })
    }

    map<U>(fn: (value: T, index: number) => U) {
        return new Parser((state) => {
            const next = this.#p(state)

            if (!next.ok) {
                return next
            }

            try {
                return ok(next, next.index, fn(next.value, next.index))
            } catch (err) {
                return error(
                    state,
                    err instanceof Error ? err.message : String(err),
                )
            }
        })
    }

    key<K extends keyof T>(key: K): Parser<T[K]> {
        return new Parser((state) => {
            const next = this.#p(state)

            if (!next.ok) {
                return next
            }

            try {
                return ok(next, next.index, next.value[key])
            } catch (err) {
                return error(
                    state,
                    err instanceof Error ? err.message : String(err),
                )
            }
        })
    }

    refine<U extends T>(
        fn: (value: T, index: number) => value is U,
        message?: string,
    ): Parser<U>

    refine(
        fn: (value: T, index: number) => boolean,
        message?: string,
    ): Parser<T>

    refine(
        fn: (value: T, index: number) => boolean,
        message = "Refinement failed.",
    ) {
        return new Parser((state) => {
            const next = this.#p(state)

            if (!next.ok) {
                return next
            }

            if (!fn(next.value, next.index)) {
                return error(state, message)
            }

            return next
        })
    }

    chain<U>(fn: (value: T, index: number) => Parser<U>): Parser<U> {
        return new Parser((state) => {
            const next = this.#p(state)

            if (!next.ok) {
                return next
            }

            const chained = fn(next.value, next.index)

            return chained.p(state)
        })
    }

    or<U>(other: Parser<U>): Parser<T | U> {
        return any(this, other)
    }

    optional(): Parser<T | undefined> {
        return any(this, always(undefined))
    }

    many(): Parser<T[]> {
        return many(this)
    }

    many1(): Parser<[T, ...T[]]> {
        return many1(this)
    }
}

export function always<T>(value: T): Parser<T> {
    return new Parser((state) => {
        return ok(state, state.index, value)
    })
}

export function never(
    message = "Reached an unreachable point.",
): Parser<never> {
    return new Parser<never>((state) => {
        return error(state, message)
    })
}

export function text<T extends string>(text: T): Parser<T> {
    return new Parser((state) => {
        if (state.source.startsWith(text, state.index)) {
            return ok(state, state.index + text.length, text)
        } else {
            return error(
                state,
                "Expected '"
                    + text
                    + "'; found '"
                    + state.source.slice(state.index, state.index + 20)
                    + "'.",
            )
        }
    })
}

export function regex(regex: RegExp): Parser<RegExpExecArray> {
    if (regex.global) {
        throw new TypeError("Cannot use global regular expressions in regex().")
    }

    if (regex.multiline) {
        throw new TypeError(
            "Cannot use multiline regular expressions in regex().",
        )
    }

    if (regex.sticky) {
        throw new TypeError("Cannot use sticky regular expressions in regex().")
    }

    if (!regex.source.startsWith("^")) {
        throw new TypeError(
            "Regular expressions passed to regex() must start with ^.",
        )
    }

    return new Parser((state) => {
        const match = regex.exec(state.source.slice(state.index))

        if (match == null) {
            return error(
                state,
                "Expected match for "
                    + regex
                    + "; found '"
                    + state.source.slice(state.index, state.index + 20)
                    + "'.",
            )
        }

        return ok(state, state.index + match[0].length, match)
    })
}

export function any<T extends readonly Parser<unknown>[]>(
    ...parsers: T
): Parser<Infer<T[number]>> {
    return new Parser((state) => {
        for (const parser of parsers) {
            const next = parser.p(state) as Result<Infer<T[number]>>

            if (next.ok) {
                return next
            }
        }

        return error(
            state,
            "The source failed to match any parser passed to 'any'.",
        )
    })
}

export function seq<T extends readonly Parser<unknown>[]>(
    ...parsers: T
): Parser<{ -readonly [K in keyof T]: Infer<T[K]> }> {
    return new Parser<any>((state) => {
        const output: any[] = []

        for (const parser of parsers) {
            const next = parser.p(state)

            if (!next.ok) {
                return next
            }

            output.push(next.value)

            state = next
        }

        return ok(state, state.index, output)
    })
}

export function many<T>(parser: Parser<T>): Parser<T[]> {
    return new Parser((state) => {
        const output: T[] = []

        while (true) {
            const next = parser.p(state)

            if (!next.ok) {
                return ok(state, state.index, output)
            }

            output.push(next.value)

            state = next
        }
    })
}

export function many1<T>(parser: Parser<T>): Parser<[T, ...T[]]> {
    return new Parser((state) => {
        const output: T[] = []

        while (true) {
            const next = parser.p(state)

            if (!next.ok) {
                if (output.length == 0) {
                    return error(
                        state,
                        "Expected at least one repetition; found none.",
                    )
                }

                return ok(state, state.index, output as [T, ...T[]])
            }

            output.push(next.value)

            state = next
        }
    })
}

export function lookahead<T>(parser: Parser<T>): Parser<T> {
    return new Parser((state) => {
        const next = parser.p(state)

        if (!next.ok) {
            return next
        }

        return ok(next, state.index, next.value)
    })
}

export function lazy<T>(parser: () => Parser<T>): Parser<T> {
    let cached: Parser<T> | undefined

    return new Parser((state) => {
        if (cached == null) {
            cached = parser()
        }

        return cached.p(state)
    })
}
