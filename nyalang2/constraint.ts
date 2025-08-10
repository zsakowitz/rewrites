import type { AssociateSignature } from "./ac"
import type { FnSignature } from "./fn"

export const enum C {
  Assoc,
  Fn,
}

export interface ConstraintData {
  [C.Assoc]: AssociateSignature
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
