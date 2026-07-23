import { Errors, printErrors } from "./error"
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

const errors = new Errors()

printTokens(tokenize(errors, new File("test.nya", `2+3.4*2028-09-5`)))

printErrors(errors)
