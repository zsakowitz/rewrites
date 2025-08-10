import type { BunInspectOptions } from "bun"
import type { Const } from "./const"
import type { Ctx } from "./ctx"
import { IdLabeled } from "./id"
import { INSPECT } from "./inspect"
import type { Ty } from "./ty"

export const enum ParamKind {
  Ty,
  Const,
}

export class Param<K extends ParamKind = ParamKind> extends IdLabeled {
  declare private __brand3

  constructor(
    label: string,
    readonly kind: K,
  ) {
    super(label)
  }
}

export class Params {
  #map = new Map<Param, Ty | Const>()

  constructor(readonly ctx: Ctx) {}

  get(key: Param<ParamKind.Ty>): Ty
  get(key: Param<ParamKind.Const>): Const
  get(key: Param): Ty | Const {
    const val = this.#map.get(key)
    if (!val) {
      this.ctx.issue(`Unable to infer value for parameter '${key.label}'.`)
    }

    return val
  }

  /**
   * Returns `true` if the given parameter can be set to the given value.
   *
   * This returns `false`, for instance, when called as `.set(T, Bool)` and
   * `.set(T, Int)` (assuming neither coerces into the other).
   */
  set(key: Param<ParamKind.Ty>, value: Ty): boolean
  set(key: Param<ParamKind.Const>, value: Const): boolean
  set(key: Param, value: Ty | Const): boolean {
    const existing = this.#map.get(key)
    if (!existing) {
      this.#map.set(key, value)
      return true
    }

    // TODO: this should actually coerce different Tys into each other, provided
    // they are not part of a non-coercing ADT (so `Matrix<T> + Matrix<T>` works
    // for `Matrix<num>` and `Matrix<Complex>`)
    return value.eq(existing as never)
  }

  [INSPECT](d: number, p: BunInspectOptions, inspect: typeof Bun.inspect) {
    return (
      "Params"
      + inspect(
        new Map(
          this.#map.entries().map(([k, v]) => [
            {
              [INSPECT]() {
                return k.label
              },
            },
            v,
          ]),
        ),
      ).slice(3)
    )
  }
}
