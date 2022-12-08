// An improved system for parsing text. #parser

export type Pattern = string | RegExp
export type Matcher<T, U> = (parser: Parser<T>) => Parser<U>

export class Parser<T = unknown> {
  static of(source: string) {
    return Parser.ok(source, 0, "")
  }

  private static ok(source: string, index: number): Parser<never>
  private static ok<T>(source: string, index: number, data: T): Parser<T>
  private static ok<T>(source: string, index: number, data?: T) {
    return new Parser<T>(source, index, true, data)
  }

  private static error(source: string, index: number) {
    return new Parser<never>(source, index, false)
  }

  private constructor(
    private readonly source: string,
    private readonly index: number,
    private readonly ok: boolean,
    readonly data: T = undefined!
  ) {}

  tap(fn: (data: T) => void): this {
    if (this.ok) {
      fn(this.data)
    }

    return this
  }

  map<U>(fn: (data: T) => U): Parser<U> {
    if (!this.ok) {
      return Parser.error(this.source, this.index)
    }

    return Parser.ok(this.source, this.index, fn(this.data))
  }

  match(matcher: Pattern): Parser<never>

  match<U>(
    matcher: Pattern,
    map: (match: string, ...groups: string[]) => U
  ): Parser<U>

  match<U>(
    matcher: Pattern,
    map?: (match: string, ...groups: string[]) => U
  ): Parser<U | undefined>

  match<U>(
    matcher: Pattern,
    map?: (match: string, ...groups: string[]) => U
  ): Parser<U> {
    if (!this.ok) {
      return Parser.error(this.source, this.index)
    }

    if (typeof matcher == "string") {
      if (
        this.source.slice(this.index, this.index + matcher.length) == matcher
      ) {
        return Parser.ok<U>(
          this.source,
          this.index + matcher.length,
          map?.(matcher)!
        )
      } else {
        return Parser.error(this.source, this.index)
      }
    } else if (matcher instanceof RegExp) {
      if (!matcher.source.startsWith("^")) {
        throw new SyntaxError(
          "If a regular expression is used as a matcher, it must have a ^ assertion."
        )
      }

      let match = this.source.slice(this.index).match(matcher)

      if (match) {
        return Parser.ok<U>(
          this.source,
          this.index + match[0].length,
          map?.(...(match as [string, ...string[]]))!
        )
      } else {
        return Parser.error(this.source, this.index)
      }
    }

    throw new TypeError(
      `A ${typeof matcher} was passed to .match(). Pass a string or regular expression.`
    )
  }

  static match(matcher: Pattern): (parser: Parser) => Parser<never>

  static match<U>(
    matcher: Pattern,
    map: (match: string, ...groups: string[]) => U
  ): (parser: Parser) => Parser<U>

  static match<U>(
    matcher: Pattern,
    map?: (match: string, ...groups: string[]) => U
  ): (parser: Parser) => Parser<U | undefined>

  static match<U>(
    matcher: Pattern,
    map?: (match: string, ...groups: string[]) => U
  ): (parser: Parser) => Parser<U | undefined> {
    return (parser) => parser.match<U>(matcher, map)
  }

  chain<U = never>(matcher: Matcher<T, U>): Parser<U> {
    if (!this.ok) {
      return Parser.error(this.source, this.index)
    }

    if (typeof matcher == "function") {
      return matcher(this)
    }

    throw new TypeError(
      `A ${typeof matcher} was passed to .chain(). Pass a function instead.`
    )
  }

  thru(matcher: Matcher<T, unknown>): Parser<T> {
    if (!this.ok) {
      return Parser.error(this.source, this.index)
    }

    return this.chain(matcher).map(() => this.data)
  }

  lookahead<U = never>(
    matcher: Matcher<T, U>,
    map?: (match: string, ...groups: string[]) => U
  ): Parser<U> {
    if (!this.ok) {
      return Parser.error(this.source, this.index)
    }

    const result = this.chain<U>(matcher)

    if (!result.ok) {
      return Parser.error(this.source, this.index)
    }

    return Parser.ok(this.source, this.index, result.data)
  }

  or<U>(fn: () => Parser<U>): Parser<T | U> {
    if (this.ok) {
      return this
    } else {
      return fn()
    }
  }

  unwrap(error: string) {
    if (this.ok) {
      return this.data
    } else {
      throw new TypeError(`Expected ${error || "a successful Parser"}.`)
    }
  }

  unwrapOr(value: T) {
    if (this.ok) {
      return this.data
    } else {
      return value
    }
  }

  discriminate<U>(matchers: Record<string, Matcher<T, U>>): Parser<U> {
    if (!this.ok) {
      return Parser.error(this.source, this.index)
    }

    for (const key in matchers) {
      if (this.source.slice(this.index, this.index + key.length) == key) {
        return this.chain<U>(matchers[key])
      }
    }

    return Parser.error(this.source, this.index)
  }

  static discriminate<U>(
    matchers: Record<string, Matcher<unknown, U>>
  ): <T>(parser: Parser<T>) => Parser<U> {
    return (parser) => parser.discriminate(matchers)
  }

  any<U extends readonly any[]>(
    ...matchers: { [K in keyof U]: Matcher<T, U[K]> }
  ): Parser<U[number]> {
    for (const matcher of matchers) {
      const result: Parser<U[number]> = this.chain<U[number]>(matcher)

      if (result.ok) {
        return result
      }
    }

    return Parser.error(this.source, this.index)
  }

