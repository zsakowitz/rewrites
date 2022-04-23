import ohm from "ohm-js";
import extras from "ohm-js/extras/index.js";
import story, {
  StorymaticGrammar,
  StorymaticSemantics,
} from "./story.ohm-bundle.js";

globalThis.story = story;
globalThis.toAST = (text: string) => extras.toAST(story.match(text));

globalThis.semantics = story.createSemantics();
semantics.addOperation("javascript", {});

declare global {
  var story: StorymaticGrammar;
  var toAST: (text: string) => {};
  var semantics: StorymaticSemantics;
}
