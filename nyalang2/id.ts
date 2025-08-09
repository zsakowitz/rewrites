let nextId = 32 // first few are reserved for builtin types

export class Id {
  readonly id = nextId++
  readonly ident

  constructor() {
    this.ident = `_Q` + this.id.toString(36)
  }
}

class IdGlobal extends Id {
  readonly label: string

  constructor(label: string) {
    super()
    this.label = /^_?[A-Za-z]\w*$/.test(label) ? label : JSON.stringify(label)
  }

  private toString() {
    throw new Error(
      `Use 'IdGlobal.label' or 'IdGlobal.ident' instead of implicit '.toString()'.`,
    )
  }
}

export type { IdGlobal }

const IDENTS = new Map<string, IdGlobal>()
export function ident(name: string) {
  let x
  return IDENTS.get(name) ?? ((x = new IdGlobal(name)), IDENTS.set(name, x), x)
}
