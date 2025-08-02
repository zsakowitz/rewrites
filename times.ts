// Sets each file's "last updated" timestamp to its creation timestamp.

import { readdir, utimes } from "node:fs/promises"
import { ANSI } from "./ansi"

for (const file of await readdir(".", { withFileTypes: true })) {
  if (file.isFile() && !file.name.startsWith(".")) {
    const { name } = file
    const stat = await Bun.file(name).stat()
    if (stat.birthtimeMs != stat.atimeMs || stat.birthtimeMs != stat.mtimeMs) {
      await utimes(name, stat.birthtime, stat.birthtime)
      console.log("⏳ " + ANSI.blue + name + ANSI.reset)
    } else {
      console.log(ANSI.dim + "✅ " + name + ANSI.reset)
    }
  }
}
