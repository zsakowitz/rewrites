export function parse<T extends string>(
  text: T
): parse.ToNode<parse.ToTree<parse.Lex<parse.PreLex<T>>>> {
  return parse.toNode(parse.toTree(parse.lex(parse.preLex(text))))
}

export namespace parse {
  type ReplaceLambdaWithBackslash<
    T extends string,
    H extends string = ""
  > = T extends `${infer A}λ${infer B}`
    ? ReplaceLambdaWithBackslash<B, `${H}${A}\\`>
    : `${H}${T}`

  type RemoveComments<T extends string, H extends string = ""> = T extends
    | `${infer A}#${string}\n${infer B}`
    | `${infer A}#${string}\r${infer B}`
    ? RemoveComments<B, `${H}${A}`>
    : T extends `${infer A}#${string}`
    ? A
    : `${H}${T}`

  type FindAndRemoveAliases<
    T extends string,
    A extends [name: string, body: string][] = []
  > = T extends `${infer Name}=${infer Body};${infer Rest}`
    ? FindAndRemoveAliases<Rest, [...A, [Name, Body]]>
    : [T, A]

  type PutBackAliases<
    T extends string,
    A extends [name: string, body: string][]
  > = A extends [
    [infer Name extends string, infer Body extends string],
    ...infer Rest extends [name: string, body: string][]
  ]
    ? PutBackAliases<`(\\${Name} ${T})(${Body})`, Rest>
    : T

  export type PreLex<T extends string> = FindAndRemoveAliases<
    RemoveComments<ReplaceLambdaWithBackslash<T>>
  > extends [
    infer T extends string,
    infer A extends [name: string, body: string][]
  ]
    ? PutBackAliases<T, A>
    : never

