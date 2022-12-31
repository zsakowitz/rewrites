// A fifth system for parsing text. #parser

/** A failed state. */
export type Error = {
  readonly index: number
  readonly ok: false
  readonly source: string
  readonly value: string
}

/** A successful state. */
export type Ok<T> = {
  readonly index: number
  readonly ok: true
  readonly source: string
  readonly value: T
}

/** A generic state that may be successful or failed. */
export type State<T> = Ok<T> | Error

/** Creates an {@link Ok} state from an existing state with a new index and value. */
export function ok<T>(
  previous: State<unknown>,
  index: number,
  value: T
): State<T> {
  return {
    index,
    ok: true,
    source: previous.source,
    value,
  }
}

/** Creates an {@link Error} state from an existing state with a new value. */
export function error<T>(previous: State<unknown>, value: string): State<T> {
  return {
    index: previous.index,
    ok: false,
    source: previous.source,
    value,
  }
}

/** Creates an initial state. */
export function initial(source: string): State<undefined> {
  return {
    index: 0,
    ok: true,
    source,
    value: undefined,
  }
}

/** A parser. */
export class Parser<T> {
  constructor(
    /** A function that reads the current state and returns a new one. */
    readonly p: (state: State<unknown>) => State<T>
  ) {}

  parse(source: string): State<T> {
    return this.p(initial(source))
  }
}

/** Any parser. */
export type AnyParser = Parser<unknown>

/** Infers the return type of a parser. */
export type Infer<T extends AnyParser> = T extends Parser<infer U> ? U : never

/** Matches a specific string. */
export function text<T extends string>(text: T): Parser<T> {
  const { length } = text

  return new Parser((state) => {
    if (!state.ok) {
      return state
    }

    if (state.source.slice(state.index, state.index + length) == text) {
      return ok(state, state.index + length, text)
    }

    return error(
      state,
      `Expected string '${text}'; received '${state.source.slice(
        state.index,
        state.index + 10
      )}${state.source.length > state.index + 10 ? "..." : ""}.'`
    )
  })
}

/** Matches any character. */
export function char(): Parser<string> {
  return new Parser((state) => {
    if (!state.ok) {
      return state
    }

    const char = state.source[state.index]

    if (char) {
      return ok(state, state.index + 1, char)
    }

    return error(state, `Expected a character; received EOF.`)
  })
}

/** Matches a sequence of parsers. */
export function seq<T extends readonly Parser<unknown>[]>(
  ...parsers: T
): Parser<{
  readonly [K in keyof T]: Infer<T[K]>
}> {
  return new Parser((state) => {
    if (!state.ok) {
      return state
    }

    const output: {
      -readonly [K in keyof T]: Infer<T[K]>
    } = [] as any

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

/** Matches any of the passed parsers. */
export function any<T extends readonly Parser<unknown>[]>(
  ...parsers: T
): Parser<Infer<T[number]>> {
  return new Parser((state) => {
    if (!state.ok) {
      return state
    }

    for (const parser of parsers) {
      const next = parser.p(state)

      if (next.ok) {
        return next as Ok<Infer<T[number]>>
      }
    }

    return error(state, "None of the parsers passed to 'any' matched.")
  })
}

/** Matches a parser, but returns `undefined` upon failure. */
export function optional<T>(parser: Parser<T>): Parser<T | undefined> {
  return new Parser((state) => {
    if (!state.ok) {
      return state
    }

    const next = parser.p(state)

    if (next.ok) {
      return next
    }

    return ok(state, state.index, undefined)
  })
}

/** Matches a parser without consuming input. */
export function lookahead<T>(parser: Parser<T>): Parser<T> {
  return new Parser((state) => {
    if (!state.ok) {
      return state
    }

    const next = parser.p(state)

    if (next.ok) {
      return ok(state, state.index, next.value)
    }

    return next
  })
}

/** Matches successfully if the provided parser fails. Doesn't consume input. */
export function not(parser: Parser<unknown>): Parser<undefined> {
  return new Parser((state) => {
    if (!state.ok) {
      return state
    }

    const next = parser.p(state)

    if (next.ok) {
      return error(state, "The parser passed to 'not' succeeded.")
    }

    return ok(state, state.index, undefined)
  })
}

/** Matches as many repeats of the provided parser as possible. */
export function many<T>(parser: Parser<T>): Parser<readonly T[]> {
  return new Parser((state) => {
    if (!state.ok) {
      return state
    }

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

/** Matches as at least one repeat of the provided parser, but more if possible. */
export function many1<T>(
  parser: Parser<T>
): Parser<readonly T[] & { readonly 0: T }> {
  return new Parser((state) => {
    if (!state.ok) {
      return state
    }

    const output: T[] = []

    while (true) {
      const next = parser.p(state)

      if (!next.ok) {
        if (output.length == 0) {
          return error(state, `Expected at least one match; found none.`)
        }

        return ok(state, state.index, output as T[] & { 0: T })
      }

      output.push(next.value)

      state = next
    }
  })
}
