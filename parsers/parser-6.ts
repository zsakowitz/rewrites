// A text parser based on results and coroutines.

export type Ok<T> = {
    readonly ok: true
    readonly data: T
    readonly error?: undefined
    readonly index: number
    readonly source: string
}

export type Error = {
    readonly ok: false
    readonly data?: undefined
    readonly error: string
    readonly index: number
    readonly source: string
}

export type PreviousState = {
    readonly index: number
    readonly source: string
    readonly ok?: true
}

export type Result<T> = Ok<T> | Error

export type Parser<T> = (state: PreviousState) => Result<T>
export type Infer<T extends Parser<any>> = T extends Parser<infer U> ? U : never

export function ok<T>(source: string, index: number, data: T): Result<T> {
    return {
        ok: true,
        data,
        index,
        source,
    }
}

export function error<T>(
    source: string,
    index: number,
    error: string,
): Result<T> {
    return {
        ok: false,
        error,
        index,
        source,
    }
}

/** Creates an initial state. */
export function initial(source: string): PreviousState {
    return { index: 0, source }
}

/** Create a function that actually parses something. */
export function createParseFn<T>(
    parser: Parser<T>,
): (source: string) => Result<T> {
    return (source) => parser(initial(source))
}

/** Matches a specific chunk of text. */
export function text<T extends string>(text: T): Parser<T> {
    const { length } = text

    return ({ source, index }) => {
        if (source.slice(index, index + length) == text) {
            return ok(source, index + length, text)
        } else {
            return error(
                source,
                index,
                `Expected '${text}'; found '${source.slice(index, index + 20)}${
                    source.length > index + 20 ? "..." : ""
                }'.`,
            )
        }
    }
}

/** Matches a specific chunk of text. */
export function regex(regex: RegExp): Parser<RegExpMatchArray> {
    if (regex.global) {
        throw new Error(
            "The regular expression passed to 'regex' must not be global.",
        )
    }

    if (regex.sticky) {
        throw new Error(
            "The regular expression passed to 'regex' must not be sticky.",
        )
    }

    if (regex.multiline) {
        throw new Error(
            "The regular expression passed to 'regex' must not be multiline.",
        )
    }

    if (!regex.source.startsWith("^")) {
        throw new Error(
            "The regular expression passed to 'regex' must start with a begin assertion (^).",
        )
    }

    return ({ source, index }) => {
        const match = source.slice(index).match(regex)

        if (!match) {
            return error(
                source,
                index,
                `Expected match for ${regex}; found '${source.slice(
                    index,
                    index + 20,
                )}${source.length > index + 20 ? "..." : ""}'.`,
            )
        }

        return ok(source, index + match[0]!.length, match)
    }
}

/** The type of function passed to {@link coroutine} */
export type CoroutineFunction<T> = (
    run: <U>(parser: Parser<U>) => U,
    resetIndex: () => void,
) => T

/** Runs a function that may include matchers. */
export function coroutine<T>(fn: CoroutineFunction<T>): Parser<T> {
    return ({ source, index: startIndex }) => {
        let index = startIndex

        try {
            const data = fn(
                (parser) => {
                    const nextState = parser({ source, index })

                    if (!nextState.ok) {
                        throw new Error(nextState.error)
                    }

                    index = nextState.index
                    return nextState.data
                },
                () => {
                    index = startIndex
                },
            )

            return ok(source, index, data)
        } catch (err) {
            return error(
                source,
                index,
                err instanceof Error ? err.message : String(err),
            )
        }
    }
}

/** Matches the first successful parser. */
export function choice<T extends readonly Parser<any>[]>(
    ...parsers: T
): Parser<Infer<T[number]>> {
    return coroutine((run, resetIndex) => {
        for (const parser of parsers) {
            resetIndex()

            try {
                return run(parser)
            } catch {}
        }

        throw new Error("Expected to match at least one parser.")
    })
}