  /**
   * - Changes `λ` to `\`
   * - Removes `#`-style comments
   * - Replaces aliases (`name = body;`) with lambda expressions
   */
  export function preLex<T extends string>(text: T): PreLex<T>
  export function preLex(text: string): string {
    const aliases: (readonly [name: string, body: string])[] = []

    text = text
      .replace(/λ/g, "\\")
      .replace(/#[^\n\r]*$/gm, "")
      .replace(/([^\s=.\\λ();]+)\s*=\s*([^=;]+);/g, (_, name, body) => {
        aliases.push([name, body])
        return ""
      })

    for (const [name, body] of aliases) {
      text = `(\\${name} ${text})(${body})`
    }

    return text
  }

  export type Token =
    | { readonly type: "name"; readonly name: string }
    | { readonly type: "backslash"; readonly name: string }
    | { readonly type: "lParen" }
    | { readonly type: "rParen" }

  const whitespace = /^\s/

  type MergeNameIntoBackslash<
    N extends string,
    R extends readonly Token[]
  > = N extends ""
    ? R
    : R extends readonly [
        ...infer Body extends readonly Token[],
        { readonly type: "backslash"; readonly name: "" }
      ]
    ? readonly [...Body, { readonly type: "backslash"; readonly name: N }]
    : readonly [...R, { readonly type: "name"; readonly name: N }]

  type Split<
    T extends string,
    R extends readonly {
      readonly type: "backslash"
      readonly name: string
    }[] = readonly []
  > = T extends `${infer Head}${infer Tail}`
    ? Split<
        Tail,
        readonly [...R, { readonly type: "backslash"; readonly name: Head }]
      >
    : R

  export type Lex<
    T extends string,
    N extends string = "",
    R extends readonly Token[] = readonly []
  > = T extends ` ${infer Rest}` | `\n${infer Rest}` | `\r${infer Rest}`
    ? Lex<Rest, "", MergeNameIntoBackslash<N, R>>
    : T extends `\\${infer Rest}`
    ? Lex<
        Rest,
        "",
        readonly [
          ...MergeNameIntoBackslash<N, R>,
          { readonly type: "backslash"; readonly name: "" }
        ]
      >
    : T extends `(${infer Rest}`
    ? Lex<
        Rest,
        "",
        readonly [...MergeNameIntoBackslash<N, R>, { readonly type: "lParen" }]
      >
    : T extends `)${infer Rest}`
    ? Lex<
        Rest,
        "",
        readonly [...MergeNameIntoBackslash<N, R>, { readonly type: "rParen" }]
      >
    : T extends `.${infer Rest}`
    ? MergeNameIntoBackslash<N, R> extends readonly [
        ...infer Head extends readonly Token[],
        {
          readonly type: "backslash"
          readonly name: infer Name extends string
        }
      ]
      ? Lex<Rest, "", readonly [...Head, ...Split<Name>]>
      : never
    : T extends `${infer Char}${infer Rest}`
    ? Lex<Rest, `${N}${Char}`, R>
    : MergeNameIntoBackslash<N, R>

  export namespace Lex {
    export type Debug<
      T extends readonly Token[],
      S extends string = ""
    > = T extends readonly [
      infer Head extends Token,
      ...infer Rest extends readonly Token[]
    ]
      ? Debug<
          Rest,
          `${S} ${Head extends { readonly type: "lParen" }
            ? "("
            : Head extends { readonly type: "rParen" }
            ? ")"
            : Head extends {
                readonly type: "name"
                readonly name: infer Name extends string
              }
            ? Name
            : Head extends {
                readonly type: "backslash"
                readonly name: infer Name extends string
              }
            ? `\\${Name}`
            : ""}`
        >
      : S
  }

  export function lex<T extends string>(text: T): Lex<T>
  export function lex(text: string): readonly Token[] {
    const output: Token[] = []
    const { length } = text
    let index = 0
    let name = ""

    while (index < length) {
      const char = text[index]

      if (!char) {
        break
      }

      if (
        char.match(whitespace) ||
        char == "\\" ||
        char == "(" ||
        char == ")" ||
        char == "."
      ) {
        const previous = output[output.length - 1]

        if (name) {
          if (previous?.type == "backslash" && previous.name == "") {
            ;(previous as any).name = name
          } else {
            output.push({ type: "name", name })
          }

          name = ""
        }

        if (
          (char == "\\" || char == "(" || char == ")") &&
          previous?.type == "backslash" &&
          (previous.name == "" || char == ")")
        ) {
          throw new Error("Found unexpected " + char + " after backslash.")
        }

        if (char == "\\") {
          output.push({ type: "backslash", name: "" })
        }

        if (char == "(" || char == ")") {
          output.push({ type: char == "(" ? "lParen" : "rParen" })
        }

        if (char == ".") {
          const last = output.pop()

          if (last?.type != "backslash") {
            throw new Error(
              "A '.' token can only be parsed directly after a backslash."
            )
          }

          for (const character of last.name) {
            output.push({ type: "backslash", name: character })
          }
        }
      } else {
        name += char
      }

      index++
    }

    if (name) {
      const previous = output[output.length - 1]

      if (previous?.type == "backslash" && previous.name == "") {
        ;(previous as any).name = name
      } else {
        output.push({ type: "name", name })
      }

      name = ""
    }

    return output
  }

  export type Tree =
    | { readonly type: "name"; readonly name: string }
    | {
        readonly type: "lambda"
        readonly name: string
        readonly body: readonly Tree[]
      }
    | readonly Tree[]

  export namespace Tree {
    type ToArray<
      T extends readonly Tree[],
      S extends string = ""
    > = T extends readonly [
      infer Head extends Tree,
      ...infer Tail extends readonly Tree[]
    ]
      ? S extends ""
        ? ToArray<Tail, Debug<Head>>
        : ToArray<Tail, `${S}, ${Debug<Head>}`>
      : `[${S}]`

    export type Debug<T extends Tree> = T extends {
      readonly type: "name"
      readonly name: infer Name extends string
    }
      ? `{ "type": "name", "name": "${Name}" }`
      : T extends {
          readonly type: "lambda"
          readonly name: infer Name extends string
          readonly body: infer Body extends readonly Tree[]
        }
      ? `{ "type": "lambda", "name": "${Name}", "body": ${ToArray<Body>} }`
      : T extends readonly Tree[]
      ? ToArray<T>
      : never
  }

  type FlatTree =
    | Tree
    | { readonly type: "backslash"; readonly name: string }
    | "paren"

  type Fold<
    T extends readonly FlatTree[],
    I extends readonly Tree[] = readonly []
  > = T extends readonly [
    ...infer Head extends readonly FlatTree[],
    infer Tail extends FlatTree
  ]
    ? Tail extends "paren"
      ? readonly [...Head, I]
      : Tail extends {
          readonly type: "backslash"
          readonly name: infer Name extends string
        }
      ? Fold<
          [
            ...Head,
            { readonly type: "lambda"; readonly name: Name; readonly body: I }
          ]
        >
      : Tail extends Tree
      ? Fold<Head, readonly [Tail, ...I]>
      : never
    : I

  function fold<T extends readonly FlatTree[]>(tree: T): Fold<T>
  function fold(
    tree: readonly FlatTree[]
  ): readonly [...(readonly FlatTree[]), Tree] | readonly Tree[] {
    const inserted: Tree[] = []

    for (let index = tree.length - 1; index >= 0; index--) {
      const head = tree.slice(0, index)
      const tail = tree[index]

      if (!tail) {
        return inserted
      }

      if (tail === "paren") {
        return head.concat(inserted) as [...typeof head, typeof inserted]
      }

      if ("type" in tail && tail.type === "backslash") {
        return fold(
          head.concat({ type: "lambda", name: tail.name, body: inserted })
        )
      }

      inserted.unshift(tail)
    }

    return inserted
  }

  type ToFlatTree<
    T extends readonly Token[],
    O extends readonly FlatTree[] = readonly []
  > = T extends readonly [
    infer Head extends Token,
    ...infer Tail extends readonly Token[]
  ]
    ? Head extends { readonly type: "lParen" }
      ? ToFlatTree<Tail, readonly [...O, "paren"]>
      : Head extends { readonly type: "rParen" }
      ? ToFlatTree<Tail, Fold<O>>
      : Head extends { readonly type: "backslash"; readonly name: string }
      ? ToFlatTree<Tail, readonly [...O, Head]>
      : Head extends { readonly type: "name"; readonly name: string }
      ? ToFlatTree<Tail, readonly [...O, Head]>
      : never
    : O

  function toFlatTree<T extends readonly Token[]>(tokens: T): ToFlatTree<T>
  function toFlatTree(tokens: readonly Token[]): readonly FlatTree[] {
    let output: FlatTree[] = []

    for (const token of tokens) {
      if (token.type == "lParen") {
        output.push("paren")
      } else if (token.type == "rParen") {
        output = fold(output) as unknown as FlatTree[]
      } else {
        output.push(token)
      }
    }

    return output
  }

  // prettier-ignore
  // esbuild can't handle "extends infer U extends Tree"
  export type ToTree<T extends readonly Token[]> = Fold<
    ToFlatTree<T>
  > extends (infer U extends Tree)
    ? U
    : never

  export function toTree<T extends readonly Token[]>(tokens: T): ToTree<T>
  export function toTree(tokens: readonly Token[]): readonly Tree[] {
    return fold(toFlatTree(tokens) as readonly FlatTree[]) as readonly Tree[]
  }

  export namespace toTree {
    function indent(text: string) {
      return text.replace(/\n/g, "\n  ")
    }

    export function debug(tree: Tree): string {
      if (Array.isArray(tree)) {
        return "(\n  " + indent(tree.map(debug).join("\n")) + "\n)"
      }

      if (tree.type == "name") {
        return "name " + tree.name
      }

      if (tree.type == "lambda") {
        return "lambda " + tree.name + "\n  " + indent(debug(tree.body))
      }

      throw new Error("Encountered unexpected tree type: " + tree)
    }
  }

  type ArrayToNodeWithInitial<
    A extends readonly Tree[],
    S extends Node.Node
  > = A extends readonly [
    infer Head extends Tree,
    ...infer Tail extends readonly Tree[]
  ]
    ? // @ts-ignore
      ArrayToNodeWithInitial<Tail, Node.Application<S, ToNode<Head>>>
    : S

  type ArrayToNode<A extends readonly Tree[]> = A extends readonly [
    infer Head extends Tree,
    ...infer Tail extends readonly Tree[]
  ]
    ? ArrayToNodeWithInitial<Tail, ToNode<Head>>
    : never

  export type ToNode<T extends Tree> = T extends {
    readonly type: "name"
    readonly name: infer Name extends string
  }
    ? Node.Name<Name>
    : T extends {
        readonly type: "lambda"
        readonly name: infer Name extends string
        readonly body: infer Body extends readonly Tree[]
      }
    ? Node.Lambda<Name, ArrayToNode<Body>>
    : T extends readonly Tree[]
    ? ArrayToNode<T>
    : never

  export function toNode<T extends Tree>(tree: T): ToNode<T>
  export function toNode(tree: Tree): Node.Node {
    if (Array.isArray(tree)) {
      if (!tree[0]) {
        throw new Error("Found ) directly after (.")
      }

      // @ts-ignore
      let output: Node.Node = toNode(tree[0])

      for (let index = 1; index < tree.length; index++) {
        output = new Node.Application(output, toNode(tree[index]!))
      }

      return output
    }

    if (tree.type == "lambda") {
      return new Node.Lambda(tree.name, toNode(tree.body))
    }

    if (tree.type == "name") {
      return new Node.Name(tree.name)
    }

    throw new Error("Received unknown node type: ", { cause: tree })
  }
}

export namespace Node {
  export interface PartialString {
    readonly content: string
    readonly endsWithLambda: boolean
    readonly hasTopLevelApplication: boolean
    readonly startsWithDottedLambda: boolean
  }

