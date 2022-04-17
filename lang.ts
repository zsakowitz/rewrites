import * as A from "arcsecond";

type Coroutine<T> = Generator<A.Parser<any>, T, any>;

export interface Node<T extends string> {
  nodeType: T;
  output: string;
}

// LineTerminatorNode

export interface LineTerminatorNode extends Node<"LineTerminatorNode"> {
  type: "semicolon" | "newline";
}

export let LineTerminatorNode: A.Parser<LineTerminatorNode> = A.anyOfString(
  ";\n"
).map((x) => ({
  nodeType: "LineTerminatorNode",
  output: ";",
  type: x == ";" ? "semicolon" : "newline",
}));

// IntegerNode

export interface IntegerNode extends Node<"IntegerNode"> {}

export let IntegerNode: A.Parser<IntegerNode> = A.regex(/^[+-]?\d+n/).map(
  (x) => ({
    nodeType: "IntegerNode",
    output: x,
  })
);

// NumberNode

export interface NumberNode extends Node<"NumberNode"> {}

export let NumberNode: A.Parser<NumberNode> = A.regex(/^[+-]?\d+/).map((x) => ({
  nodeType: "NumberNode",
  output: x,
}));

// StringNode

export interface StringNode extends Node<"StringNode"> {}

export let StringNode: A.Parser<StringNode> = A.sequenceOf([
  A.char('"'),
  A.many(
    A.choice([
      // For some reason, the arcsecond typings think that A.anyCharExcept
      // returns a number when it actually returns a string, so we have
      // to do a small fix for TypeScript purposes. Ugh.
      A.anyCharExcept(A.anyOfString('"\\\n')).map((x) => "" + x),
      A.sequenceOf([A.char("\\"), A.anyChar]).map(([, x]) => `\\${x}`),
    ])
  ).map((x) => x.join("")),
  A.char('"'),
]).map((x) => ({ nodeType: "StringNode", output: x.join("") }));

// IdentifierNode

export interface IdentifierNode extends Node<"IdentifierNode"> {}

export let IdentifierNode: A.Parser<IdentifierNode> = A.regex(
  /^[A-Za-z][A-Za-z0-9_]*/
).map((x) => ({ nodeType: "IdentifierNode", output: x }));

// ExpressionNode

export interface ExpressionNode extends Node<"ExpressionNode"> {}

export let ExpressionNode: A.Parser<ExpressionNode> = A.fail("not defined");

// IdentifierWithDefaultNode

export interface IdentifierWithDefaultNode
  extends Node<"IdentifierWithDefaultNode"> {}

// VariableDeclarationNode

export interface VariableDeclarationNode
  extends Node<"VariableDeclarationNode"> {
  identifier: IdentifierNode;
  expression: ExpressionNode;
}

export let VariableDeclarationNode = A.coroutine(
  function* (): Coroutine<VariableDeclarationNode> {
    yield A.str("let");
    yield A.whitespace;
    let identifier: IdentifierNode = yield IdentifierNode;
    yield A.optionalWhitespace;
    yield A.char("=");
    yield A.optionalWhitespace;
    let expression: ExpressionNode = yield ExpressionNode;
    yield LineTerminatorNode;

    return {
      nodeType: "VariableDeclarationNode",
      identifier,
      expression,
      output: `let ${identifier} = ${expression};`,
    };
  }
);

// Type augmentations

declare module "arcsecond" {
  export function str<T extends string>(str: T): A.Parser<T>;
}
