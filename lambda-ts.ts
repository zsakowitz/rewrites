// A parser and evaluator for lambda calculus implemented in the TS type system.
// #parser #typesystem

export interface Name<T extends string> {
  __brand(type: "name", t: T): ["name", T]
}

export interface Application<L extends Node, R extends Node> {
  __brand(type: "application", l: L, r: R): ["application", L, R]
}

export interface Lambda<T extends string, B extends Node> {
  __brand(type: "lambda", t: T, b: B): ["lambda", T, B]
}

export type Node = Name<string> | Application<Node, Node> | Lambda<string, Node>

export type CanEval<T extends Node> = T extends Lambda<string, infer B>
  ? CanEval<B>
  : T extends Application<infer L, infer R>
  ? L extends Lambda<string, Node>
    ? true
    : CanEval<L> extends true
    ? true
    : CanEval<R> extends true
    ? true
    : false
  : false

export type Locals<T extends Node, E extends string[] = []> = T extends Name<
  infer T
>
  ? [T, ...E]
  : T extends Lambda<infer T, infer B>
  ? Locals<B, [T, ...E]>
  : T extends Application<infer L, infer R>
  ? // @ts-ignore
    Locals<L, Locals<R, E>>
  : never

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B
  ? 1
  : 2
  ? true
  : false

export type Includes<T extends string[], U extends string> = T extends []
  ? false
  : T extends [infer H, ...infer T extends string[]]
  ? Equal<H, U> extends true
    ? true
    : Includes<T, U>
  : never

export type IsBound<T extends Node, U extends string> = T extends Lambda<
  infer T,
  infer B
>
  ? Equal<T, U> extends true
    ? true
    : IsBound<B, U>
  : T extends Application<infer L, infer R>
  ? IsBound<L, U> extends true
    ? IsBound<R, U> extends true
      ? true
      : false
    : false
  : false

export type IsFree<T extends Node, U extends string> = T extends Lambda<
  infer T,
  infer B
>
  ? Equal<T, U> extends true
    ? false
    : IsFree<B, U>
  : T extends Application<infer L, infer R>
  ? IsFree<L, U> extends true
    ? true
    : IsFree<R, U> extends true
    ? true
    : false
  : T extends Name<U>
  ? true
  : false

export type Rename<
  T extends Node,
  Old extends string,
  New extends string,
> = T extends Name<infer U>
  ? Equal<U, Old> extends true
    ? Name<New>
    : Name<U>
  : T extends Application<infer L, infer R>
  ? Application<Rename<L, Old, New>, Rename<R, Old, New>>
  : never

export type UniqueName<Avoid extends string[]> = Includes<
  Avoid,
  "a"
> extends false
  ? "a"
  : Includes<Avoid, "b"> extends false
  ? "b"
  : Includes<Avoid, "c"> extends false
  ? "c"
  : Includes<Avoid, "d"> extends false
  ? "d"
  : Includes<Avoid, "e"> extends false
  ? "e"
  : Includes<Avoid, "f"> extends false
  ? "f"
  : Includes<Avoid, "g"> extends false
  ? "g"
  : Includes<Avoid, "h"> extends false
  ? "h"
  : Includes<Avoid, "i"> extends false
  ? "i"
  : Includes<Avoid, "j"> extends false
  ? "j"
  : Includes<Avoid, "k"> extends false
  ? "k"
  : Includes<Avoid, "l"> extends false
  ? "l"
  : Includes<Avoid, "m"> extends false
  ? "m"
  : Includes<Avoid, "n"> extends false
  ? "n"
  : Includes<Avoid, "o"> extends false
  ? "o"
  : Includes<Avoid, "p"> extends false
  ? "p"
  : Includes<Avoid, "q"> extends false
  ? "q"
  : Includes<Avoid, "r"> extends false
  ? "r"
  : Includes<Avoid, "s"> extends false
  ? "s"
  : Includes<Avoid, "t"> extends false
  ? "t"
  : Includes<Avoid, "u"> extends false
  ? "u"
  : Includes<Avoid, "v"> extends false
  ? "v"
  : Includes<Avoid, "w"> extends false
  ? "w"
  : Includes<Avoid, "x"> extends false
  ? "x"
  : Includes<Avoid, "y"> extends false
  ? "y"
  : Includes<Avoid, "z"> extends false
  ? "z"
  : UniqueNameX<[0], Avoid>

export type UniqueNameX<X extends any[], Avoid extends string[]> = Includes<
  Avoid,
  `x${X["length"]}`
> extends false
  ? `x${X["length"]}`
  : UniqueNameX<[...X, 0], Avoid>

export type Replace<
  T extends Node,
  Old extends string,
  New extends Node,