  type Equal<A, B> = A extends B ? (B extends A ? true : false) : false

  export type Rename<
    T extends Node,
    Old extends string,
    New extends string
  > = T extends Name<infer U>
    ? Equal<U, Old> extends true
      ? Name<New>
      : Name<U>
    : T extends Application<infer L, infer R>
    ? // @ts-ignore
      Application<Rename<L, Old, New>, Rename<R, Old, New>>
    : T extends Lambda<infer N extends string, infer B extends Node>
    ? Equal<N, Old> extends true
      ? Lambda<N, B>
      : Lambda<N, Rename<B, Old, New>>
    : never

  export type Includes<
    T extends readonly string[],
    U extends string
  > = T extends readonly [U, ...any]
    ? true
    : T extends readonly [any, ...infer Rest extends readonly string[]]
    ? Includes<Rest, U>
    : false

  export type UniqueName<Avoid extends readonly string[]> = Includes<
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
    : // @ts-ignore
      UniqueNameX<[0], Avoid>

  // @ts-ignore
  export type UniqueNameX<
    X extends readonly any[],
    Avoid extends readonly string[]
  > = Includes<Avoid, `x${X["length"]}`> extends false
    ? `x${X["length"]}`
    : // @ts-ignore
      UniqueNameX<[...X, 0], Avoid>

