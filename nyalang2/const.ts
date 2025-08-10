import type * as Bun from "bun"
import type { BunInspectOptions } from "bun"
import { INSPECT } from "./inspect"
import { Param, type ParamKind, type Params } from "./param"
import { Ty, type T } from "./ty"

type ConstVal<K extends T.Bool | T.Int> =
  | (K extends T.Bool ? boolean : never)
  | (K extends T.Int ? number : never)
  | Param<ParamKind.Const>

export class Const<
  K extends T.Bool | T.Int = T.Bool | T.Int,
  V extends ConstVal<K> = ConstVal<K>,
> {
  constructor(
    readonly value: V,
    readonly ty: Ty<K>,
  ) {}

  /**
   * If this returns `true`, `this` can be assigned to `other` under `params`.
   * The converse might not be true: `0.eqTo(T)`, but `!T.eqTo(0)` for generic
   * `T`.
   */
  eqTo(other: Const, params: Params) {
    if (this.ty !== other.ty) {
      return false
    }

    return (
      this.value === other.value
      || (other.value instanceof Param
        && params.setConst(other.value, this, params))
    )
  }

  /**
   * If this returns `true`, `this <= other`. The converse is not true, since `T
   * <= U` cannot be proven in general for generics `T` and `U`.
   */
  leTo(this: Const, other: Const, params: Params) {
    return (
      this.eqTo(other, params)
      || (typeof this.value == "number"
        && typeof other.value == "number"
        && this.value <= other.value)
    )
  }

  is0(this: Const<T.Int>) {
    return this.value === 0
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
