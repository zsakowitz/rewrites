import type { Constraint } from "./constraint"
import type { Ctx } from "./ctx"
import type { IdGlobal } from "./id"
import type { FnParamsTempl, Param } from "./param"
import type { Ty } from "./ty"
import type { Val } from "./val"

export type FnName = IdGlobal | Param

interface FnArg {
  name: IdGlobal
  ty: Ty
}

export class FnSignature {
  constructor(
    readonly id: FnName,
    readonly args: readonly Ty[],
    readonly ret: Ty,
    readonly where: Constraint[],
  ) {}
}

export class Fn extends FnSignature {
  constructor(
    id: IdGlobal | Param,
    readonly params: FnParamsTempl,
    readonly argn: readonly IdGlobal[],
    args: readonly Ty[],
    ret: Ty,
    where: Constraint[],
    readonly exec: (ctx: Ctx, args: Val[]) => Val,
  ) {
    super(id, args, ret, where)
  }
}
