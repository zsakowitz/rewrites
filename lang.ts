// To make this work, run `npm run build-ohm` in the console.

import ohm from "ohm-js";
import story, {
  StorymaticActionDict,
  StorymaticGrammar,
  StorymaticSemantics,
} from "./story.ohm-bundle.js";

let semantics = story.createSemantics();
export function js(text: string) {
  return semantics(story.match(text)).js();
}

interface Node {
  readonly output: string;
  readonly scopedVariables: string[];
  readonly isAsync: boolean;
  readonly isGenerator: boolean;
  toString(this: Node): string;
  trim(this: Node): Node;
}

interface PartialNode extends Partial<Node> {
  output: string;
}

function toString(this: Node) {
  return this.output;
}

function trim(this: Node) {
  return createNode(this.output.trim(), this);
}

function createNode(options: string | PartialNode, ...parents: Node[]): Node {
  // The type assertion here ensures that the `options` node is included as a standard node.
  if (typeof options == "object") {
    parents.push(options as any);
  } else {
    parents.push({ output: options, scopedVariables: [] } as any);
  }

  let output = typeof options == "string" ? options : options.output;

  return {
    trim,
    output,
    toString,
    isAsync: parents.some((e) => e.isAsync),
    isGenerator: parents.some((e) => e.isGenerator),
    scopedVariables: parents.flatMap((e) => e.scopedVariables || []),
  };
}

function makeNode(
  strings: TemplateStringsArray,
  ...substitutions: (string | Node)[]
) {
  let text = strings[0];
  text += strings
    .slice(1)
    .map((e, i) => substitutions[i] + e)
    .join("");
  let nodes = substitutions.filter((e): e is Node => typeof e != "string");
  return createNode(text, ...nodes);
}

function createNodes(...nodes: ohm.Node[]) {
  return nodes.map((e) => e.js());
}

function indent(text: string): string;
function indent(node: Node): Node;
function indent(item: string | Node): string | Node;
function indent(item: string | Node): string | Node {
  if (typeof item == "object") return createNode(indent(item.output), item);

  let split = item.split("\n");
  let indented = split
    .slice(1)
    .map((e) => e && "  " + e)
    .join("\n");

  return split[0] + "\n" + indented;
}

interface Function {
  identifier?: Node;
  isMethod?: "class" | "object";
  params?: Node;
  body: Node;
}

function makeScopedVars(scoped: string[], exclude?: string[]) {
  let vars = new Set(scoped);
  for (let name of exclude || []) vars.delete(name);
  let sorted = [...vars].sort();
  return sorted.length ? `let ${sorted.join(", ")};\n` : "";
}

function makeFunction({ identifier, isMethod, params, body }: Function): Node {
  // Remove wrapping block of functions
  let output = body.output
    .split("\n")
    .slice(1, -1)
    .map((e) => e.slice(2))
    .join("\n");

  let scoped = makeScopedVars(body.scopedVariables, params?.scopedVariables);
  scoped = scoped && scoped + "  ";

  let async = body.isAsync ? "async " : "";
  let gen = body.isGenerator ? "*" : "";
  let self = isMethod == "class" ? "let $self = this;\n  " : "";

  let ident = identifier || "";

  if (isMethod) {
    return createNode(`${async}${gen}${ident}(${params || ""}) {
  ${self}${scoped}${indent(output)}}`);
  } else {
    return createNode(`${async}function${gen} ${ident}(${params || ""}) {
  ${scoped}${indent(output)}}`);
  }
}

function joinWithComma(ohm: ohm.Node[]) {
  let js = ohm.map((e) => e.js());
  let output = js.map((e) => e.output).join(", ");
  return createNode(output, ...js);
}

function sepByComma(node: ohm.NonterminalNode) {
  return joinWithComma(node.asIteration().children);
}

