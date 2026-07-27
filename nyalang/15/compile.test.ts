import { Block, expr } from "./compile"
import { Errors, printErrors } from "./error"
import { File } from "./file"

const errors = new Errors()

const file = new File("test.nya", "34")

const block = new Block(errors, file, Object.create(null))

const rtv = expr(block, "any", false, { k: "u", v: 3 }, { k: "lit-int", s: 0, e: 2, v: 34n })

console.log(rtv)

printErrors(errors)
