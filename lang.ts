// To make this work, run `npm run build-ohm` in the console.

import ohm from "ohm-js";
import extras from "ohm-js/extras/index.js";
import story, {
  StorymaticActionDict,
  StorymaticGrammar,
  StorymaticSemantics,
} from "./story.ohm-bundle.js";

globalThis.story = story;
globalThis.match = (text: string) => story.match(text);
globalThis.toAST = (text: string) => extras.toAST(story.match(text));
globalThis.semantics = story.createSemantics();
globalThis.js = (text: string) => semantics(story.match(text)).js();

interface Node {
  readonly output: string;
  readonly scopedVariables: string[];
  readonly isAsync: boolean;
  readonly isGenerator: boolean;
  toString(): string;
}

interface PartialNode extends Partial<Node> {
  output: string;
}

function toString(this: Node) {
  return this.output;
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
    output,
    toString,
    isAsync: parents.some((e) => e.isAsync),
    isGenerator: parents.some((e) => e.isGenerator),
    scopedVariables: parents.flatMap((e) => e.scopedVariables),
  };
}

function createNodes(...nodes: ohm.Node[]) {
  return nodes.map((e) => e.js());
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

  AddExp_addition(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return createNode(`${a} + ${b}`, a, b);
  },
  AddExp_subtraction(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return createNode(`${a} - ${b}`, a, b);
  },
  char(node) {
    return createNode(node.sourceString);
  },
  CompareExp_greater_than(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return createNode(`${a} > ${b}`, a, b);
  },
  CompareExp_greater_than_equal(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return createNode(`${a} >= ${b}`, a, b);
  },
  CompareExp_instanceof(nodeA, _0, _1, _2, _3, _4, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return createNode(`${a} instanceof ${b}`, a, b);
  },
  CompareExp_less_than(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return createNode(`${a} < ${b}`, a, b);
  },
  CompareExp_less_than_equal(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return createNode(`${a} <= ${b}`, a, b);
  },
  CompareExp_not_instanceof(nodeA, _0, _1, _2, _3, _4, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return createNode(`!(${a} instanceof ${b})`, a, b);
  },
  CompareExp_not_within(nodeA, _0, _1, _2, _3, _4, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return createNode(`!(${a} in Object(${b}))`, a, b);
  },
  CompareExp_within(nodeA, _0, _1, _2, _3, _4, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return createNode(`${a} in Object(${b})`, a, b);
  },
  decimalNumber(_0, _1, _2, _3, _4, _5, _6) {
    return createNode(this.sourceString);
  },
  ExpExp_exponentiate(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return createNode(`${a} ** ${b}`, a, b);
  },
  identifier(node) {
    return node.js();
  },
  identifierEl(node) {
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

    return createNode(`$${output}`);
  },
  LiteralExp_parenthesized(_0, node, _1) {
    let js = node.js();
    return createNode(`(${js})`, js);
  },
  MulExp_division(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return createNode(`${a} / ${b}`, a, b);
  },
  MulExp_modulus(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return createNode(`${a} % ${b}`, a, b);
  },
  MulExp_multiplication(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return createNode(`${a} * ${b}`, a, b);
  },
  NotExp_await(_0, _1, node) {
    let js = node.js();
    return createNode({ output: `await ${js}`, isAsync: true }, js);
  },
  NotExp_logical_not_symbolic(_0, node) {
    let js = node.js();
    return createNode(`!${js}`, js);
  },
  NotExp_logical_not_worded(_0, _1, node) {
    let js = node.js();
    return createNode(`!${js}`, js);
  },
  NotExp_typeof(_0, _1, _2, node) {
    let js = node.js();
    return createNode(`typeof ${js}`, js);
  },
  NotExp_unary_minus(_0, node) {
    let js = node.js();
    return createNode(`-${js}`, js);
  },
  NotExp_unary_plus(_0, node) {
    let js = node.js();
    return createNode(`+${js}`, js);
  },
  number(node) {
    return createNode(node.sourceString);
  },
  Script(node) {
    let js = node.js();
    let output = js.output;

    if (js.scopedVariables.length > 1)
      output = `let ${js.scopedVariables.join(", ")};\n` + output;

    if (js.isAsync) output += `\n\nexport {};`;

    if (js.isGenerator)
      output = `throw new SyntaxError('Yield statements may not appear in the top level of a script.');`;

    return createNode(output);
  },
  Statement_expression(node, _) {
    return node.js();
  },
  whitespace(_) {
    return createNode(" ");
  },
  word(_0, _1, _2) {
    return createNode(this.sourceString);
  },
};

semantics.addOperation<Node>("js", actions);

type SMNode = Node;

declare global {
  var story: StorymaticGrammar;
  var toAST: (text: string) => {};
  var match: (text: string) => ohm.MatchResult;
  var semantics: StorymaticSemantics;
  var js: (text: string) => SMNode;
}

declare module "ohm-js" {
  export interface Node {
    js(): SMNode;
    asIteration(): Node;
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
