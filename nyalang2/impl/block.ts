import type { Scope } from "./scope"
import type { Target } from "./target"

export class Block<SymTag = unknown> {
    source = ""

    constructor(
        readonly target: Target<SymTag>,
        readonly scope: Scope,
    ) {}
}
