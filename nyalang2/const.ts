import type * as Bun from "bun"
import type { BunInspectOptions } from "bun"
import { issue } from "./error"
import { INSPECT } from "./inspect"
import type { Param } from "./param"
import type { Pos } from "./pos"
import { Ty, type T } from "./ty"

export class Const<K extends T.Bool | T.Int = T.Bool | T.Int> {
  constructor(
    readonly value:
      | (K extends T.Bool ? boolean : never)
      | (K extends T.Int ? number : never)
      | Param,
    readonly ty: Ty<K>,
    pos: Pos,
  ) {
    if (ty != Ty.Bool && ty != Ty.Int) {
      issue(`Const parameters must be of type 'bool' or 'int'.`, pos)
    }
  }

  /**
   * If this returns `true`, the values are equal. The converse is not true,
   * since `T == 0` cannot be proven in general for generic `T`.
   */
  eq(other: Const) {
    return this.ty === other.ty && this.value === other.value
  }

  /**
   * If this returns `true`, `this <= other`. The converse is not true, since `T
   * <= U` cannot be proven in general for generics `T` and `U`.
   */
  le(this: Const<T.Int>, other: Const<T.Int>) {
    const vl = this.value
    const vr = other.value
    return (
      vl == vr || (typeof vl == "number" && typeof vr == "number" && vl <= vr)
    )
  }

  is0(this: Const<T.Int>) {
    return this.value == 0
  }

  toString() {
    if (typeof this.value == "object") {
      return `param ${this.value.label} :: ${this.ty}`
    }
    return `${this.value} :: ${this.ty}`
  }

  [INSPECT](_: unknown, p: BunInspectOptions, inspect: typeof Bun.inspect) {
    if (typeof this.value == "object") {
      return `param ${this.value.label} :: ${this.ty}`
    }
    return `${inspect(this.value, p)} :: ${inspect(this.ty, p)}`
  }
}
