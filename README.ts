// The README generator for this repo.

import { spawn } from "child_process"
import glob from "fast-glob"
import { readFile, writeFile } from "fs/promises"
import { shuffle } from "./shuffle"

function sortFilenames(files: string[]) {
  return shuffle(files)
    .sort()
    .map((x) => x.split("/"))
    .sort(function sorter(a, b): number {
      if (a.length == b.length) {
        return 0
      }

      if (a.length == 1) {
        return -1
      }

      if (b.length == 1) {
        return 1
      }

      if (a.length == 2 && b.length == 3) {
        if (a[0] == b[0]) {
          return -1
        }

        return a[0]! < b[0]! ? -1 : 1
      }

      if (b.length == 2 && a.length == 3) {
        if (b[0] == a[0]) {
          return 1
        }

        return b[0]! < a[0]! ? 1 : -1
      }

      throw new Error(
        `Encountered unexpected file path lengths (${a.length} and ${
          b.length
        }) belonging to files ${a.join("/")} and ${b.join(
          "/"
        )}. Update 'sortFilenames' in README.md, or restructure your files to have a maximum nesting depth of 3.`
      )
    })
    .map((x) => x.join("/"))
}

const files = await glob(["**/*.js", "**/*.ts", "**/*.tsx"], {
  ignore: ["dist", "node_modules"],
})

const bodies = sortFilenames(files).map(async (path) => {
  const contents = await readFile(path, { encoding: "utf8" })

  const info = []
  for (const line of contents.split("\n")) {
    if (line.startsWith("//")) {
      info.push(line.slice(2).trim())
    } else break
  }

  if (info.length == 0) {
    console.log("no info for:", path)
  }

  const tags = (info.join(" ").match(/#[\w:]+/g) || [])
    .map((tag) => tag.slice(1))
    .join(", ")

  if (tags.includes("::exclude")) {
    return ""
  }

  if (tags.includes("::")) {
    console.log(`unknown pragma '${tags}' in: ${path}`)
  }

  const body = info.join(" ").replace(/#\w+/g, "").replace(/\s+/g, " ").trim()

  return `**[${path}](./${path})**${tags ? " (" + tags + ")" : ""}${
    body ? ": " + body : ""
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

${result.join("\n\n")}
`.trim()
)

spawn("npx", ["prettier", "--write", "./README.md"])