/** Matches all parsers as a sequence. */
export function seq<T extends readonly Parser<any>[]>(
    ...parsers: T
): Parser<{ -readonly [K in keyof T]: Infer<T[K]> }> {
    return coroutine((run) => {
        const output: { -readonly [K in keyof T]: Infer<T[K]> } = [] as any

        for (const parser of parsers) {
            output.push(run(parser))
        }

        return output
    })
}

/** Matches a parser but returns to the initial index. */
export function lookahead<T>(parser: Parser<T>): Parser<T> {
    return coroutine((run, resetIndex) => {
        const value: T = run(parser)

        resetIndex()

        return value
    })
}

/** Matches if the passed parser fails, otherwise succeeds. */
export function not<T>(parser: Parser<T>): Parser<void> {
    return coroutine((run, resetIndex) => {
        try {
            run(parser)
        } catch {
            resetIndex()
            return
        }

        throw new Error("The parser passed to 'not' succeeded.")
    })
}

/** Creates a parser with a locally scoped setup. */
export function withSetup<T>(setup: () => CoroutineFunction<T>): Parser<T> {
    return coroutine(setup())
}

/**
 * Maps the value of a parser using a function. If the mapper throws, the parser
 * returns a failed state.
 */
export function map<T, U>(parser: Parser<T>, fn: (value: T) => U): Parser<U> {
    return coroutine((run, resetIndex) => {
        const value = run(parser)

        try {
            return fn(value)
        } catch (err) {
            resetIndex()
            throw err
        }
    })
}

/** Changes the data of a parser to `undefined`. */
export function voidify(parser: Parser<unknown>): Parser<void> {
    return coroutine((run) => {
        run(parser)
    })
}

/**
 * Refines a parser by forcing its data to match a condition. If the refiner
 * throws, the parser returns a failed state.
 */
export function refine<T>(
    parser: Parser<T>,
    fn: (value: T) => boolean,
): Parser<T> {
    return coroutine((run, resetIndex) => {
        const value = run(parser)

        try {
            if (fn(value)) {
                return value
            } else {
                throw new Error("Refinement failed.")
            }
        } catch (err) {
            resetIndex()
            throw err
        }
    })
}

/** Always succeeds, matching nothing. */
export const succeed = coroutine(() => {})

/** Makes a parser optional. */
export function optional<T>(parser: Parser<T>): Parser<T | undefined> {
    return coroutine((run, resetIndex) => {
        try {
            return run(parser)
        } catch {
            resetIndex()
        }
    })
}

/** If the parser succeeds, returns its value. Otherwise, returns the default. */
export function withDefault<T, U>(
    parser: Parser<T>,
    defaultValue: U,
): Parser<T | U> {
    return coroutine((run, resetIndex) => {
        try {
            return run(parser)
        } catch {
            resetIndex()
            return defaultValue
        }
    })
}

/**
 * Creates a parser that only figures out what it's parsing when needed. If the
 * function throws, parsing fails.
 */
export function lazy<T>(fn: () => Parser<T>): Parser<T> {
    let cached: Parser<T> | undefined

    return coroutine((run) => {
        if (!cached) {
            cached = fn()
        }

        return run(cached)
    })
}

/** Only succeeds when at the end of a file. */
export const eof: Parser<void> = voidify(regex(/^$/))

/** Matches zero or more occurrences of a parser. */
export function many<T>(parser: Parser<T>): Parser<T[]> {
    return coroutine((run) => {
        const output: T[] = []

        while (true) {
            try {
                output.push(run(parser))
            } catch {
                return output
            }
        }
    })
}

/** Matches one or more occurrences of a parser. */
export function many1<T>(parser: Parser<T>): Parser<T[]> {
    return coroutine((run) => {
        const output: T[] = []

        while (true) {
            try {
                output.push(run(parser))
            } catch {
                if (output.length == 0) {
                    throw new Error("Expected at least one match; found zero.")
                }

                return output
            }
        }
    })
}
