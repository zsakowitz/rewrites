// Yet another system for parsing text. #parser

export type ArrayOfLength<
  N extends number,
  T,
  A extends T[] = [],
> = number extends N
  ? T[]
  : N extends A["length"]
  ? A
  : ArrayOfLength<N, T, [...A, T]>

export class State<T> {
  static of(input: string): State<undefined>
  static of<T>(input: string, value: T): State<T>
  static of<T>(input: string, value?: T): State<T | undefined> {
    return State.ok(input, 0, value)
  }

  static ok<T>(input: string, index: number, value: T): State<T> {
    return new State(true, input, index, value)
  }

  static error<T>(input: string, index: number, error?: string): State<T> {
    return new State(false, input, index, undefined!, error)
  }

  private constructor(
    readonly ok: boolean,
    readonly input: string,
    readonly index: number,
    readonly value?: T,
    readonly error?: string,
  ) {}

  asError<U>(reason = this.error): State<U> {
    return State.error(this.input, this.index, reason)
  }

  asOk<U>(index: number, value: U): State<U> {
    return State.ok(this.input, index, value)
  }
}

export class Parser<T> {
  constructor(readonly p: (state: State<unknown>) => State<T>) {}

  map<U>(fn: (value: T) => U): Parser<U> {
    return new Parser<U>((state) => {
      if (!state.ok) {
        return state.asError()
      }

      const nextState = this.p(state)

      if (!nextState.ok) {
        return nextState.asError()
      }

      return State.ok(nextState.input, nextState.index, fn(nextState.value!))
    })
  }

  key<K extends keyof T>(key: K): Parser<T[K]> {
    return this.map((value) => value[key])
  }
}

export function text<T extends string>(text: T): Parser<T> {
  const { length } = text

  return new Parser((state) => {
    if (!state.ok) {
      return state.asError()
    }

    const { index } = state

    if (state.input.slice(index, index + length) == text) {
      return state.asOk(index + length, text)
    }

    return state.asError(
      `'text' failed to match; the input string is '${state.input.slice(
        index,
        index + 20,
      )}...'`,
    )
  })
}

export function char(): Parser<string> {
  return new Parser((state) => {
    if (!state.ok) {
      return state.asError()
    }

    const item = state.input[state.index]
    if (item !== undefined) {
      return state.asOk(state.index + 1, item)
    }

    return state.asError(
      `No characters were left in the input for 'char' to match.`,
    )
  })
}

export function regex(regex: RegExp): Parser<RegExpMatchArray> {
  if (regex.global) {
    throw new Error(
      "A regex with the 'global' flag cannot be used as a matcher.",
    )
  }

  if (regex.multiline) {
    throw new Error(
      "A regex with the 'multiline' flag cannot be used as a matcher.",
    )
  }

  if (regex.sticky) {
    throw new Error(
      "A regex with the 'sticky' flag cannot be used as a matcher.",
    )
  }

  if (!regex.source.startsWith("^")) {
    throw new Error("A regex used as a matcher must have the ^ assertion.")
  }

  return new Parser((state) => {
    if (!state.ok) {
      return state.asError()
    }

    const { index } = state

    const input = state.input.slice(index)
    const match = input.match(regex)

    if (match) {
      return state.asOk(index + length, match)
    }

    return state.asError(
      `'/${regex.source}/${
        regex.flags
      }' failed to match; the input string is '${state.input.slice(
        index,
        index + 20,
      )}...'`,
    )
  })
}

export function deferred<T>(parserFn: () => Parser<T>): Parser<T> {
  let parser: Parser<T> | undefined

  return new Parser((state) => {
    if (!state.ok) {
      return state.asError()
    }

    if (!parser) {
      parser = parserFn()
    }

    return parser.p(state)
  })
}

