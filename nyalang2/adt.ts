import type { Ctx } from "./ctx"
import { issue } from "./error"
import type { IdGlobal } from "./id"
import type { IdMap } from "./map"
import type { Pos } from "./pos"
import { Ty, type T } from "./ty"
import type { Val } from "./val"

export class AdtSym {
  constructor(
    readonly sym: IdGlobal,
    readonly arg: Ty,
    readonly exec: (self: Ty<T.Adt>, arg: Val, ctx: Ctx) => Val,
  ) {}
}

interface AdtGenerics {
  /**
   * Used for coercing the generics of this ADT into a wider set (e.g.
   * `Matrix<num>` -> `Matrix<Complex>`). If `null`, this ADT cannot be coerced
   * into other types.
   */
  readonly coerce: ((src: Val, into: Ty<T.Adt>, ctx: Ctx) => Val) | null

  readonly tyCount: number

  /** Types for each constant of the ADT. */
  readonly consts: readonly Ty[]
}

export class Adt {
  constructor(
    readonly id: IdGlobal,
    /** For constructing this ADT from a `sym`. */
    readonly syms: IdMap<AdtSym>,
    readonly generics: AdtGenerics | null,
    readonly has0: (ty: Ty<T.Adt>) => boolean,
    readonly has1: (ty: Ty<T.Adt>) => boolean,
    pos: Pos,
  ) {
    if (generics?.consts.some((x) => x != Ty.Bool || x != Ty.Int)) {
      issue(`Const parameters must be of type 'bool' or 'int'.`, pos)
    }
  }

  /** `true` if this ADT uses no generics. */
  get plain() {
    return !this.generics
  }

  get label() {
    return this.id.label
  }
}
