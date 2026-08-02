import { print } from "./debug"
import { Errors } from "./error"
import { File } from "./file"
import { EvaluationContext, expr, Items, NamespaceContext, RootContext } from "./ir"
import fileBody from "./ir.test.txt"
import { ParseContext, parseExpr } from "./parse"
import { tokenize } from "./token"

const errors = new Errors()

const file = new File("./ir.test.txt", fileBody)
const tokens = tokenize(errors, file)

const parseContext = new ParseContext(errors, tokens)
const body = parseExpr(parseContext)
if (parseContext.index !== tokens.length) {
    parseContext.raise("Expected end of expression")
}

const root = new RootContext(errors)
const ns = new NamespaceContext(root, file, { k: "never", v: null }, new Items(null))
const ev = new EvaluationContext(ns, [], new Map(), new Map(), null)
const ret = expr(ev, false, null, body)

print({ errors, body: ev.runtime, ret })
