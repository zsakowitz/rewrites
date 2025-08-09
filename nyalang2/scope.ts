import { Coercions } from "./coercion"
import { ident } from "./id"
import { IdMap } from "./map"
import { Ty } from "./ty"

export class Scope {
  constructor(readonly root: ScopeRoot) {}
}

export class ScopeRoot extends Scope {
  readonly types = new IdMap<Ty>()
  readonly coerce = new Coercions()

  constructor() {
    super(null!)
    ;(this as any).root = this
    this.types.set(ident("bool"), Ty.Bool)
    this.types.set(ident("int"), Ty.Int)
    this.types.set(ident("num"), Ty.Num)
  }
}
