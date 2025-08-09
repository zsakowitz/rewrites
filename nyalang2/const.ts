import { issue } from "./error"
import type { Pos } from "./pos"
import { Ty } from "./ty"

export class Const {
  constructor(
    readonly value: unknown,
    readonly ty: Ty,
    pos: Pos,
  ) {
    if (ty != Ty.Bool && ty != Ty.Int) {
      issue(`Const parameters must be of type 'bool' or 'int'.`, pos)
    }
  }

  eq(other: Const) {
    // Checking equality via `===` is only allowed because we restrict this to
    // `bool` and `int` types.
    return this.ty === other.ty && this.value === other.value
  }
}
