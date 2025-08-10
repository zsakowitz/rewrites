import type { BunInspectOptions } from "bun"
import type { Coercions } from "./coercion"
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
  #map: Map<Param, Ty | Const>
  #invar: Set<Param>

  constructor(
    readonly ctx: Ctx,
    parent_: ParamsReadonly | null,
  ) {
    if (parent_) {
      const parent = parent_ as Params
      this.#map = new Map(parent.#map)
      this.#invar = new Set(parent.#map.keys())
    } else {
      this.#map = new Map()
      this.#invar = new Set()
    }
  }

  get(key: Param<ParamKind.Ty>): Ty
  get(key: Param<ParamKind.Const>): Const
  get(key: Param): Ty | Const {
    const val = this.#map.get(key)
    if (!val) {
      this.ctx.issue(`Unable to infer value for parameter '${key.label}'.`)
    }

    return val
  }

  setConst(key: Param<ParamKind.Const>, value: Const, params: Params): boolean {
    const existing = this.#map.get(key) as Const | undefined
    if (!existing) {
      this.#map.set(key, value)
      return true
    }

    return value.eqTo(existing, params)
  }

  setTyCoercible(key: Param<ParamKind.Ty>, value: Ty, coercions: Coercions) {
    const existing = this.#map.get(key) as Ty | undefined
    if (!existing) {
      this.#map.set(key, value)
      return true
    }

    const isInvar = this.#invar.has(key)
    if (isInvar) {
      return value.eq(existing, this)
    }

    // TODO: coerce `value` into `existing` or vice versa
    return value.eq(existing, this)
  }

  setTyInvar(key: Param<ParamKind.Ty>, value: Ty) {
    const existing = this.#map.get(key) as Ty | undefined
    if (!existing) {
      this.#map.set(key, value)
      return true
    }

    this.#invar.add(key)

    return value.eq(existing, this)
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

export interface ParamsReadonly extends Pick<Params, "get"> {}
