import { print } from "./debug"
import { Errors } from "./error"
import { File } from "./file"
import { Root, compileTests, topLevel } from "./ir"
import body from "./ir.test.zig" with { type: "text" }
import { ParseContext, parseFile } from "./parse"
import { tokenize } from "./token"

const errors = new Errors()

const file = new File("./ir.test.zig", body)
const tokens = tokenize(errors, file)

const parseContext = new ParseContext(errors, tokens)
const decls = parseFile(parseContext)

const root = new Root(errors, [])
topLevel(root, file, decls)

const tests = compileTests(root)

print({
    errors,
    fn_instances: root.fns,
    tests,
})