let actions: StorymaticActionDict<Node> = {
  _terminal() {
    return createNode(this.sourceString);
  },
  _iter(...children) {
    let js = children.map((node) => node.js());
    let output = js.map((node) => node.output).join("");
    return createNode(output, ...js);
  },

  Accessor(base, addons) {
    return makeNode`${base.js()}${addons.js()}`;
  },
  AccessorAddon_computed_member_access(_0, node, _1) {
    return makeNode`[${node.js()}]`;
  },
  AccessorAddon_member_access(_0, node) {
    return makeNode`.${node.js()}`;
  },
  AccessorAddon_symbol_access(_0, node) {
    return makeNode`[${node.js()}]`;
  },
  AddExp_addition(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return makeNode`${a} + ${b}`;
  },
  AddExp_subtraction(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return makeNode`${a} - ${b}`;
  },
  ArgumentList(node) {
    let js = createNodes(...node.asIteration().children);
    return createNode(js.map((e) => e.output).join(", "), ...js);
  },
  Argument_spread_operator(_, node) {
    return makeNode`...${node.js()}`;
  },
  AssignableWithDefault_with_default(assignable, _, expression) {
    return makeNode`${assignable.js()} = ${expression.js()}`;
  },
  AssignableKeyWithRewrite_computed_rewrite(_0, expr, _1, _2, assignable) {
    return makeNode`[${expr.js()}]: ${assignable.js()}`;
  },
  AssignableKeyWithRewrite_computed_string_rewrite(string, _, assignable) {
    return makeNode`[${string.js()}]: ${assignable.js()}`;
  },
  AssignableKeyWithRewrite_standard_rewrite(ident, _, assignable) {
    return makeNode`${ident.js()}: ${assignable.js()}`;
  },
  AssignableKeyWithRewrite_string_rewrite(string, _, assignable) {
    return makeNode`${string.js()}: ${assignable.js()}`;
  },
  AssignableKeyWithRewrite_symbol_rewrite(symbol, _, assignable) {
    return makeNode`[${symbol.js()}]: ${assignable.js()}`;
  },
  Assignable_array(_0, varNodes, _1, _2, spreadNode, _3, _4) {
    let nodes = createNodes(...varNodes.asIteration().children);
    if (spreadNode.sourceString) nodes.push(makeNode`...${spreadNode.js()}`);
    return createNode(`[${nodes.join(", ")}]`, ...nodes);
  },
  Assignable_identifier(identNode) {
    let js = identNode.js();
    return createNode({ output: js.output, scopedVariables: [js.output] }, js);
  },
  Assignable_object(_0, varNodes, _1, _2, spreadNode, _3, _4) {
    let nodes = createNodes(...varNodes.asIteration().children);
    if (spreadNode.sourceString) nodes.push(makeNode`...${spreadNode.js()}`);
    return createNode(`{ ${nodes.join(", ")} }`, ...nodes);
  },
  AssignmentExp_assignment(assignable, _, expression) {
    return makeNode`${assignable.js()} = ${expression.js()}`;
  },
  bigint(_0, _1, _2) {
    return createNode(this.sourceString);
  },
  block_comment(_0, _1, _2) {
    return createNode("");
  },
  boolean(node) {
    return createNode(node.sourceString);
  },
  BlockFunction_no_params(_0, _1, identNode, funcBody) {
    return makeNode`${makeFunction({
      identifier: identNode.js(),
      body: funcBody.js(),
    })}\n`;
  },
  BlockFunction_with_params(
    _0,
    _1,
    identNode,
    _2,
    _3,
    _4,
    paramListNode,
    funcBody
  ) {
    return makeNode`${makeFunction({
      identifier: identNode.js(),
      body: funcBody.js(),
      params: paramListNode.js(),
    })}\n`;
  },
  char(node) {
    return createNode(node.sourceString);
  },
  ClassCreationExp_class_creation_implied(_0, _1, target, _2, args) {
    return makeNode`new ${target.js()}(${args.js()})`;
  },
  ClassCreationExp_class_creation_no_args(_0, _1, target) {
    return makeNode`new ${target.js()}()`;
  },
  ClassCreationExp_class_creation_symbolic(_0, _1, target, _2, args, _3) {
    return makeNode`new ${target.js()}(${args.js()})`;
  },
  CompareExp_greater_than(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return makeNode`${a} > ${b}`;
  },
  CompareExp_greater_than_equal(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return makeNode`${a} >= ${b}`;
  },
  CompareExp_instanceof(nodeA, _0, _1, _2, _3, _4, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return makeNode`${a} instanceof ${b}`;
  },
  CompareExp_less_than(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return makeNode`${a} < ${b}`;
  },
  CompareExp_less_than_equal(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return makeNode`${a} <= ${b}`;
  },
  CompareExp_not_instanceof(nodeA, _0, _1, _2, _3, _4, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return makeNode`!(${a} instanceof ${b})`;
  },
  CompareExp_not_within(nodeA, _0, _1, _2, _3, _4, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return makeNode`!(${a} in Object(${b}))`;
  },
  CompareExp_within(nodeA, _0, _1, _2, _3, _4, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return makeNode`${a} in Object(${b})`;
  },
  decimalNumber(_0, _1, _2, _3, _4, _5, _6) {
    return createNode(this.sourceString);
  },
  equalityExpWords(_0, node, _1) {
    if (node.sourceString == "isnt") return createNode("!=");
    return createNode("==");
  },
  ElseIfKeyword_elif(_) {
    return createNode("else if");
  },
  ElseIfKeyword_else_if(_0, _1) {
    return createNode("else if");
  },
  ElseIfKeyword_else_unless(_0, _1, _2) {
    return createNode("else unless");
  },
  ElseIfStatement(ifUnless, _, conditionNode, block) {
    let condition: Node;
    if (ifUnless.sourceString == "unless") {
      condition = makeNode`!(${conditionNode.js()})`;
    } else condition = conditionNode.js();

    return makeNode` else if (${condition}) ${block.js().trim()}`;
  },
  ElseStatement(_0, _1, node) {
    return makeNode` else ${node.js().trim()}`;
  },
  EqualityExp_equal_to(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return makeNode`${a} === ${b}`;
  },
  EqualityExp_not_equal_to(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return makeNode`${a} !== ${b}`;
  },
  ExpExp_exponentiate(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return makeNode`${a} ** ${b}`;
  },
  ExportableItemName_rewrite(first, _0, _1, _2, second) {
    return makeNode`${first.js()} as ${second.js()}`;
  },
  FinallyStatement(_0, _1, node) {
    let js = node.js();
    return makeNode`finally ${js}`;
  },
  FunctionBody_expression(_, node) {
    let js = node.js();
    let body = makeNode`return ${js};\n`;
    return makeNode`{\n  ${indent(body)}}\n`;
  },
  IfStatement(ifUnless, _0, conditionNode, block, elseifs, elseBlock) {
    let condition: Node;
    if (ifUnless.sourceString == "unless") {
      condition = makeNode`!(${conditionNode.js()})`;
    } else condition = conditionNode.js();

    let node = block.js().trim();
    return makeNode`if (${condition}) ${node}${elseifs.js()}${elseBlock.js()}\n`;
  },
  ImportableItemName_rewrite(first, _0, _1, _2, second) {
    return makeNode`${first.js()} as ${second.js()}`;
  },
  identifier(node) {
    return node.js();
  },
  identifierNumber(_0, _1, _2) {
    return createNode(this.sourceString);
  },
  identifierWord(node) {
    return createNode(node.sourceString);
  },
  identifierWords(firstWord, _, otherWords) {
    let output = firstWord.sourceString;

    for (let word of otherWords.children) {
      let text = word.sourceString;
      output += text[0].toUpperCase() + text.slice(1);
    }

    return makeNode`${output}`;
  },
  LiteralExp_parenthesized(_0, node, _1) {
    let js = node.js();
    return makeNode`(${js})`;
  },
  LogicalAndExp_logical_and(nodeA, _0, _1, _2, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return makeNode`${a} && ${b}`;
  },
  LogicalOrExp_logical_nullish_coalescing(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return makeNode`${a} ?? ${b}`;
  },
  LogicalOrExp_logical_or(nodeA, _0, _1, _2, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return makeNode`${a} || ${b}`;
  },
  MulExp_division(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return makeNode`${a} / ${b}`;
  },
  MulExp_modulus(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return makeNode`${a} % ${b}`;
  },
  MulExp_multiplication(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return makeNode`${a} * ${b}`;
  },
  NonAssignableAccessor(base, addons) {
    return makeNode`${base.js()}${addons.js()}`;
  },
  NonCapturingAssignable_array(_0, varNodes, _1, _2, spreadNode, _3, _4) {
    let nodes = createNodes(...varNodes.asIteration().children);
    if (spreadNode.sourceString) nodes.push(makeNode`...${spreadNode.js()}`);
    return createNode(`[${nodes.join(", ")}]`, ...nodes);
  },
  NonCapturingAssignable_object(_0, varNodes, _1, _2, spreadNode, _3, _4) {
    let nodes = createNodes(...varNodes.asIteration().children);
    if (spreadNode.sourceString) nodes.push(makeNode`...${spreadNode.js()}`);
    return createNode(`{ ${nodes.join(", ")} }`, ...nodes);
  },
  NotExp_await(_0, _1, node) {
    let js = node.js();
    return createNode({ output: `await ${js}`, isAsync: true }, js);
  },
  NotExp_logical_not_symbolic(_0, node) {
    let js = node.js();
    return makeNode`!${js}`;
  },
  NotExp_logical_not_worded(_0, _1, node) {
    let js = node.js();
    return makeNode`!${js}`;
  },
  NotExp_typeof(_0, _1, _2, node) {
    let js = node.js();
    return makeNode`typeof ${js}`;
  },
  NotExp_unary_minus(_0, node) {
    let js = node.js();
    return makeNode`-${js}`;
  },
  NotExp_unary_plus(_0, node) {
    let js = node.js();
    return makeNode`+${js}`;
  },
  number(node) {
    return createNode(node.sourceString);
  },
  ParameterList(node, _) {
    let nodes = createNodes(...node.asIteration().children);
    return createNode(nodes.map((e) => e.output).join(", "), ...nodes);
  },
  Parameter_rest_operator(_, node) {
    return makeNode`...${node.js()}`;
  },
  Property_computed(_0, _1, node, _2) {
    return makeNode`self[${node.js()}]`;
  },
  Property_identifier(_, node) {
    return makeNode`self.${node.js()}`;
  },
  Property_symbol(_, node) {
    return makeNode`self[${node.js()}]`;
  },
  Script(node) {
    let js = node.js();
    let output = js.output;

    output = makeScopedVars(js.scopedVariables) + output;

    if (js.isAsync) output += `\nexport {};`;

    if (js.isGenerator)
      output = `throw new SyntaxError('Yield statements may not appear in the top level of a script.');`;

    return createNode(`"use strict";\n${output}`);
  },
  SingleStatementBlock_single_statement(_0, _1, statementNode) {
    let js = statementNode.js();
    return makeNode`{\n  ${indent(js)}}\n`;
  },
  StatementBlock_statements(node) {
    let nodes = createNodes(...node.children);
    return createNode(nodes.map((e) => e.output).join("\n"), ...nodes);
  },
  Statement_await_new_thread(_0, _1, identNode, _2, exprNode, statementNode) {
    let [ident, expr] = createNodes(identNode, exprNode);
    let statement = statementNode.js();
    let func: Function = {
      body: statement,
      params: ident,
    };

    let funcNode = makeFunction(func);

    return createNode(
      `(async function ($expr) {
  ${indent(`(${funcNode})(await $expr);\n`)}})(${expr});`,
      funcNode
    );
  },
  Statement_expression(node, _) {
    let js = node.js();

    if (js.output.startsWith("{") || js.output.startsWith("function")) {
      return makeNode`(${js});`;
    } else return makeNode`${js};`;
  },
  Statement_break(_0, _1) {
    return createNode("break;");
  },
  Statement_continue(_0, _1) {
    return createNode("continue;");
  },
  Statement_do_until(_0, _1, block, _2, _3, _4, expr, _5) {
    return makeNode`do ${block.js()} while (!(${expr.js()}))`;
  },
  Statement_do_while(_0, _1, block, _2, _3, _4, expr, _5) {
    return makeNode`do ${block.js()} while (${expr.js()})`;
  },
  Statement_empty_export(_0, _1) {
    return makeNode`export {};`;
  },
  Statement_empty_import(_0, _1, filename, _2) {
    return makeNode`import ${filename.js()};`;
  },
  Statement_export(_0, _1, exports, _2) {
    return makeNode`export { ${sepByComma(exports)} };`;
  },
  Statement_export_all_from(_0, _1, _2, _3, filename, _4) {
    return makeNode`export * from ${filename.js()};`;
  },
  Statement_export_class(_0, _1, block) {
    return makeNode`export ${block.js()}`;
  },
  Statement_export_default(_0, _1, expr, _2) {
    return makeNode`export default ${expr.js()};`;
  },
  Statement_export_from(_0, _1, exports, _2, _3, _4, filename, _5) {
    return makeNode`export { ${sepByComma(exports)} } from ${filename.js()};`;
  },
  Statement_export_function(_0, _1, block) {
    return makeNode`export ${block.js()}`;
  },
  Statement_export_variable(_0, _1, expr) {
    return makeNode`export let ${expr.js()};`;
  },
  Statement_for_await_of(_0, _1, _2, _3, assignable, _4, _5, _6, expr, block) {
    let node = makeNode`for await (let ${assignable.js()} of ${expr.js()}) ${block.js()}`;
    return { ...node, isAsync: true };
  },
  Statement_for_in(_0, _1, assignable, _2, _3, _4, expression, block) {
    return makeNode`for (let ${assignable.js()} in ${expression.js()}) ${block.js()}`;
  },
  Statement_for_of(_0, _1, assignable, _2, _3, _4, expression, block) {
    return makeNode`for (let ${assignable.js()} of ${expression.js()}) ${block.js()}`;
  },
  Statement_for_range(
    _0,
    _1,
    identNode,
    _2,
    _3,
    _4,
    fromNode,
    _5,
    down,
    _6,
    toThrough,
    _7,
    toNode,
    _8,
    _9,
    _10,
    stepNode,
    block
  ) {
    let ident = identNode.js();
    let isDown = down.sourceString.startsWith(" down");

    let to: Node | string = toNode.js();
    if (!to.output) to = isDown ? "-Infinity" : "Infinity";

    let from: Node | string = fromNode.js();
    if (!from.output) from = "0";

    let step: Node | string = stepNode.js();
    if (!step.output) step = "1";

    let condition = toThrough.sourceString.startsWith(" through")
      ? isDown
        ? makeNode`${ident.output} >= ${to}`
        : makeNode`${ident} <= ${to}`
      : isDown
      ? makeNode`${ident.output} > ${to}`
      : makeNode`${ident.output} < ${to}`;

    let dir = isDown ? "-" : "+";

    return makeNode`for (let ${ident} = ${from}; ${condition}; ${ident} ${dir}= ${step}) ${block.js()}`;
  },
  Statement_print(_0, _1, expr, _2) {
    return makeNode`console.log(${expr.js()});`;
  },
  Statement_repeat(_0, _1, expr, block) {
    return makeNode`for (let $ = 0; $ < ${expr.js()}; $++) ${block.js()}`;
  },
  Statement_throw(_0, _1, expr, _2) {
    return makeNode`throw ${expr.js()};`;
  },
  StaticProperty_computed(_0, _1, node, _2) {
    return makeNode`self.constructor[${node.js()}]`;
  },
  StaticProperty_identifier(_, node) {
    return makeNode`self.constructor.${node.js()}`;
  },
  StaticProperty_symbol(_, node) {
    return makeNode`self.constructor[${node.js()}]`;
  },
  string_bit_character(char) {
    if (char.sourceString == "$") return createNode("\\$");
    if (char.sourceString == "\n") return createNode("\\n");
    if (char.sourceString == "\r") return createNode("\\r");
    return createNode(char.sourceString);
  },
  string_bit_escape(_0, _1) {
    return createNode(this.sourceString);
  },
  string_bit_escape_sequence(_0, _1) {
    return createNode(this.sourceString);
  },
  string_bit_hex_sequence(_0, _1, _2) {
    return createNode(this.sourceString);
  },
  string_bit_unicode_code_point_sequence(_0, _1, _2) {
    return createNode(this.sourceString);
  },
  string_bit_unicode_sequence(_0, _1, _2, _3, _4) {
    return createNode(this.sourceString);
  },
  string_full(delim, bits, _) {
    return createNode(`${delim.sourceString}${bits.js()}${delim.sourceString}`);
  },
  string_interpolatable(_0, bits, _1) {
    return createNode(`\`${bits.js()}\``);
  },
  string_interpolatable_bit_interpolated(_0, expr, _1) {
    return createNode(`\${${expr.js()}}`);
  },
  SymbolKey_computed(_0, node, _1) {
    return node.js();
  },
  SymbolKey_string(node) {
    return node.js();
  },
  SymbolKey_name(node) {
    return makeNode`"${node.js()}"`;
  },
  Symbol_builtin_symbol(_, node) {
    return makeNode`Symbol[${node.js()}]`;
  },
  Symbol_symbol_for(_, node) {
    return makeNode`Symbol.for(${node.js()})`;
  },
  TernaryExp_symbolic(conditionNode, _0, trueNode, _1, falseNode) {
    let condition = conditionNode.js();
    let [ifTrue, ifFalse] = createNodes(trueNode, falseNode);

    return makeNode`${condition} ? ${ifTrue} : ${ifFalse}`;
  },
  UnprefixedSingleStatementBlock_single_statement(statementNode) {
    let js = statementNode.js();
    return makeNode`{\n  ${indent(js)}}\n`;
  },
  VariableAssignment(assignable, _, expr) {
    return makeNode`${assignable.js()} = ${expr.js()}`;
  },
  whitespace(_) {
    return createNode(" ");
  },
  word(_0, _1, _2) {
    return createNode(this.sourceString);
  },
  WrappedStatementBlock(_0, node, _1) {
    let js = node.js();
    return makeNode`{\n  ${indent(js)}}\n`;
  },
};

semantics.addOperation<Node>("js", actions);

type SMNode = Node;

declare module "ohm-js" {
  export interface Node {
    js(): SMNode;
    asIteration(): ohm.IterationNode;
  }
}

declare module "./story.ohm-bundle.js" {
  export interface StorymaticDict {
    js(): SMNode;
  }

  export interface StorymaticSemantics {
    (match: ohm.MatchResult): StorymaticDict;
  }
}

export { story, semantics };
