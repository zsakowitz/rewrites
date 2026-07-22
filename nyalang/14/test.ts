import { tokenize } from "./ast/token"
import { printErrors, printTokens } from "./debug"
import { Errors } from "./error"
import { File } from "./ast/span"

const e = new Errors()

const file = new File(
    "source.nya",
    `fn hi() {
    world + 2 * .{re: 2, im: 4}.world(hi: .bye)

    if (23 != 45 ~ 8) {
        .world(23, [4, 8, 9])
    }
}
`,
)

const tokens = tokenize(e, file)

console.log(printTokens(tokens))
console.log(printErrors(e))
