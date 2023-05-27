// An (extremely) type safe system for parsing text. Works with `--noEmit`.
// #typesystem

// #region Error, Ok, ErrorState, OkState, State, IsStateGeneric,
// ok(), error(), initial()
export type Error<
  Index extends number,
  Source extends string,
  Value extends string,
> = {
  readonly index: Index
  readonly ok: false
  readonly source: Source
  readonly value: Value
}

export type Ok<Index extends number, Source extends string, Value> = {
  readonly index: Index
  readonly ok: true
  readonly source: Source
  readonly value: Value
}

export type ErrorState = Error<number, string, string>
export type OkState = Ok<number, string, unknown>
export type State = ErrorState | OkState

export type IsStateGeneric<T extends State> = string extends T["source"]
  ? true
  : number extends T["index"]
  ? true
  : false

export function ok<Previous extends State, Index extends number, Value>(
  previous: Previous,
  index: Index,
  value: Value,
): ok<Previous, Index, Value> {
  return {
    index,
    ok: true,
    source: previous.source as Previous["source"],
    value,
  } as const satisfies State
}

export type ok<Previous extends State, Index extends number, Value> = {
  readonly index: Index
  readonly ok: true
  readonly source: Previous["source"]
  readonly value: Value
}

export function error<Previous extends State, Value extends string>(
  previous: Previous,
  value: Value,
): error<Previous, Value> {
  return {
    index: previous.index as Previous["index"],
    ok: false,
    source: previous.source as Previous["source"],
    value,
  } as const satisfies State
}

export type error<Previous extends State, Value extends string> = {
  readonly index: Previous["index"]
  readonly ok: false
  readonly source: Previous["source"]
  readonly value: Value
}

export function initial<Source extends string>(
  source: Source,
): initial<Source> {
  return {
    index: 0,
    ok: true,
    source,
    value: undefined,
  } as const satisfies State
}

export type initial<Source extends string> = {
  readonly index: 0
  readonly ok: true
  readonly source: Source
  readonly value: undefined
}
// #endregion

// #region Expand, Parser, Parse, ValueOf

// For some odd reason, Expand<T> isn't always assignable to T, so we need to
// use Extract to make sure it always works. I just hope Extract won't violate
// the whole reason we use Expand.

type Expand<T> = Extract<
  T extends infer O ? { [K in keyof O]: O[K] } : never,
  T
>

export abstract class Parser {
  declare readonly input: OkState
  protected abstract t(state: this["input"]): State

  p<state extends State>(state: state): Parse<this, state>
  p<state extends State>(state: state): State {
    if (state.ok) {
      return this.t(state as OkState)
    } else {
      return state
    }
  }

  parse<source extends string>(source: source) {
    return this.p(initial(source))
  }
}

export type Parse<
  parser extends Parser,
  state extends State,
> = state extends OkState
  ? Expand<
      ReturnType<
        // @ts-ignore
        (parser & { readonly input: state })["t"]
      >
    >
  : state extends ErrorState
  ? state
  : never

export type ValueOf<parser extends Parser> = (Parse<parser, OkState> & {
  ok: true
})["value"]
// #endregion

// text
{
  class TextParser<text extends string> extends Parser {
    constructor(readonly text: text) {
      super()
    }

    t(
      state: this["input"],
    ): String.startsWith<
      (typeof state)["source"],
      text,
      (typeof state)["index"]
    > extends infer S
      ? S extends true
        ? ok<
            typeof state,
            Number.add<(typeof state)["index"], String.length<text>>,
            text
          >
        : error<typeof state, `Expected '${text}'.`>
      : never {
      if (state.source.startsWith(this.text, state.index)) {
        return ok(state, state.index + this.text.length, this.text) as any
      } else {
        return error(state, `Expected '${this.text}'.`) as any
      }
    }
  }

  var text = <Text extends string>(text: Text) => new TextParser(text)
}