  export type Replace<
    T extends Node,
    Old extends string,
    New extends Node
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
          UniqueName<readonly [T["name"], ...T["locals"], ...New["locals"]]>,
          Replace<
            B,
            Old,
            Rename<
              New,
              U,
              UniqueName<readonly [T["name"], ...T["locals"], ...New["locals"]]>
            >
          >
        >
      : Lambda<U, Replace<B, Old, New>>
    : never

  export type IsFree<T extends Node, N extends string> = T extends Name<infer U>
    ? Equal<N, U>
    : T extends Application<infer L extends Node, infer R extends Node>
    ? IsFree<L, N> extends true
      ? true
      : IsFree<R, N> extends true
      ? true
      : false
    : T extends Lambda<infer U extends string, infer B extends Node>
    ? Equal<N, U> extends true
      ? false
      : IsFree<B, N>
    : never

  export abstract class Node {
    abstract readonly canEval: boolean
    abstract readonly locals: readonly string[]

    abstract rename(oldName: string, newName: Name<string>): Node
    abstract replace(oldName: string, newNode: Node): Node
    abstract toCompactString(): PartialString
    abstract toPartialString(): PartialString & {
      readonly startsWithDottedLambda: false
    }

    toString(compact: true): ReturnType<this["toCompactString"]>["content"]
    toString(compact: false): ReturnType<this["toPartialString"]>["content"]
    toString(compact: boolean): string {
      return compact
        ? this.toCompactString().content
        : this.toPartialString().content
    }
  }

  // @ts-ignore Technically, `out T` is the wrong variance, but I don't really care.
  export class Name<out T extends string> extends Node {
    static unique(avoid: readonly string[]): Name<string> {
      for (const char of "abcdefghijklmnopqrstuvwxyz") {
        if (!avoid.includes(char)) {
          return new Name(char)
        }
      }

      for (let i = 1; ; i++) {
        if (!avoid.includes(`x${i}`)) {
          return new Name(`x${i}`)
        }
      }
    }

    readonly canEval: false = false
    readonly locals: readonly [T]

    constructor(readonly name: T) {
      super()
      this.locals = [name]
    }

    rename<Old extends string, New extends string>(
      oldName: Old,
      newName: Name<New>
    ): Rename<this, Old, New>
    rename(oldName: string, newName: Name<string>): Name<string> {
      if (oldName == this.name) {
        return newName
      }

      // @ts-ignore
      return this
    }

