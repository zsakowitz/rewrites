import type { VarConst, VarTy } from "./coercion"
import type { Ctx } from "./ctx"
import { issue } from "./error"
import type { IdGlobal } from "./id"
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
   * Coerces the generics of this ADT into another set (e.g. `Matrix<num>` ->
   * `Matrix<Complex>`).
   */
  coerce(src: Val, into: Ty<T.Adt>, ctx: Ctx): Val

  readonly tys: readonly VarTy[]
  readonly consts: readonly { ty: Ty; var: VarConst }[]
}

export class Adt {
  constructor(
    readonly id: IdGlobal,
    /** For constructing this ADT from a `sym`. */
    readonly syms: Map<IdGlobal, AdtSym>,
    readonly generics: AdtGenerics | null,
    readonly has0: (ty: Ty<T.Adt>) => boolean,
    readonly has1: (ty: Ty<T.Adt>) => boolean,
    readonly toRuntime: (ctx: Ctx, val: Val<T.Adt>) => string | null,
    pos: Pos,
  ) {
    if (generics?.consts.some((x) => x.ty != Ty.Bool && x.ty != Ty.Int)) {
      issue(`Bug: Const parameters must be of type 'bool' or 'int'.`, pos)
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
