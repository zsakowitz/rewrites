import type { BunInspectOptions } from "bun"
import type { Constraint } from "./constraint"
import type { Ctx } from "./ctx"
import type { IdGlobal } from "./id"
import { INSPECT } from "./inspect"
import { type FnParamsTempl, type Param } from "./param"
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

  [INSPECT](d: number, p: BunInspectOptions, inspect: typeof Bun.inspect) {
    return (
      `fn ${this.id.label}(${this.args.map((x) => inspect(x, p))}) -> ${inspect(this.ret, p)}`
      + (this.where.length ?
        ` where ` + this.where.map((x) => inspect(x, p)).join(", ")
      : "")
    )
  }
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

  [INSPECT](d: number, p: BunInspectOptions, inspect: typeof Bun.inspect) {
    const head = `fn ${this.id.label}${
      this.params.map.size ?
        `<${Array.from(this.params.map).map(([, v]) => inspect(v, p))}>`
      : ""
    }(${this.argn.map((x, i) => `${x.label}: ${inspect(this.args[i]!, p)}`)}) -> ${inspect(this.ret, p)}`
    if (!this.where.length) {
      return head
    }
    const where = this.where.map((x) => inspect(x, p))
    return (
      head
      + "\n  where "
      + where[0]!
      + where
        .slice(1)
        .map((x) => `\n        ${x}`)
        .join("")
    )
  }
}
