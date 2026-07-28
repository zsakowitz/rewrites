import { Block, expr } from "./compile"
import { print } from "./debug"
import { Errors } from "./error"
import { File } from "./file"
import { ParseContext, parseExpr } from "./parse"
import fileBody from "./parse.test.txt"
import { tokenize } from "./token"

const errors = new Errors()

const file = new File("./parse.test.txt", fileBody)
const tokens = tokenize(errors, file)

const context = new ParseContext(errors, tokens)
const body = parseExpr(context)

const block = new Block(errors, file, Object.create(null))
const value = expr(block, "any", null, body)

print({ errors, ast: body, block: { body: block.body, context: block.context }, value })
