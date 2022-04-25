import { Recoverable, start } from "repl";
import { story, semantics } from "./lang.js";

if (process.argv[2] == "-i" || process.argv.length == 2) {
  console.log("Welcome to the Storymatic compile REPL.");
  console.log("Enter any expression to compile it and output the result.");

  let repl = start({
    prompt: "\n> ",
    eval(cmd, _context, _file, cb) {
      try {
        let match = story.match(cmd);
        if (match.failed()) {
          throw new Recoverable(new Error(match.shortMessage));
        }

        let { output } = semantics(match).js();
        cb(null, output);
      } catch (e) {
        if (e instanceof Error) cb(e, null);
        else cb(new Error("" + e), null);
      }
    },
    writer: (obj) => ("" + obj).trim(),
  });

  repl.defineCommand("clear", () => {
    console.clear();
    console.log("Welcome to the Storymatic compile REPL.");
    console.log("Enter any expression to compile it and output the result.");
    process.stdout.write("\n> ");
  });
}
