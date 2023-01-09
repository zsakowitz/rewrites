// A parser and evaluator for lambda calculus. #parser

export type Token =
  | { readonly type: "backslash"; readonly name: string }
  | { readonly type: "name"; readonly name: string }
  | { readonly type: "leftParen" }
  | { readonly type: "rightParen" }

const whitespace = /\s/

export function transform(text: string): string {
  const aliases: [name: string, value: string][] = []

  text = text.replace(/^([^\s()\\]+)\s+=\s+([^;]+);/gm, (_, name, value) => {
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
    if (char == "\\" || char == "(" || char == ")" || whitespace.test(char)) {
      if (currentWord) {
        tokens.push({ type: "name", name: currentWord })
        currentWord = ""
      }

      if (char == "\\" || char == "(" || char == ")") {
        tokens.push({
          type:
            char == "\\"
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
  | Name
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
  | Name
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

    let output = node(tree[0])

    for (let index = 1; index < tree.length; index++) {
      output = new Application(output, node(tree[index]))
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

export abstract class Node {
  declare type?: undefined

  abstract isBound(name: string): boolean
  abstract isFree(name: string): boolean
  abstract rename(oldName: string, newName: Name): Node
  abstract replace(name: string, node: Node): Node
  abstract toJS(): string
  abstract toString(): string
}

export class Name extends Node {
  private static uniqueId = 0

  static escape(name: string) {
    return name.replace(/^\d|[^A-Za-z$_]/g, (char) => "_" + char.charCodeAt(0))
  }

  static unique() {
    return new Name("$__" + ++this.uniqueId)
  }

  constructor(readonly name: string) {
    super()
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

  rename(oldName: string, newName: Name): Node {
    if (oldName == this.name) {
      return newName
    }

    return this
  }

  toJS(): string {
    return `$.lazy(() => ${Name.escape(this.name)})`
  }

  toString(): string {
    return this.name
  }
}

export class Application extends Node {
  constructor(readonly left: Node, readonly right: Node) {
    super()
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
      this.right.replace(name, node)
    )
  }

  rename(oldName: string, newName: Name): Node {
    return new Application(
      this.left.rename(oldName, newName),
      this.right.rename(oldName, newName)
    )
  }

  toJS(): string {
    return `$.lazy(() => $.apply(${this.left.toJS()}, ${this.right.toJS()}))`
  }

  toString(): string {
    return `Application
  ${indent(this.left.toString())}
  ${indent(this.right.toString())}`
  }
}

export class Lambda extends Node {
  constructor(readonly name: string, readonly body: Node) {
    super()
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

    let self: Lambda = this

    if (node.isFree(this.name)) {
      self = this.shuffle()
    }

    return new Lambda(self.name, self.body.replace(name, node))
  }

  rename(oldName: string, newName: Name): Node {
    if (this.name == oldName) {
      return this
    }

    return new Lambda(this.name, this.body.rename(oldName, newName))
  }

  shuffle(): Lambda {
    const newName = Name.unique()

    return new Lambda(newName.name, this.body.rename(this.name, newName))
  }

  toJS(): string {
    return `((${Name.escape(this.name)}) => (${this.body.toJS()}))`
  }

  toString(): string {
    return `λ${this.name}\n  ${indent(this.body.toString())}`
  }
}

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
          true
        ),
        false
      )
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
      })
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
        0
      )
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
