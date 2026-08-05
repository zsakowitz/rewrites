import complex from "./src/complex.zig" with { type: "text" }
import main from "./src/main.zig" with { type: "text" }
import Math from "./src/Math.zig" with { type: "text" }

const sources: Record<string, string> = {
    "complex.nya": complex,
    "main.nya": main,
    "Math.nya": Math,
}

import { print } from "./debug"
import { Errors } from "./error"
import { File } from "./file"
import { Root } from "./ir"

const errors = new Errors()
const root = new Root(errors, (path) => {
    if (path in sources) {
        return new File("./" + path, sources[path]!)
    }
    return null
})
print({
    result: root.compileMain("main.nya"),
    errors: root.errors,
    tests: root.tests,
    global_vars: root.globalVars,
    fns: root.fns,
})
