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
}

interface PartialNode extends Partial<Node> {
  output: string;
}

function createNode(options: string | PartialNode, ...parents: Node[]): Node {
  // The type assertion here ensures that the `options` node is included as a standard node.
  if (typeof options == "object") {
    parents.push(options as any);
  } else {
    parents.push({ output: options, scopedVariables: [] } as any);
  }

  return {
    output: typeof options == "string" ? options : options.output,
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
    return createNode(`${a.output} + ${b.output}`, a, b);
  },
  AddExp_subtraction(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return createNode(`${a.output} - ${b.output}`, a, b);
  },
  decimalNumber(a, b, c, d, e, f, g) {
    return createNode(this.sourceString);
  },
  LiteralExp_parenthesized(_0, node, _1) {
    let js = node.js();
    return createNode(`(${js.output})`, js);
  },
  NotExp_await(_0, _1, node) {
    let js = node.js();
    return createNode({ output: `await ${js.output}`, isAsync: true }, js);
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

    return createNode(output);
  },
  Statement_expression(node, _) {
    return node.js();
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
