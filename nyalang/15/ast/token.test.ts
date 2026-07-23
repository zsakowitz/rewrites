import { E, Error, Errors } from "./error"
import { File } from "./file"
import { T, tokenize, type Tokens } from "./token"

function printTokens(tokens: Tokens) {
    for (let i = 0; i < tokens.kind.length; i++) {
        const kind = tokens.kind[i]!
        const start = tokens.start[i]!
        const end = tokens.end[i]!

        console.log(
            `${T[kind].padEnd(15)} ${tokens.file.body.slice(start, end).padEnd(15)} ${start}..${end}`,
        )
    }
}

function printError(error: Error) {
    console.log(`error: ${E[error.code]}`)
    for (const el of error.trace) {
        console.log(`    ${el.message} @ ${el.start}..${el.end}`)
    }
}

const e = new Errors()

printTokens(tokenize(e, new File("test.nya", `2+3.4*2028-09-5`)))

e.errors.forEach(printError)