> = T extends Name<infer U>
  ? Equal<U, Old> extends true
    ? New
    : Name<U>
  : T extends Application<infer L, infer R>
  ? // @ts-ignore
    Application<Replace<L, Old, New>, Replace<R, Old, New>>
  : T extends Lambda<infer U, infer B>
  ? Equal<U, Old> extends true
    ? Lambda<U, B>
    : IsFree<New, U> extends true
    ? // @ts-ignore
      Lambda<
        // @ts-ignore
        UniqueName<Locals<T, Locals<New>>>,
        Replace<B, Old, Rename<New, U, UniqueName<Locals<T, Locals<New>>>>>
      >
    : Lambda<U, Replace<B, Old, New>>
  : never

export type Eval<T extends Node> = T extends Lambda<infer T, infer B>
  ? // @ts-ignore
    Lambda<T, Eval<B>>
  : T extends Application<infer L, infer R>
  ? L extends Lambda<infer T, infer B>
    ? Replace<B, T, R>
    : CanEval<L> extends true
    ? Application<Eval<L>, R>
    : CanEval<R> extends true
    ? Application<L, Eval<R>>
    : T
  : T

export type PartialString = {
  content: string
  endsWithLambda: boolean
  hasTopLevelApplication: boolean
}

export type ToPartialString<T extends Node> = T extends Name<infer U>
  ? { content: U; endsWithLambda: false; hasTopLevelApplication: false }
  : T extends Lambda<infer T, infer B>
  ? // prettier-ignore
    ToPartialString<B> extends (infer U extends PartialString)
    ? {
        content: `λ${T} ${U["content"]}`
        endsWithLambda: true
        hasTopLevelApplication: false
      }
    : never
  : T extends Application<infer L, infer R>
  ? // prettier-ignore
    ToPartialString<L> extends (infer L extends PartialString)
      // prettier-ignore
    ? ToPartialString<R> extends (infer R extends PartialString)
      ? {
          content: `${L["endsWithLambda"] extends true
            ? `(${L["content"]})`
            : L["content"]} ${R["hasTopLevelApplication"] extends true
            ? `(${R["content"]})`
            : R["content"]}`
          endsWithLambda: R["endsWithLambda"]
          hasTopLevelApplication: true
        }
      : never
    : never
  : never

export type ToPartialCompactString<T extends Node> = T extends Name<infer U>
  ? { content: U; endsWithLambda: false; hasTopLevelApplication: false }
  : T extends Lambda<infer T, infer B>
  ? // prettier-ignore
    ToPartialCompactString<B> extends (infer U extends PartialString)
    ? U["content"] extends `λ${infer R}`
      ? {
          content: `λ${T}${R}`
          endsWithLambda: true
          hasTopLevelApplication: false
        }
      : {
          content: `λ${T}.${U["content"]}`
          endsWithLambda: true
          hasTopLevelApplication: false
        }
    : never
  : T extends Application<infer L, infer R>
  ? // prettier-ignore
    ToPartialCompactString<L> extends (infer L extends PartialString)
    ? // prettier-ignore
      ToPartialCompactString<R> extends (infer R extends PartialString)
      ? {
          content: `${L["endsWithLambda"] extends true
            ? `(${L["content"]})`
            : L["content"]}${R["hasTopLevelApplication"] extends true
            ? `(${R["content"]})`
            : R["content"]}`
          endsWithLambda: R["endsWithLambda"]
          hasTopLevelApplication: true
        }
      : never
    : never
  : never

export type ToCompactString<T extends Node> =
  ToPartialCompactString<T> extends { content: infer C } ? C : never

export type ToString<T extends Node> = ToCompactString<T> extends {
  content: infer C
}
  ? C
  : never

export type PrePreLex<T extends string> =
  T extends `${infer Name} = ${infer Body};${infer Rest}`
    ? PrePreLex<`(\\${Name} ${Rest})(${Body})`>
    : T

export type Token =
  | { type: "backslash"; name: string }
  | { type: "name"; name: string }
  | { type: "leftParen" }
  | { type: "rightParen" }

export type SpecialCharacter = " " | "\t" | "." | "=" | "\\" | "λ" | "(" | ")"

export type Lex<T extends string, R extends Token[] = []> = T extends ""
  ? R
  : T extends ` ${infer Rest}` | `\t${infer Rest}`
  ? Lex<Rest, R>
  : T extends `(${infer Rest}`
  ? Lex<Rest, [...R, { type: "leftParen" }]>
  : T extends `)${infer Rest}`
  ? Lex<Rest, [...R, { type: "rightParen" }]>
  : T extends `${"\\" | "λ"}${infer Name}`
  ? Name extends `${infer Name}${infer S extends SpecialCharacter}${infer Rest}`
    ? Lex<`${S}${Rest}`, [...R, { type: "backslash"; name: Name }]>
    : [...R, { type: "backslash"; name: Name }]
  : T extends `${infer Name}${infer S extends SpecialCharacter}${infer Rest}`
  ? Lex<`${S}${Rest}`, [...R, { type: "name"; name: Name }]>
  : [...R, { type: "name"; name: T }]

// TODO: partialTree, tree, node, parse
