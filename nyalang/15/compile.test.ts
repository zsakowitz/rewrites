import { Errors, printErrors } from "./ast/error"
import { File } from "./ast/file"
import { Block, expr } from "./compile"

const errors = new Errors()

const file = new File("test.nya", "34")

const block = new Block(errors, file, Object.create(null))

const rtv = expr(block, "any", false, { k: "u", v: 3 }, { k: "lit-int", s: 0, e: 2, v: 34n })

console.log(rtv)

printErrors(errors)
