import { Coercions } from "./coercion"
import { Fn, type FnName } from "./fn"
import { ident, type IdGlobal } from "./id"
import { Bool, Int, Num, Ty } from "./ty"

export class Scope {
  readonly #fns = new Map<FnName, Fn[]>()

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
}

export class ScopeRoot extends Scope {
  readonly types = new Map<IdGlobal, Ty>()
  readonly coerce = new Coercions()

  constructor() {
    super(null!, null)
    ;(this as any).root = this
    this.types.set(ident("bool"), Bool)
    this.types.set(ident("int"), Int)
    this.types.set(ident("num"), Num)
  }
}
