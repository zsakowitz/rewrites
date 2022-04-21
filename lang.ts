import ohm from "ohm-js";
import extras from "ohm-js/extras/index.js";
import { readFileSync } from "fs";

let lang = readFileSync("../lang.ohm", "utf8");
globalThis.story = ohm.grammar(lang);
globalThis.toAST = (text: string) => extras.toAST(story.match(text));

declare global {
  var story: ohm.Grammar;
  var toAST: any;
}
