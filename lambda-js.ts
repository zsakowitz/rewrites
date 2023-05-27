// A parser and evaluator for lambda calculus implemented using JavaScript code.
// #parser

export type Token =
  | { readonly type: "backslash"; readonly name: string }
  | { readonly type: "name"; readonly name: string }
  | { readonly type: "leftParen" }
  | { readonly type: "rightParen" }

const whitespace = /\s/

export function transform(text: string): string {
  const aliases: [name: string, value: string][] = []

  text = text.replace(/^([^\s()\\λ]+)\s+=\s+([^;]+);/gm, (_, name, value) => {
    aliases.push([name, value])
    return ""
  })

  for (const alias of aliases.reverse()) {
    text = `(\\${alias[0]} ${text})(${alias[1]})`
  }

  return text
}

export function lex(text: string): readonly Token[] {
  const tokens: (
    | { type: "backslash" }
    | { type: "leftParen" }
    | { type: "rightParen" }
    | { type: "name"; name: string }
  )[] = []

  let currentWord = ""

  for (const char of text) {
    if (
      char == "\\" ||
      char == "λ" ||
      char == "(" ||
      char == ")" ||
      whitespace.test(char)
    ) {
      if (currentWord) {
        tokens.push({ type: "name", name: currentWord })
        currentWord = ""
      }

      if (char == "\\" || char == "λ" || char == "(" || char == ")") {
        tokens.push({
          type:
            char == "\\" || char == "λ"
              ? "backslash"
              : char == "("
              ? "leftParen"
              : "rightParen",
        })
      }
    } else {
      currentWord += char
    }
  }

  if (currentWord) {
    tokens.push({ type: "name", name: currentWord })
    currentWord = ""
  }

  const output: Token[] = []
  let backslash: { type: "backslash"; name: string } | undefined

  for (const token of tokens) {
    if (backslash) {
      if (token.type == "name") {
        backslash.name = token.name
        output.push(backslash)
        backslash = undefined
      } else {
        throw new Error(`Expected name; received ${token.type}.`)
      }
    } else if (token.type == "backslash") {
      backslash = {
        type: "backslash",
        name: "",
      }
    } else {
      output.push(token)
    }
  }

  if (backslash) {
    throw new Error("Expected name; received EOF.")
  }

  return output
}

export type PartialTree =
  | Name<string>
  | (readonly PartialTree[] & { type?: undefined })
  | {
      readonly type: "backslash"
      readonly name: string
    }

export function partialTree(tokens: readonly Token[]): PartialTree {
  let currentBranch: PartialTree[] = []
  const branches: PartialTree[][] = [currentBranch]

  for (const token of tokens) {
    switch (token.type) {
      case "name":
        currentBranch.push(new Name(token.name))
        break

      case "backslash":
        currentBranch.push(token)
        break

      case "leftParen": {
        const nextBranch: PartialTree[] = []
        currentBranch.push(nextBranch)
        branches.push(nextBranch)
        currentBranch = nextBranch
        break
      }

      case "rightParen": {
        branches.pop()
        const nextBranch = branches.at(-1)

        if (!nextBranch || branches.length < 1) {
          throw new Error("Found unmatched closing parenthesis.")
        }

        currentBranch = nextBranch
      }
    }
  }

  return currentBranch
}

export type Tree =
  | Name<string>
  | readonly Tree[]
  | {
      readonly type: "backslash"
      readonly name: string
      readonly body: Tree[]
    }

export function tree(partialTree: PartialTree): Tree {
  if (partialTree instanceof Name) {
    return partialTree
  }

  if (partialTree.type == "backslash") {
    throw new Error("'tree' cannot parse a lone backslash.")
  }

  let currentOutput: Tree[] = []
  const output: Tree[] = currentOutput

  for (const token of partialTree) {
    if (token.type == "backslash") {
      const nextOutput: Tree[] = []

      const lambda: Tree = {
        type: "backslash",
        body: nextOutput,
        name: token.name,
      }

      currentOutput.push(lambda)
      currentOutput = nextOutput
    } else {
      currentOutput.push(tree(token))
    }
  }

  return output
}

export function node(tree: Tree): Node {
  if (tree instanceof Name) {
    return tree
  }

  if (Array.isArray(tree)) {
    if (tree.length == 0) {
      throw new Error("Expected token; received rightParen.")
    }

    let output = node(tree[0]!)

    for (let index = 1; index < tree.length; index++) {
      output = new Application(output, node(tree[index]!))
    }

    return output
  }

  return new Lambda(tree.name, node(tree.body))
}

export function parse(text: string) {
  return node(tree(partialTree(lex(transform(text)))))
}

function indent(text: string): string {
  return text.split("\n").join("\n  ")
}

function mergeLocals(a: readonly string[], b: readonly string[]): string[] {
  const output = a.slice()

  for (const word of b) {
    if (!output.includes(word)) {
      output.push(word)
    }
  }

  return output
}