export function optional<T>(parser: Parser<T>): Parser<T | undefined>
export function optional<T>(parser: Parser<T>, alternate: T): Parser<T>
export function optional<T>(
  parser: Parser<T>,
  alternate?: T,
): Parser<T | undefined> {
  return new Parser((state) => {
    if (!state.ok) {
      return state.asError()
    }

    const nextState = parser.p(state)

    if (nextState.ok) {
      return nextState
    }

    return nextState.asOk(state.index, alternate)
  })
}

export function lookahead<T>(parser: Parser<T>): Parser<T> {
  return new Parser((state) => {
    if (!state.ok) {
      return state.asError()
    }

    const nextState = parser.p(state)

    if (!nextState.ok) {
      return nextState.asError()
    }

    return nextState.asOk(state.index, nextState.value!)
  })
}

export function not<T>(parser: Parser<T>): Parser<undefined> {
  return new Parser((state) => {
    if (!state.ok) {
      return state.asError()
    }

    const nextState = parser.p(state)

    if (!nextState.ok) {
      return nextState.asOk(state.index, undefined)
    }

    return nextState.asError("The parser passed to 'not' successfully matched.")
  })
}

export function extractMatch(parser: Parser<unknown>): Parser<string> {
  return new Parser((state) => {
    if (!state.ok) {
      return state.asError()
    }

    const nextState = parser.p(state)

    if (!nextState.ok) {
      return nextState.asError()
    }

    return nextState.asOk(
      nextState.index,
      state.input.slice(state.index, nextState.index),
    )
  })
}

export function many1<T>(parser: Parser<T>): Parser<T[]> {
  return new Parser((state) => {
    if (!state.ok) {
      return state.asError()
    }

    const output: T[] = []
    let index: number = state.index

    while (true) {
      const nextState = parser.p(state)

      if (!nextState.ok) {
        break
      }

      output.push(nextState.value!)
      index = nextState.index
    }

    if (output.length == 0) {
      return state.asError("'repeat' failed to match any items.")
    }

    return state.asOk(index, output)
  })
}

export function many<T>(parser: Parser<T>): Parser<T[]> {
  return optional(many1(parser), [])
}

export function any<T extends readonly any[]>(
  ...parsers: { [K in keyof T]: Parser<T[K]> }
): Parser<T[number]> {
  return new Parser((state) => {
    if (!state.ok) {
      return state.asError()
    }

    for (const parser of parsers) {
      const nextState = parser.p(state)

      if (nextState.ok) {
        return nextState
      }
    }

    return state.asError("'any' failed to match any of its parsers.")
  })
}

export function sequence<T extends readonly any[]>(
  ...parsers: { [K in keyof T]: Parser<T[K]> }
): Parser<T> {
  return new Parser((state) => {
    if (!state.ok) {
      return state.asError()
    }

    const output: any[] = []
    let index: number = state.index

    for (const parser of parsers) {
      const nextState = parser.p(state)

      if (!nextState.ok) {
        return state.asError("'sequence' failed to match one of its parsers.")
      }

      output.push(nextState.value!)
      index = nextState.index
    }

    return state.asOk(index, output as any)
  })
}

export function sepBy<T>(
  parser: Parser<T>,
  separator: Parser<unknown>,
): Parser<T[]> {
  const RestItem = sequence(separator, parser).key(1)
  const RestItems = many(RestItem)
  const FirstAndRest = sequence(parser, RestItems)
  const AsArray = FirstAndRest.map(([first, rest]) => [first, ...rest])

  return optional(AsArray, [])
}

export function sepBy1<T>(
  parser: Parser<T>,
  separator: Parser<unknown>,
): Parser<T[]> {
  const RestItem = sequence(separator, parser).key(1)
  const RestItems = many(RestItem)
  const FirstAndRest = sequence(parser, RestItems)
  const AsArray = FirstAndRest.map(([first, rest]) => [first, ...rest])

  return AsArray
}

export const Whitespace = regex(/^\s+/).map<true>((match) => true)

export const OptionalWhitespace = regex(/^\s*/).map(
  (match) => match[0]!.length != 0,
)
