// An attempt to parse a language using the arcsecond library. #parser

import * as A from "arcsecond"

type Coroutine<T> = Generator<A.Parser<any>, T, any>

export interface Node<T extends string> {
  nodeType: T
  output: string
  variables?: string[]
}

// LineTerminatorNode

export interface LineTerminatorNode extends Node<"LineTerminatorNode"> {
  type: "semicolon" | "newline"
}

export let LineTerminatorNode: A.Parser<LineTerminatorNode> = A.anyOfString(
  ";\n",
).map((x) => ({
  nodeType: "LineTerminatorNode",
  output: ";",
  type: x == ";" ? "semicolon" : "newline",
}))

// IntegerNode

export interface IntegerNode extends Node<"IntegerNode"> {}

export let IntegerNode: A.Parser<IntegerNode> = A.regex(/^[+-]?\d+n/).map(
  (x) => ({
    nodeType: "IntegerNode",
    output: x,
  }),
)

// NumberNode

export interface NumberNode extends Node<"NumberNode"> {}

export let NumberNode: A.Parser<NumberNode> = A.regex(
  /^[+-]?\d+(\.\d+)?(e[+-]?\d+)?|NaN|-?Infinity/,
).map((x) => ({
  nodeType: "NumberNode",
  output: x,
}))

// StringNode

export interface StringNode extends Node<"StringNode"> {}

export let StringNode: A.Parser<StringNode> = A.coroutine(
  function* (): Coroutine<StringNode> {
    let variables: string[] = []
    let output = ""

    yield A.char('"')

    let all: (string | ExpressionNode)[] = yield A.many(
      A.choice([
        // For some reason, the arcsecond typings think that A.anyCharExcept
        // returns a number when it actually returns a string, so we have
        // to do a small fix for TypeScript purposes. Ugh.
        A.anyCharExcept(A.anyOfString('"\\{')).map((x) => {
          if ((x as any) == "`") return "\\`"
          if ((x as any) == "$") return "\\$"
          return "" + x
        }),
        A.sequenceOf([A.char("\\"), A.anyChar]).map(([, x]) => `\\${x}`),
        A.recursiveParser(() =>
          A.sequenceOf([A.char("{"), ExpressionNode, A.char("}")]).map(
            ([, x]) => x,
          ),
        ),
      ]),
    )

    for (let result of all) {
      if (typeof result == "string") {
        output += result
      } else {
        variables.push(...result.variables)
        output += "${" + result.output + "}"
      }
    }

    yield A.char('"')

    return {
      nodeType: "StringNode",
      output: "`" + output + "`",
      variables,
    }
  },
)

// BooleanNode

export interface BooleanNode extends Node<"BooleanNode"> {}

export let BooleanNode: A.Parser<BooleanNode> = A.regex(
  /^yes|no|true|false/i,
).map((x) => ({
  nodeType: "BooleanNode",
  output: x == "yes" || x == "true" ? "true" : "false",
}))

// SymbolNode

export interface SymbolNode extends Node<"SymbolNode"> {}

export let SymbolNode: A.Parser<SymbolNode> = A.regex(
  /^#[A-Za-z]![A-Za-z0-9_]*/,
).map((x) => ({
  nodeType: "SymbolNode",
  output: `Symbol.for(${x.slice(1)})`,
}))

// IdentifierNode

export interface IdentifierNode extends Node<"IdentifierNode"> {}

export let IdentifierNode: A.Parser<IdentifierNode> = A.regex(
  /^[A-Za-z]![A-Za-z0-9_]*/,
).map((x) => ({
  nodeType: "IdentifierNode",
  output: x,
  variables: [x],
}))

// ExpressionNode

export interface ExpressionNode extends Node<"ExpressionNode"> {
  variables: string[]
}

export let ExpressionNode: A.Parser<ExpressionNode> = A.recursiveParser(() =>
  A.choice([
    IntegerNode,
    NumberNode,
    StringNode,
    BooleanNode,
    SymbolNode,
    IdentifierNode,
    A.sequenceOf([A.str("("), ExpressionNode, A.str(")")]).map(([, x]) => ({
      variables: x.variables,
      output: `(${x.output})`,
      nodeType: "ExpressionNode",
    })),
    A.sequenceOf([
      ExpressionNode,
      A.optionalWhitespace,
      A.choice([A.str("+"), A.str("-"), A.str("*"), A.str("/")]),
      A.optionalWhitespace,
      ExpressionNode,
    ]).map<ExpressionNode>(([a, , op, , b]) => ({
      variables: a.variables.concat(b.variables),
      output: `${a.output} ${op} ${b.output}`,
      nodeType: "ExpressionNode",
    })),
  ]).map((x: Node<string>) => ({
    // The ordering of the spread operator adds a default value to `variables`.
    variables: [],
    ...x,
    nodeType: "ExpressionNode",
  })),
)

// ScriptNode

export interface ScriptNode extends Node<"ScriptNode"> {}

export let ScriptNode: A.Parser<ScriptNode> = A.sequenceOf([
  A.optionalWhitespace,
  ExpressionNode,
  A.optionalWhitespace,
  A.endOfInput,
]).map(([, x]) => ({ ...x, nodeType: "ScriptNode" }))

// Type augmentations

declare module "arcsecond" {
  // @ts-ignore
  export function str<T extends string>(str: T): A.Parser<T>
}