export type PartialString = {
  readonly content: string
  readonly endsWithLambda: boolean
  readonly hasTopLevelApplication: boolean
}

const alphabet = "abcdefghijklmnopqrstuvwxyz"

export abstract class Node {
  declare type?: undefined

  abstract readonly canEval: boolean
  abstract readonly locals: readonly string[]
  abstract eval(): Node
  abstract isBound(name: string): boolean
  abstract isFree(name: string): boolean
  abstract rename(oldName: string, newName: Name<string>): Node
  abstract replace(name: string, node: Node): Node
  abstract toJS(): string
  abstract toPartialCompactString(): PartialString
  abstract toPartialString(): PartialString

  ski(): Node {
    return this.replace("S", S).replace("K", K).replace("I", I)
  }

  toCompactString(): string {
    return this.toPartialCompactString().content
  }

  toString(): string {
    return this.toPartialString().content
  }

  uniqueName(avoid: readonly string[]): string {
    avoid = mergeLocals(this.locals, avoid)

    for (const letter of alphabet) {
      if (!avoid.includes(letter)) {
        return letter
      }
    }

    for (let index = 1; ; index++) {
      if (!avoid.includes("x" + index)) {
        return "x" + index
      }
    }
  }
}

export class Name<T extends string> extends Node {
  static escape(name: string) {
    return name.replace(/^\d|[^A-Za-z$_]/g, (char) => "_" + char.charCodeAt(0))
  }

  readonly canEval = false
  readonly locals: readonly string[]

  constructor(readonly name: T) {
    super()
    this.locals = [name]
  }

  eval(): Node {
    return this
  }

  isBound(): boolean {
    return false
  }

  isFree(name: string): boolean {
    return name == this.name
  }

  replace(name: string, node: Node): Node {
    if (name == this.name) {
      return node
    }

    return this
  }

  rename(oldName: string, newName: Name<string>): Node {
    if (oldName == this.name) {
      return newName
    }

    return this
  }

  toJS(): string {
    return `$.lazy(() => ${Name.escape(this.name)})`
  }

  toPartialCompactString(): PartialString {
    return {
      content: this.name,
      endsWithLambda: false,
      hasTopLevelApplication: false,
    }
  }

  toPartialString(): PartialString {
    return {
      content: this.name,
      endsWithLambda: false,
      hasTopLevelApplication: false,
    }
  }
}

export class Application<L extends Node, R extends Node> extends Node {
  readonly canEval: boolean
  readonly locals: readonly string[]

  constructor(readonly left: L, readonly right: R) {
    super()

    this.canEval =
      this.left instanceof Lambda || this.left.canEval || this.right.canEval

    this.locals = mergeLocals(this.left.locals, this.right.locals)
  }

  eval(): Node {
    if (!this.canEval) {
      return this
    }

    if (this.left instanceof Lambda) {
      return this.left.apply(this.right)
    }

    if (this.left.canEval) {
      return new Application(this.left.eval(), this.right)
    }

    if (this.right.canEval) {
      return new Application(this.left, this.right.eval())
    }

    return this
  }

  isBound(name: string): boolean {
    return this.left.isBound(name) || this.right.isBound(name)
  }

  isFree(name: string): boolean {
    return this.left.isFree(name) || this.right.isFree(name)
  }

  replace(name: string, node: Node): Node {
    return new Application(
      this.left.replace(name, node),
      this.right.replace(name, node),
    )
  }

  rename(oldName: string, newName: Name<string>): Node {
    return new Application(
      this.left.rename(oldName, newName),
      this.right.rename(oldName, newName),
    )
  }

  toJS(): string {
    return `$.lazy(() => $.apply(${this.left.toJS()}, ${this.right.toJS()}))`
  }

  toPartialCompactString(): PartialString {
    const left = this.left.toPartialCompactString()
    const right = this.right.toPartialCompactString()

    const content =
      (left.endsWithLambda ? `(${left.content})` : left.content) +
      (right.hasTopLevelApplication ? `(${right.content})` : right.content)

    return {
      content,
      endsWithLambda: right.endsWithLambda,
      hasTopLevelApplication: true,
    }
  }

  toPartialString(): PartialString {
    const left = this.left.toPartialString()
    const right = this.right.toPartialString()

    const content =
      (left.endsWithLambda ? `(${left.content})` : left.content) +
      " " +
      (right.hasTopLevelApplication ? `(${right.content})` : right.content)

    return {
      content,
      endsWithLambda: right.endsWithLambda,
      hasTopLevelApplication: true,
    }
  }
}

export class Lambda<T extends Node> extends Node {
  readonly canEval: boolean
  readonly locals: readonly string[]

  constructor(readonly name: string, readonly body: T) {
    super()

    this.canEval = body.canEval

    this.locals = this.body.locals
      .filter((local) => local !== name)
      .concat(name)
  }

  apply(value: Node): Node {
    return this.body.replace(this.name, value)
  }

  eval(): Node {
    if (!this.canEval) {
      return this
    }

    return new Lambda(this.name, this.body.eval())
  }

