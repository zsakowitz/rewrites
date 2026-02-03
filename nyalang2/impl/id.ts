import * as ANSI from "../ansi"
import { INSPECT } from "./inspect"

let nextId = 32 // first few are reserved for builtin types

const L = "Id" + ANSI.dim + "(" + ANSI.reset
const H = ANSI.reset + ANSI.dim + "#" + ANSI.reset
const R = ANSI.reset + ANSI.dim + ")" + ANSI.reset

export class Id {
    readonly index = nextId++
    readonly ident

    constructor() {
        this.ident = `_Q` + this.index.toString(36)
    }

    private toString() {
        throw new Error(
            `Use 'Id.index', 'Id.ident', or 'IdLabeled.label' instead of implicit '.toString()' to extract a value from an 'Id'.`,
        )
    }

    [INSPECT]() {
        return L + H + ANSI.yellow + this.index + R
    }
}

export class IdLabeled extends Id {
    declare private __brand
    readonly label: string
    private readonly labelRaw: string

    constructor(label: string) {
        super()
        this.labelRaw = label
        this.label =
            /^_?[A-Za-z]\w*$/.test(label) ? label : JSON.stringify(label)
    }

    [INSPECT]() {
        return L + ANSI.green + this.label + H + ANSI.yellow + this.index + R
    }
}

class IdGlobal extends IdLabeled {
    declare private __brand2
}

export type { IdGlobal }

const IDENTS = new Map<string, IdGlobal>()
export function ident(name: string) {
    let x
    return (
        IDENTS.get(name) ?? ((x = new IdGlobal(name)), IDENTS.set(name, x), x)
    )
}
