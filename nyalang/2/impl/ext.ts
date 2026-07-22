import { Block } from "./block"
import { Ctx } from "./ctx"
import { Pos } from "./pos"
import type { ScopeRoot } from "./scope"
import type { Target } from "./target"

export class Env<SymTag> {
    constructor(
        readonly target: Target<SymTag>,
        readonly root: ScopeRoot,
    ) {}

    ctx(tag?: string) {
        return new Ctx(new Block(this.target, this.root), Pos.native(tag))
    }
}
