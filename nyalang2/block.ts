import type { Scope } from "./scope"
import type { Target } from "./target"

export class Block {
  source = ""

  constructor(
    readonly target: Target,
    readonly scope: Scope,
  ) {}
}
