import { Errors, printErrors } from "./error"
import { File } from "./file"
import fileBody from "./parse.test.txt"
import { T, tokenize, type Tokens } from "./token"

function printTokens(tokens: Tokens) {
    for (let i = 0; i < tokens.length; i++) {
        const kind = tokens.kind[i]!
        const start = tokens.start[i]!
        const end = tokens.end[i]!

        console.log(
            `${T[kind].padEnd(15)} ${tokens.file.body.slice(start, end).padEnd(15)} ${start}..${end}`,
        )
    }
}

const errors = new Errors()

const tokens = tokenize(errors, new File("parse.test.txt", fileBody))

console.log(tokens)

printTokens(tokens)

printErrors(errors)
