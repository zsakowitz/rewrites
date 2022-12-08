// A system that parses a TypeScript string literal into an arithmetic
// expression and evaluates it. Incomplete. #parser #typesystem

export type Split<T extends string, R extends string[] = []> = T extends ""
  ? R
  : T extends `${infer A}${infer B}`
  ? Split<B, [...R, A]>
  : never

declare const T: unique symbol
type T = typeof T

type StateChanger = {
  [T]: State
  next: State
}

type IsNever<T> = [T] extends [never] ? true : false

export namespace Matchers {
  export interface Number {
    [T]: State
    next: this[T]["input"] extends `${infer U extends number}${infer Rest}`
      ? {
          input: Rest
        }
      : never
    value: "first"
  }

  export interface B {
    [T]: State
    matches: this[T]["input"] extends `${boolean}${infer Rest}` ? true : false
    value: "second"
  }
}

export interface State {
  changers: StateChanger[]
  input: string
}

export type CheckEach<T extends State, M extends StateChanger[]> = M extends [
  infer Head extends StateChanger,
  ...infer Tail extends StateChanger[]
]
  ? IsNever<(Head & { [T]: T })["next"]> extends true
    ? (Head & { [T]: T })["next"]
    : CheckEach<T, Tail>
  : never

type e = Split<"Zachary">
