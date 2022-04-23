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
  output: string;
  scopedVariables: string[];
  isAsync: boolean;
  isGenerator: boolean;
}

interface PartialNode extends Partial<Node> {
  output: string;
}

function createNode(options: string | PartialNode, ...parents: Node[]): Node {
  if (typeof options == "object") parents.push(options as any);
  else parents.push({ output: options } as any);

  return parents.reduce<Node>(
    (a, b) => ({
      output: b.output ?? a.output,
      isAsync: a.isAsync || b.isAsync,
      isGenerator: a.isGenerator || b.isGenerator,
      scopedVariables: a.scopedVariables.concat(b.scopedVariables),
    }),
    {
      output: "",
      isAsync: false,
      isGenerator: false,
      scopedVariables: [],
    }
  );
}

function createNodes(...nodes: ohm.Node[]) {
  return nodes.map((e) => e.js());
}

let actions: StorymaticActionDict<Node> = {
  _terminal() {
    return createNode(this.sourceString);
  },
  _iter(...children) {
    let output = children.map((value) => value.js());
    return createNode(output.map((e) => e.output).join(""), ...output);
  },

  AddExp_addition(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return createNode(`${a} + ${b}`, a, b);
  },
  AddExp_subtraction(nodeA, _, nodeB) {
    let [a, b] = createNodes(nodeA, nodeB);
    return createNode(`${a} + ${b}`, a, b);
  },
  number(node) {
    return createNode(node.sourceString);
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
