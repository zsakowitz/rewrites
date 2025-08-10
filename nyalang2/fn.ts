import type { Constraint } from "./constraint"
import type { Ctx } from "./ctx"
import type { IdGlobal } from "./id"
import type { FnParamsTempl, Param } from "./param"
import type { Ty } from "./ty"
import type { Val } from "./val"

type FnName = IdGlobal | Param

interface FnArg {
  name: IdGlobal
  ty: Ty
}

export class FnSignature {
  constructor(
    readonly id: FnName,
    readonly args: readonly FnArg[],
    readonly ret: Ty,
    readonly where: Constraint[],
  ) {}
}

export class Fn extends FnSignature {
  constructor(
    id: IdGlobal | Param,
    readonly params: FnParamsTempl,
    args: readonly FnArg[],
    ret: Ty,
    where: Constraint[],
    readonly exec: (ctx: Ctx, args: Val[]) => Val,
  ) {
    super(id, args, ret, where)
  }
}
