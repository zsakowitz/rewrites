// A type safe system for parsing text. And when we say type safe, we mean it.
// #typesystem

export type Error<
  Index extends number,
  Source extends string,
  Value extends string
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

export function ok<Previous extends State, Index extends number, Value>(
  previous: Previous,
  index: Index,
  value: Value
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
  value: Value
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
  source: Source
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

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never

export abstract class Parser {
  declare readonly input: OkState
  protected abstract t(state: this["input"]): State

  p<T extends State>(state: T): Parse<this, T> {
    if (state.ok) {
      return this.t(state as OkState) as any
    } else {
      return state as any
    }
  }
}

export type Parse<
  _Parser extends Parser,
  _State extends State
> = _State extends { readonly ok: true }
  ? Expand<
      ReturnType<
        // @ts-ignore
        (_Parser & { readonly input: State })["t"]
      >
    >
  : _State

{
  class TextParser<Text extends string> extends Parser {
    constructor(readonly text: Text) {
      super()
    }

    t(
      state: this["input"]
    ): String.startsWith<
      typeof state["source"],
      Text,
      typeof state["index"]
    > extends true
      ? ok<
          Expand<typeof state>,
          Number.Add<typeof state["index"], String.length<Text>>,
          Text
        >
      : error<Expand<typeof state>, `Expected '${Text}'.`> {
      if (state.source.startsWith(this.text, state.index)) {
        return ok(state, state.index + this.text.length, this.text) as any
      } else {
        return error(state, `Expected '${this.text}'.`) as any
      }
    }
  }

  var text = <Text extends string>(text: Text) => new TextParser(text)
}

{
  // class ManyParser<
}

const hello = text("hello")

type f = initial<"a hello">

const d = hello.p(initial("a hello"))