// many
{
  type ParseMany<
    Matcher extends Parser,
    State extends OkState,
    Output extends any[],
  > = IsStateGeneric<State> extends true
    ? ok<State, number, ValueOf<Matcher>[]>
    : Parse<Matcher, State> extends infer S
    ? S extends OkState
      ? ParseMany<Matcher, S, [...Output, S["value"]]>
      : ok<State, State["index"], Output>
    : never

  class ManyParser<matcher extends Parser> extends Parser {
    constructor(readonly matcher: matcher) {
      super()
    }

    protected t(state: this["input"]): ParseMany<matcher, typeof state, []>
    protected t(state: this["input"]): State {
      const output: any[] = []
      let _state: OkState = state

      while (true) {
        const temp = this.matcher.p(_state)

        if (!temp.ok) {
          return ok(_state, _state.index, output)
        }

        output.push(temp.value)
        _state = temp
      }
    }
  }

  var many = <Matcher extends Parser>(matcher: Matcher) =>
    new ManyParser(matcher)
}

// optional
{
  class OptionalParser<Matcher extends Parser> extends Parser {
    constructor(readonly matcher: Matcher) {
      super()
    }

    protected t(
      state: this["input"],
    ): Parse<Matcher, typeof state> extends infer S
      ? S extends OkState
        ? S
        : ok<typeof state, (typeof state)["index"], undefined>
      : never
    protected t(state: this["input"]): State {
      const next = this.matcher.p(state)

      if (next.ok) {
        return next
      }

      return ok(state, state.index, undefined)
    }
  }

  var optional = <Matcher extends Parser>(matcher: Matcher) =>
    new OptionalParser(matcher)
}

// seq
{
  type ParseSequence<
    Matchers extends readonly Parser[],
    originalState extends OkState,
    state extends OkState,
    output extends any[],
  > = Matchers extends [
    infer Matcher extends Parser,
    ...infer Rest extends readonly Parser[],
  ]
    ? Parse<Matcher, state> extends infer S
      ? S extends State
        ? S extends OkState
          ? ParseSequence<Rest, originalState, S, [...output, S["value"]]>
          : S extends ErrorState
          ? error<originalState, S["value"]>
          : never
        : never
      : never
    : ok<state, state["index"], output>

  class SequenceParser<Matchers extends readonly Parser[]> extends Parser {
    readonly matchers: Matchers

    constructor(...matchers: Matchers) {
      super()
      this.matchers = matchers
    }

    protected t(
      originalState: this["input"],
    ): ParseSequence<Matchers, typeof originalState, typeof originalState, []>
    protected t(originalState: this["input"]): State {
      const output: any[] = []
      let state: OkState = originalState

      for (const matcher of this.matchers) {
        const next = matcher.p(state)

        if (next.ok) {
          output.push(next.value)
          state = next
        } else {
          return error(originalState, next.value)
        }
      }

      return ok(state, state.index, output)
    }
  }

  var seq = <Matchers extends readonly Parser[]>(...matchers: Matchers) =>
    new SequenceParser(...matchers)
}

// lookahead
{
  class LookaheadParser<Matcher extends Parser> extends Parser {
    constructor(readonly matcher: Matcher) {
      super()
    }

    protected t(
      state: this["input"],
    ): Parse<Matcher, typeof state> extends infer next
      ? next extends State
        ? next extends OkState
          ? ok<typeof state, (typeof state)["index"], next["value"]>
          : next extends ErrorState
          ? error<typeof state, next["value"]>
          : never
        : never
      : never
    protected t(state: this["input"]): State {
      const next = this.matcher.p(state)

      if (next.ok) {
        return ok(state, state.index, next.value)
      } else {
        return error(state, next.value)
      }
    }
  }

  var lookahead = <Matcher extends Parser>(matcher: Matcher) =>
    new LookaheadParser(matcher)
}

// choice
{
  type ParseChoice<
    Matchers extends readonly Parser[],
    state extends OkState,
  > = Matchers extends [
    infer Matcher extends Parser,
    ...infer Rest extends readonly Parser[],
  ]
    ? Parse<Matcher, state> extends infer S
      ? S extends OkState
        ? S
        : ParseChoice<Rest, state>
      : never
    : error<state, "None of the matchers passed to 'choice' succeeded.">

  class ChoiceParser<Matchers extends readonly Parser[]> extends Parser {
    readonly matchers: Matchers

    constructor(...matchers: Matchers) {
      super()
      this.matchers = matchers
    }

    protected t(state: this["input"]): ParseChoice<Matchers, typeof state>
    protected t(state: this["input"]): State {
      for (const matcher of this.matchers) {
        const next = matcher.p(state)

        if (next.ok) {
          return next
        }
      }

      return error(state, "None of the matchers passed to 'choice' succeeded.")
    }
  }

  var choice = <Matchers extends readonly Parser[]>(...matchers: Matchers) =>
    new ChoiceParser(...matchers)
}

