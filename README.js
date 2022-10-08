// The README generator for this repo.

import * as fs from "fs/promises";

let files = await fs.readdir(".");
files = files.filter((path) => path.endsWith(".js") || path.endsWith(".ts"));

const bodies = files.map(async (path) => {
  const contents = await fs.readFile(path, { encoding: "utf8" });

  let info = [];
  for (const line of contents.split("\n")) {
    if (line.startsWith("//")) {
      info.push(line.slice(2).trim());
    } else break;
  }

  let tags = [];
  tags = (info.join(" ").match(/#\w+/g) || []).join(" ");

  let body = info.join(" ").replace(/#\w+/g, "").replace(/\s+/g, " ").trim();

  return `**[${path}](./${path})** ${tags}

${body}`;
});

const result = await Promise.all(bodies);

fs.writeFile(
  "./README.md",
  `# zsakowitz/rewrites

This repository contains lots of test projects that I've created. The name is a
relic of its initial creation, because I used it to rewrite the Iterator Helpers
library. Now it contains everything from stacks to language parsers to arithmetic
in the TS type system. Enjoy the ${
    bodies.length
  } files this repository has to offer.

# File listing

${result.join("\n\n<br>\n\n")}
`.trim()
);
