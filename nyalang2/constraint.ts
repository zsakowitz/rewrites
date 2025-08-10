import type { BunInspectOptions } from "bun"
import type { Associate } from "./ac"
import type { Ctx } from "./ctx"
import type { FnSignature } from "./fn"
import { INSPECT } from "./inspect"
import type { FnParams } from "./param"

export const enum C {
  Assoc,
  Fn,
}

export interface ConstraintData {
  [C.Assoc]: Associate
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

  matches(ctx: Ctx, params: FnParams): boolean {
    switch (this.k) {
      case C.Fn: {
        const src = this.of as ConstraintData[C.Fn]
        const resolvedArgs = src.args.map((x) => x.with(params))
        const ret = ctx.callTy(src.id, resolvedArgs)
        return ret != null && ctx.root.coerce.can(ret, src.ret, params)
      }
      case C.Assoc: {
        const src = this.of as ConstraintData[C.Assoc]
        for (const ac of ctx.scope.acs(src.id)) {
          const clone = params.clone()
          if (ac.on.eq(src.on, clone)) {
            if (ac.ret.eq(src.ret, clone)) {
              params.copyFrom(clone)
              return true
            }
          }
        }
        return false
      }
    }
  }

  [INSPECT](d: number, p: BunInspectOptions, inspect: typeof Bun.inspect) {
    return inspect(this.of, p)
  }
}
