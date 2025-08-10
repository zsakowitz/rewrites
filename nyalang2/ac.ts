import type { BunInspectOptions } from "bun"
import type { IdGlobal } from "./id"
import { INSPECT } from "./inspect"
import type { Ty } from "./ty"

/** Commonly abbreviated as `Ac`. */
export class Associate {
  constructor(
    readonly id: IdGlobal,
    readonly on: Ty,
    readonly ret: Ty,
  ) {}

  [INSPECT](d: number, p: BunInspectOptions, inspect: typeof Bun.inspect) {
    return `(${inspect(this.on, p)})::${this.id.label} = ${inspect(this.ret, p)}`
  }
}