  isBound(name: string): boolean {
    return name == this.name || this.body.isBound(name)
  }

  isFree(name: string): boolean {
    return name != this.name && this.body.isFree(name)
  }

  replace(name: string, node: Node): Node {
    if (name == this.name) {
      return this
    }

    let self: Lambda<Node> = this

    if (node.isFree(this.name)) {
      const newName = this.uniqueName(node.locals)

      self = new Lambda(newName, this.body.rename(this.name, new Name(newName)))
    }

    return new Lambda(self.name, self.body.replace(name, node))
  }

  rename(oldName: string, newName: Name<string>): Node {
    if (this.name == oldName) {
      return this
    }

    return new Lambda(this.name, this.body.rename(oldName, newName))
  }

  toJS(): string {
    return `((${Name.escape(this.name)}) => (${this.body.toJS()}))`
  }

  toPartialCompactString(): PartialString {
    const body = this.body.toPartialCompactString()

    const content = body.content.startsWith("λ")
      ? "λ" + this.name + body.content.slice(1)
      : "λ" + this.name + "." + body.content

    return {
      content,
      endsWithLambda: true,
      hasTopLevelApplication: false,
    }
  }

  toPartialString(): PartialString {
    const body = this.body.toPartialString()
    const content = `λ${this.name} ` + body.content

    return {
      content,
      endsWithLambda: true,
      hasTopLevelApplication: false,
    }
  }
}

export const S = new Lambda(
  "x",
  new Lambda(
    "y",
    new Lambda(
      "z",
      new Application(
        new Application(new Name("x"), new Name("z")),
        new Application(new Name("y"), new Name("z")),
      ),
    ),
  ),
)

export const K = new Lambda("x", new Lambda("y", new Name("x")))

export const I = new Lambda("x", new Name("x"))

export namespace $ {
  export class Lazy {
    private value?: unknown

    constructor(private readonly fn: () => unknown) {}

    getValue() {
      if (this.value) {
        return this.value
      }

      const value = this.fn()
      this.value = value
      return value
    }
  }

  export function lazy(fn: () => unknown) {
    return new Lazy(fn)
  }

  export function unwrap(value: unknown) {
    while (value instanceof Lazy) {
      value = value.getValue()
    }

    return value
  }

  export function apply(a: unknown, b: unknown) {
    return new Lazy(() => {
      return (unwrap(a) as Function)(unwrap(b))
    })
  }
}

Object.assign(globalThis, { $ })

export type Value =
  | { type: "nil" }
  | { type: "true" }
  | { type: "false/0" }
  | { type: "pair"; left: Value; right: Value }
  | { type: "numeral"; value: number }
  | { type: "unknown" }

export function getValue(value: unknown): Value {
  const { apply, unwrap } = $

  // https://docs.google.com/spreadsheets/d/1JrqoqQ2Kkxk3VWvJCrBQG_5GvtfZY1oi_koqeg84jIs/edit?usp=sharing
  // has a table of different lambda calculus types. It also shows different
  // ways to figure out what a given type is. This script assumes `value` is
  // either nil (\x true), a pair, true, false, or a Church numeral.

  try {
    // Check #3: finds `nil` and `true`
    const output = unwrap(
      apply(
        apply(
          apply(value, (x: number) => x + 1),
          true,
        ),
        false,
      ),
    )

    if (output === true) {
      return { type: "nil" }
    }

    if (output === 1) {
      return { type: "true" }
    }
  } catch (error) {
    if (error instanceof ReferenceError) {
      throw error
    }
  }

  try {
    // Check #4: finds `0` and `false`, which are then indistinguishable

    const output = unwrap(apply(apply(value, true), false))

    if (output === false) {
      return { type: "false/0" }
    }
  } catch (error) {
    if (error instanceof ReferenceError) {
      throw error
    }
  }

  try {
    // Check #5: finds `pair`

    let a: unknown, b: unknown
    const symbol = Symbol()

    const output = unwrap(
      apply(value, (_a: unknown) => (_b: unknown) => {
        a = _a
        b = _b
        return symbol
      }),
    )

    if (output === symbol) {
      return { type: "pair", left: getValue(a), right: getValue(b) }
    }
  } catch (error) {
    if (error instanceof ReferenceError) {
      throw error
    }
  }

  try {
    // Check #6: finds `integer`

    const output = unwrap(
      apply(
        apply(value, (x: number) => x + 1),
        0,
      ),
    )

    if (typeof output == "number") {
      return { type: "numeral", value: output }
    }
  } catch (error) {
    if (error instanceof ReferenceError) {
      throw error
    }
  }

  return { type: "unknown" }
}

export function valueToString(value: Value): string {
  switch (value.type) {
    case "nil":
    case "true":
    case "false/0":
    case "unknown":
      return value.type

    case "numeral":
      return "" + value.value

    case "pair":
      return `(${valueToString(value.left)}, ${valueToString(value.right)})`
  }
}