  static any<U extends readonly U[]>(
    ...matchers: { [K in keyof U]: Matcher<unknown, U> }
  ): <T>(parser: Parser<T>) => Parser<U> {
    return (parser) => parser.any(...matchers)
  }

  sequence<U extends readonly any[]>(
    ...matchers: { [K in keyof U]: Matcher<unknown, U[K]> }
  ): Parser<U> {
    let result: Parser<unknown> = this
    let data: any[] = []

    for (const matcher of matchers) {
      result = result.chain<unknown>(matcher)
      data.push(result.data)
    }

    return result.map(() => data as any as U)
  }

  static sequence<U extends readonly any[]>(
    ...matchers: { [K in keyof U]: Matcher<unknown, U[K]> }
  ): <T>(parser: Parser<T>) => Parser<U> {
    return (parser) => parser.sequence<U>(...matchers)
  }

  optionalWhitespace() {
    return this.match(/^\s*/, () => this.data)
  }

  static optionalWhitespace<T>(parser: Parser<T>) {
    return parser.optionalWhitespace()
  }

  whitespace() {
    return this.match(/^\s+/, () => this.data)
  }

  static whitespace<T>(parser: Parser<T>) {
    return parser.whitespace()
  }

  many<U>(matcher: Matcher<unknown, U>): Parser<U[]> {
    let result: Parser<unknown> = this
    let data: U[] = []

    while (true) {
      if (!result.ok) {
        return Parser.ok(this.source, this.index, data)
      }

      result = result.chain<U>(matcher).tap((item) => data.push(item))
    }
  }

  static many<U>(
    matcher: Matcher<unknown, U>
  ): (parser: Parser<unknown>) => Parser<U[]> {
    return (parser) => parser.many(matcher)
  }

  many1<U>(matcher: Matcher<unknown, U>): Parser<U[]> {
    let result: Parser<unknown> = this
    let data: U[] = []

    while (true) {
      if (!result.ok) {
        if (data.length < 1) {
          return Parser.error(this.source, this.index)
        }

        return Parser.ok(this.source, this.index, data)
      }

      result = result.chain<U>(matcher).tap((item) => data.push(item))
    }
  }

  static many1<U>(
    matcher: Matcher<unknown, U>
  ): (parser: Parser<unknown>) => Parser<U[]> {
    return (parser) => parser.many1(matcher)
  }
}

const matchers = {
  expr(parser: Parser): Parser<string> {
    return parser.discriminate({
      "#": matchers.number,
      "+": matchers.add,
      "-": matchers.subtract,
      "*": matchers.multiply,
      "/": matchers.divide,
      "&": matchers.and,
      "|": matchers.or,
      "?": matchers.conditional,
      ":": matchers.list,
      ";": matchers.list,
    })
  },
  number(parser: Parser): Parser<string> {
    return parser
      .match("#")
      .optionalWhitespace()
      .match(/^\d+(\.\d+)?(\.e[+-]?\d+)?/, (match) => match)
  },
  add(parser: Parser): Parser<string> {
    return parser
      .match("+")
      .optionalWhitespace()
      .sequence(matchers.expr, Parser.optionalWhitespace, matchers.expr)
      .map(([first, _, second]) => `(${first} + ${second})`)
  },
  subtract(parser: Parser): Parser<string> {
    return parser
      .match("-")
      .optionalWhitespace()
      .sequence(matchers.expr, Parser.optionalWhitespace, matchers.expr)
      .map(([first, _, second]) => `(${first} - ${second})`)
  },
  multiply(parser: Parser): Parser<string> {
    return parser
      .match("*")
      .optionalWhitespace()
      .sequence(matchers.expr, Parser.optionalWhitespace, matchers.expr)
      .map(([first, _, second]) => `(${first} * ${second})`)
  },
  divide(parser: Parser): Parser<string> {
    return parser
      .match("/")
      .optionalWhitespace()
      .sequence(matchers.expr, Parser.optionalWhitespace, matchers.expr)
      .map(([first, _, second]) => `(${first} / ${second})`)
  },
  and(parser: Parser): Parser<string> {
    return parser
      .match("&")
      .optionalWhitespace()
      .sequence(matchers.expr, Parser.optionalWhitespace, matchers.expr)
      .map(([first, _, second]) => `(${first} && ${second})`)
  },
  or(parser: Parser): Parser<string> {
    return parser
      .match("|")
      .optionalWhitespace()
      .sequence(matchers.expr, Parser.optionalWhitespace, matchers.expr)
      .map(([first, _, second]) => `(${first} || ${second})`)
  },
  conditional(parser: Parser): Parser<string> {
    return parser
      .match("?")
      .optionalWhitespace()
      .sequence(
        matchers.expr,
        Parser.optionalWhitespace,
        matchers.expr,
        Parser.optionalWhitespace,
        matchers.expr
      )
      .map(
        ([condition, _, ifTrue, _1, ifFalse]) =>
          `(${condition} ? ${ifTrue} : ${ifFalse})`
      )
  },
  list(parser: Parser): Parser<string> {
    return parser
      .many(Parser.sequence(Parser.match(":"), matchers.expr))
      .map((items) => items.map((e) => e[1]).join(", "))
      .map((list) => `[${list}]`)
      .match(";")
  },
}

const parser = Parser.of(":#9:#8;")
const result = matchers.expr(parser)
