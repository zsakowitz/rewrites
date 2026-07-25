import fileBody from "./parse.test.txt"
import { print } from "../debug"
import { Errors, printErrors } from "./error"
import { File } from "./file"
import { ParseContext, parseFile } from "./parse"
import { tokenize } from "./token"

const errors = new Errors()

const file = new File("parse.test.txt", fileBody)

const tokens = tokenize(errors, file)

const context = new ParseContext(errors, tokens)

const decls = parseFile(context)

print(decls)

printErrors(errors)