    replace<O extends string, N extends Node>(
      oldName: O,
      newNode: N
    ): Equal<O, T> extends true ? N : this
    replace(oldName: string, newNode: Node): Node {
      if (oldName == this.name) {
        return newNode
      }

      // @ts-ignore
      return this
    }

    // #region toString
    toCompactString(): {
      readonly content: T
      readonly endsWithLambda: false
      readonly hasTopLevelApplication: false
      readonly startsWithDottedLambda: false
    } {
      return {
        content: this.name,
        endsWithLambda: false,
        hasTopLevelApplication: false,
        startsWithDottedLambda: false,
      }
    }

    toPartialString(): {
      readonly content: T
      readonly endsWithLambda: false
      readonly hasTopLevelApplication: false
      readonly startsWithDottedLambda: false
    } {
      return {
        content: this.name,
        endsWithLambda: false,
        hasTopLevelApplication: false,
        startsWithDottedLambda: false,
      }
    }
    // #endregion
  }

  type IsSingleCharacter<T extends string> = T extends `${string}${infer U}`
    ? U extends ""
      ? true
      : false
    : false

  type SkipFirstCharacter<T extends string> = T extends `${string}${infer U}`
    ? U
    : ""

  type ExcludeFromArray<
    T extends string,
    A extends readonly string[],
    C extends readonly string[] = readonly []
  > = A extends readonly [T, ...infer Rest extends readonly string[]]
    ? ExcludeFromArray<T, Rest, C>
    : A extends readonly [
        infer Head extends string,
        ...infer Tail extends readonly string[]
      ]
    ? ExcludeFromArray<T, Tail, readonly [...C, Head]>
    : C

  // @ts-ignore
  export class Lambda<
    // @ts-ignore
    out T extends string,
    in out B extends Node
  > extends Node {
    readonly canEval: B["canEval"]
    readonly locals: ExcludeFromArray<T, B["locals"]>

    constructor(readonly name: T, readonly body: B) {
      super()
      this.canEval = body.canEval
      this.locals = body.locals.filter((local) => local != name) as any
    }

    // @ts-ignore
    rename<Old extends string, New extends string>(
      oldName: Old,
      newName: Name<New>
    ): // @ts-ignore
    Rename<this, Old, New>
    rename(oldName: string, newName: Name<string>): Node {
      if (oldName == this.name) {
        return this
      }

      // @ts-ignore
      return new Lambda(this.name, this.body.rename(oldName, newName))
    }

    // @ts-ignore
    replace<O extends string, N extends Node>(
      oldName: O,
      newNode: N
    ): // @ts-ignore
    Replace<this, O, N>
    replace(oldName: string, newNode: Node): Node {
      if (oldName == this.name) {
        return this
      }

      if (newNode.locals.includes(this.name)) {
        const unique = Name.unique([
          this.name,
          ...this.locals,
          ...newNode.locals,
        ])

        return new Lambda(
          unique.name,
          this.body.rename(this.name, unique).replace(oldName, newNode)
        )
      }

      return new Lambda(this.name, this.body.replace(oldName, newNode))
    }

    // #region toString
    toCompactString(): ReturnType<
      B["toCompactString"]
    > extends infer B extends PartialString
      ? IsSingleCharacter<T> extends false
        ? {
            readonly content: `λ${T} ${B["content"]}`
            readonly endsWithLambda: true
            readonly hasTopLevelApplication: false
            readonly startsWithDottedLambda: false
          }
        : B["startsWithDottedLambda"] extends true
        ? {
            readonly content: `λ${T}${SkipFirstCharacter<B["content"]>}`
            readonly endsWithLambda: true
            readonly hasTopLevelApplication: false
            readonly startsWithDottedLambda: true
          }
        : {
            readonly content: `λ${T}.${B["content"]}`
            readonly endsWithLambda: true
            readonly hasTopLevelApplication: false
            readonly startsWithDottedLambda: true
          }
      : never
    toCompactString(): PartialString {
      const body = this.body.toCompactString()

      if (this.name.length != 1) {
        return {
          content: `λ${this.name} ${body.content}`,
          endsWithLambda: true,
          hasTopLevelApplication: false,
          startsWithDottedLambda: false,
        }
      }

      if (body.startsWithDottedLambda) {
        return {
          content: "λ" + this.name + body.content.slice(1),
          endsWithLambda: true,
          hasTopLevelApplication: false,
          startsWithDottedLambda: true,
        }
      }

      return {
        content: `λ${this.name}.${body.content}`,
        endsWithLambda: true,
        hasTopLevelApplication: false,
        startsWithDottedLambda: true,
      }
    }

    toPartialString(): {
      readonly content: `λ${T} ${ReturnType<B["toPartialString"]>["content"]}`
      readonly endsWithLambda: true
      readonly hasTopLevelApplication: false
      readonly startsWithDottedLambda: false
    }
    toPartialString(): PartialString {
      const body = this.body.toPartialString()

      return {
        content: `λ${this.name} ${body.content}`,
        endsWithLambda: true,
        hasTopLevelApplication: false,
        startsWithDottedLambda: false,
      }
    }
    // #endregion
  }

