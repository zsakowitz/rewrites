// The README generator for this repo.

import { spawn } from "child_process"
import { readdir, readFile, writeFile } from "fs/promises"

const files = (await readdir(".")).filter(
  (path) => path.endsWith(".js") || path.endsWith(".ts")
)

const bodies = files.map(async (path) => {
  const contents = await readFile(path, { encoding: "utf8" })

  const info = []
  for (const line of contents.split("\n")) {
    if (line.startsWith("//")) {
      info.push(line.slice(2).trim())
    } else break
  }

  const tags = (info.join(" ").match(/#\w+/g) || []).join(" ")
  const body = info.join(" ").replace(/#\w+/g, "").replace(/\s+/g, " ").trim()

  return `**[${path}](./${path})**${tags ? " " + tags : ""}${
    body ? "\n\n" + body : ""
  }`
})

const result = await Promise.all(bodies)

writeFile(
  "./README.md",
  `# zsakowitz/rewrites

This repository contains lots of test projects that I've created. The name is a
relic from its initial creation, when I used it to rewrite the Iterator Helpers
proposal. Now it contains everything from stacks to language parsers to the JS
standard library implemented solely in the TS type system. Enjoy the ${
    bodies.length
  } files
this repository has to offer.

# File listing

${result.join("\n\n<br>\n\n")}
`.trim()
)

spawn("npx", ["prettier", "--write", "."])
