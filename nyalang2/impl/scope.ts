import { Coercions } from "./coercion"
import { Fn, type FnName } from "./fn"
import { ident, type IdGlobal } from "./id"
import { Bool, Int, Num, Ty } from "./ty"

export class Scope {
  readonly #fns = new Map<FnName, Fn[]>()
  readonly #tys = new Map<IdGlobal, Ty>()

  constructor(
    readonly root: ScopeRoot,
    readonly parent: Scope | null,
  ) {}

  fns(id: FnName): Fn[] {
    return this.#fns.get(id) ?? (this.parent ? this.parent.fns(id) : [])
  }

  ty(id: IdGlobal): Ty | null {
    return this.#tys.get(id) ?? (this.parent ? this.parent.ty(id) : null)
  }

  pushFn(fn: Fn) {
    let list = this.#fns.get(fn.id)
    if (!list) {
      list = this.fns(fn.id).slice()
      this.#fns.set(fn.id, list)
    }

    list.push(fn)
  }

  setTy(id: IdGlobal, ty: Ty) {
    this.#tys.set(id, ty)
  }
}

export class ScopeRoot extends Scope {
  readonly coerce = new Coercions()

  constructor() {
    super(null!, null)
    ;(this as any).root = this
    this.setTy(ident("bool"), Bool)
    this.setTy(ident("int"), Int)
    this.setTy(ident("num"), Num)
  }
}
