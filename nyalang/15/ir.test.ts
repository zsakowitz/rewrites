import { print } from "./debug"
import { Errors } from "./error"
import { File } from "./file"
import { Root, compileTests, topLevel } from "./ir"
import fileBody from "./ir.test.txt"
import { ParseContext, parseFile } from "./parse"
import { tokenize } from "./token"

const errors = new Errors()

const file = new File("./ir.test.txt", fileBody)
const tokens = tokenize(errors, file)

const parseContext = new ParseContext(errors, tokens)
const body = parseFile(parseContext)

const root = new Root(errors, [])
topLevel(root, file, body)

const tests = compileTests(root)

print({
    errors,
    fn_instances: root.fns,
    tests,
})