  export class Application<L extends Node, R extends Node> extends Node {
    readonly canEval: L extends Lambda<string, Node>
      ? true
      : L["canEval"] extends true
      ? true
      : R["canEval"] extends true
      ? true
      : false

    readonly locals: readonly [...L["locals"], ...R["locals"]]

    constructor(readonly left: L, readonly right: R) {
      super()

      this.canEval = (left instanceof Lambda ||
        left.canEval ||
        right.canEval) as any

      this.locals = [...left.locals, ...right.locals] as any
    }

    rename<Old extends string, New extends string>(
      oldName: Old,
      newName: Name<New>
    ): Application<Rename<L, Old, New>, Rename<R, Old, New>> {
      return new Application(
        this.left.rename(oldName, newName),
        this.right.rename(oldName, newName)
      ) as any
    }

    // @ts-ignore
    replace<O extends string, N extends Node>(
      oldName: O,
      // @ts-ignore
      newNode: N
    ): // @ts-ignore
    Replace<this, O, N>
    replace(oldName: string, newNode: Node): Node {
      return new Application(
        this.left.replace(oldName, newNode),
        this.right.replace(oldName, newNode)
      )
    }

    // #region toString
    toCompactString(): ReturnType<
      L["toCompactString"]
    > extends infer L extends PartialString
      ? ReturnType<R["toCompactString"]> extends infer R extends PartialString
        ? {
            readonly content: `${L["endsWithLambda"] extends true
              ? `(${L["content"]})`
              : L["content"]}${R["hasTopLevelApplication"] extends true
              ? `(${R["content"]})`
              : R["content"]}`
            readonly endsWithLambda: R["endsWithLambda"]
            readonly hasTopLevelApplication: true
            readonly startsWithDottedLambda: false
          }
        : never
      : never
    toCompactString(): PartialString {
      const left = this.left.toCompactString()
      const right = this.right.toCompactString()

      return {
        content:
          (left.endsWithLambda ? `(${left.content})` : left.content) +
          (right.hasTopLevelApplication ? `(${right.content})` : right.content),
        endsWithLambda: right.endsWithLambda,
        hasTopLevelApplication: true,
        startsWithDottedLambda: false,
      }
    }

    toPartialString(): ReturnType<
      L["toPartialString"]
    > extends infer L extends PartialString
      ? ReturnType<R["toPartialString"]> extends infer R extends PartialString
        ? {
            readonly content: `${L["endsWithLambda"] extends true
              ? `(${L["content"]})`
              : L["content"]} ${R["hasTopLevelApplication"] extends true
              ? `(${R["content"]})`
              : R["content"]}`
            readonly endsWithLambda: R["endsWithLambda"]
            readonly hasTopLevelApplication: true
            readonly startsWithDottedLambda: false
          }
        : never
      : never
    toPartialString(): PartialString {
      const left = this.left.toPartialString()
      const right = this.right.toPartialString()

      return {
        content:
          (left.endsWithLambda ? `(${left.content})` : left.content) +
          " " +
          (right.hasTopLevelApplication ? `(${right.content})` : right.content),
        endsWithLambda: right.endsWithLambda,
        hasTopLevelApplication: true,
        startsWithDottedLambda: false,
      }
    }
    // #endregion
  }
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (typeof a != typeof b) {
    return false
  }

  if (typeof a == "object" && a !== null) {
    if (typeof b == "object" && b !== null) {
      const aKeys = Object.keys(a)
      const bKeys = Object.keys(b)

      for (const key of [...aKeys, ...bKeys]) {
        if (!(key in a) || !(key in b)) {
          return false
        }

        const aVal: unknown = (a as any)[key]
        const bVal: unknown = (b as any)[key]

        if (!deepEqual(aVal, bVal)) {
          return false
        }
      }

      return true
    }

    return false
  }

  return typeof a == typeof b && a === b
}
