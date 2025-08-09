import type { Target } from "./target"

export class Block {
  source = ""

  constructor(readonly target: Target) {}
}