// anyChar
{
  class AnyCharacterParser extends Parser {
    protected t(
      state: this["input"],
    ): String.charAt<
      (typeof state)["source"],
      (typeof state)["index"]
    > extends infer S
      ? S extends string
        ? S extends ""
          ? error<typeof state, "Found EOF; expected character.">
          : ok<typeof state, Number.plusOne<(typeof state)["index"]>, S>
        : never
      : never
    protected t(state: this["input"]): State {
      const char = state.source[state.index]

      if (char) {
        return ok(state, state.index + 1, char)
      }

      return error(state, "Found EOF; expected character.")
    }
  }

  var anyChar = new AnyCharacterParser()
}

// char
{
  class CharacterParser<characters extends string> extends Parser {
    constructor(readonly characters: characters) {
      super()
    }

    protected t(
      state: this["input"],
    ): String.charAt<
      (typeof state)["source"],
      (typeof state)["index"]
    > extends infer S
      ? S extends string
        ? S extends ""
          ? error<typeof state, "Found EOF; expected character.">
          : characters extends `${string}${S}${string}`
          ? ok<typeof state, Number.plusOne<(typeof state)["index"]>, S>
          : error<typeof state, `Found ${S}; expected one of '${characters}'.`>
        : never
      : never
    protected t(state: this["input"]): State {
      const char = state.source.charAt(state.index)

      if (char == "") {
        return error(state, "Found EOF; expected character.")
      }

      if (this.characters.includes(char)) {
        return ok(state, state.index + 1, char)
      }

      return error(
        state,
        `Found ${char}; expected one of '${this.characters}'.`,
      )
    }
  }

  var char = <Characters extends string>(characters: Characters) =>
    new CharacterParser(characters)
}

// map
{
  abstract class Mapped extends Parser {
    protected abstract matcher: Parser

    declare value: ValueOf<
      // @ts-ignore
      this["matcher"]
    >

    // @ts-ignore
    protected abstract map(
      value: // @ts-ignore
      this["value"],
    )

    protected t(state: this["input"]): Parse<
      // @ts-ignore
      this["matcher"],
      typeof state
    > extends infer next
      ? next extends OkState
        ? ok<
            next,
            next["index"],
            ReturnType<
              // @ts-ignore
              (this & { readonly value: next["value"] })["map"]
            >
          >
        : next extends ErrorState
        ? next
        : never
      : never
    protected t(state: this["input"]): State {
      const next = this.matcher.p(state)

      if (next.ok) {
        return ok(next, next.index, this.map(next.value as any))
      } else {
        return next
      }
    }
  }

  _Mapped = Mapped
}

var _Mapped // assigned in block above
const Mapped = _Mapped

// many1
{
  class Many1Parser<Matcher extends Parser> extends Parser {
    seq: ReturnType<typeof seq<[Matcher, ReturnType<typeof many<Matcher>>]>>

    constructor(matcher: Matcher) {
      super()
      this.seq = seq(matcher, many(matcher))
    }

    protected t(
      state: this["input"],
    ): Parse<this["seq"], typeof state> extends infer result
      ? result extends ErrorState
        ? result
        : result extends OkState
        ? result["value"] extends [infer First, infer Many extends any[]]
          ? ok<result, result["index"], [First, ...Many]>
          : never
        : never
      : never
    protected t(state: this["input"]): State {
      const result = this.seq.p(state) as State

      if (!result.ok) {
        return result
      }

      return ok(result, result.index, [
        (result.value as any)[0],
        ...(result.value as any)[1],
      ])
    }
  }

  var many1 = <Matcher extends Parser>(matcher: Matcher) =>
    new Many1Parser(matcher)
}
