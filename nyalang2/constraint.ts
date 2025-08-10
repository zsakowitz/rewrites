import type { FnSignature } from "./fn"
import type { IdGlobal } from "./id"
import type { Param } from "./param"

export const enum C {
  AssociatedType,
  Fn,
}

export interface ConstraintData {
  [C.AssociatedType]: { name: IdGlobal; param: Param }
  [C.Fn]: FnSignature
}

export class Constraint<K extends C = C> {
  constructor(
    readonly k: K,
    readonly of: ConstraintData[K],
  ) {}

  is<L extends K>(k: L): this is Constraint<L> {
    return this.k == (k as any as K)
  }
}
