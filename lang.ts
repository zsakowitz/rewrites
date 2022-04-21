import ohm from "ohm-js";
import { readFileSync } from "fs";

let lang = readFileSync("../lang.ohm", "utf8");
globalThis.lang = ohm.grammar(lang);

declare global {
  var lang: ohm.Grammar;
}
