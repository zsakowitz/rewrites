import ohm from "ohm-js";
import extras from "ohm-js/extras";
import { readFileSync } from "fs";

let lang = readFileSync("../lang.ohm", "utf8");
globalThis.story = ohm.grammar(lang);
globalThis.toAST = extras.toAST;

declare global {
  var story: ohm.Grammar;
  var toAST: any;
}
