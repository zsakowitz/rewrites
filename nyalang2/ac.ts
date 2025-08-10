import type { IdGlobal } from "./id"
import type { Ty } from "./ty"

/** Commonly abbreviated as `Ac`. */
export class Associate {
  constructor(
    readonly id: IdGlobal,
    readonly on: Ty,
    readonly ret: Ty,
  ) {}
}
