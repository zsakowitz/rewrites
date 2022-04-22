import ohm from "ohm-js";
import extras from "ohm-js/extras/index.js";
import story from "./story.ohm-bundle.js";

globalThis.story = story;
globalThis.toAST = (text: string) => extras.toAST(story.match(text));

declare global {
  var story: ohm.Grammar;
  var toAST: any;
}
