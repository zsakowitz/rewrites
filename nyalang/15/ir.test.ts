import { print } from "./debug"
import { Errors } from "./error"
import { File } from "./file"
import { Block, expr } from "./ir"
import fileBody from "./ir.test.txt"
import { ParseContext, parseExpr } from "./parse"
import { tokenize } from "./token"

const errors = new Errors()

const file = new File("./ir.test.txt", fileBody)
const tokens = tokenize(errors, file)

const context = new ParseContext(errors, tokens)
const body = parseExpr(context)
if (context.index !== tokens.length) {
    context.raise("Expected end of expression")
}

const block = new Block(errors, file, Object.create(null))
const ret = expr(block, "any", null, body)

print({ errors, block: { body: block.body, context: block.names }, ret })
