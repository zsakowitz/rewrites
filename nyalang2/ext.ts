import { Block } from "./block"
import { Ctx } from "./ctx"
import { Params } from "./param"
import { Pos } from "./pos"
import type { ScopeRoot } from "./scope"
import type { Target } from "./target"

export class Env<SymTag> {
  constructor(
    readonly target: Target<SymTag>,
    readonly root: ScopeRoot,
  ) {}

  ctx(tag?: string) {
    const params = new Params(null!, null)
    const ctx = new Ctx(
      new Block(this.target, this.root, params),
      Pos.native(tag),
    )
    ;(params as any).ctx = ctx
    return ctx
  }
}
