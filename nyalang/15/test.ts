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

const rootMain = new Root(new Errors(), (path) => {
    if (path in sources) {
        return new File("./" + path, sources[path]!)
    }
    return null
})

print({
    result: rootMain.compile("main.nya"),
    errors: rootMain.errors,
    tests: rootMain.tests,
    global_vars: rootMain.globalVars,
    fns: rootMain.fns,
})
