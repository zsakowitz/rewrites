import type { Associate } from "./ac"
import { Coercions } from "./coercion"
import { Fn, type FnName } from "./fn"
import { ident, type IdGlobal } from "./id"
import { Ty } from "./ty"

export class Scope {
  readonly #fns = new Map<FnName, Fn[]>()
  readonly #acs = new Map<IdGlobal, Associate[]>()

  constructor(
    readonly root: ScopeRoot,
    readonly parent: Scope | null,
  ) {}

  fns(id: FnName): Fn[] {
    return this.#fns.get(id) ?? (this.parent ? this.parent.fns(id) : [])
  }

  pushFn(fn: Fn) {
    let list = this.#fns.get(fn.id)
    if (!list) {
      list = this.fns(fn.id).slice()
      this.#fns.set(fn.id, list)
    }

    list.push(fn)
  }

  acs(id: IdGlobal): Associate[] {
    return this.#acs.get(id) ?? (this.parent ? this.parent.acs(id) : [])
  }

  ac(id: IdGlobal, on: Ty): Ty | null {
    return this.acs(id).find((x) => x.on.eq(on, null))?.ret ?? null
  }

  pushAc(ac: Associate) {
    let list = this.#acs.get(ac.id)
    if (!list) {
      list = this.acs(ac.id).slice()
      this.#acs.set(ac.id, list)
    }

    list.push(ac)
  }
}

export class ScopeRoot extends Scope {
  readonly types = new Map<IdGlobal, Ty>()
  readonly coerce = new Coercions()

  constructor() {
    super(null!, null)
    ;(this as any).root = this
    this.types.set(ident("bool"), Ty.Bool)
    this.types.set(ident("int"), Ty.Int)
    this.types.set(ident("num"), Ty.Num)
  }
}
