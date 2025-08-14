import type { BunInspectOptions } from "bun"
import type { FnSignature } from "./fn"
import { INSPECT } from "./inspect"
import type { FnParams } from "./param"

export class Constraint {
  constructor(readonly fn: FnSignature) {}

  matches(params: FnParams): boolean {
    const ctx = params.ctx
    const src = this.fn
    const resolvedArgs = src.args.map((x) => x.with(params))
    const ret = ctx.tryCallTy(src.id, resolvedArgs)
    return ret != null && ctx.root.coerce.can(ret, src.ret, params)
  }

  [INSPECT](d: number, p: BunInspectOptions, inspect: typeof Bun.inspect) {
    return inspect(this.fn, p)
  }
}
