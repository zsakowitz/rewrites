import { Coercions } from "./coercion"
import { Fn } from "./fn"
import { ident, type IdGlobal } from "./id"
import { IdMap } from "./map"
import { Ty } from "./ty"

export class Scope {
  readonly #fns = new IdMap<Fn[]>()

  constructor(
    readonly root: ScopeRoot,
    readonly parent: Scope | null,
  ) {}

  fns(id: IdGlobal): Fn[] {
    return this.#fns.get(id) ?? (this.parent ? this.parent.fns(id) : [])
  }

  pushFn(id: IdGlobal, fn: Fn<any>) {
    let list = this.#fns.get(id)
    if (!list) {
      list = this.fns(id).slice()
      this.#fns.set(id, list)
    }

    list.push(fn)
  }
}

export class ScopeRoot extends Scope {
  readonly types = new IdMap<Ty>()
  readonly coerce = new Coercions()

  constructor() {
    super(null!, null)
    ;(this as any).root = this
    this.types.set(ident("bool"), Ty.Bool)
    this.types.set(ident("int"), Ty.Int)
    this.types.set(ident("num"), Ty.Num)
  }
}
