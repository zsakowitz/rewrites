import type { BunInspectOptions } from "bun"
import { Var } from "./coercion"
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

export class FnParam {
  constructor(
    readonly key: Param,
    readonly vrx: Var,
    readonly ty: Ty | null,
  ) {}

  [INSPECT](d: number, p: BunInspectOptions, inspect: typeof Bun.inspect) {
    return (
      (this.vrx == Var.Invar ? "=" : "~")
      + (this.key.kind == ParamKind.Const ? "const " : "")
      + this.key.label
      + (this.ty ? ": " + inspect(this.ty, p) : "")
    )
  }
}

export class FnParamsTempl {
  readonly map = new Map<Param, FnParam>()

  set(param: Param<ParamKind.Ty>, vrx: Var): this
  set(param: Param<ParamKind.Const>, vrx: Var, ty: Ty): this
  set(param: Param, vrx: Var, ty?: Ty) {
    this.map.set(param, new FnParam(param, vrx, ty ?? null))
    return this
  }

  within(ctx: Ctx) {
    return FnParams.from(ctx, this)
  }
}

export class FnParams {
  static from(ctx: Ctx, templ: FnParamsTempl) {
    const self = new FnParams(ctx)
    for (const [k, v] of templ.map) {
      self.#map.set(k, { param: v, val: null })
    }
    return self
  }

  #map = new Map<Param, { param: FnParam; val: Ty | Const | null }>()

  private constructor(readonly ctx: Ctx) {}

  has(param: Param): boolean {
    return this.#map.has(param)
  }

  tryGet(param: Param<ParamKind.Ty>): Ty | null
  tryGet(param: Param<ParamKind.Const>): Const | null
  tryGet(param: Param): Ty | Const | null {
    return this.#map.get(param)!.val
  }

  get(param: Param<ParamKind.Ty>): Ty
  get(param: Param<ParamKind.Const>): Const
  get(param: Param): Ty | Const {
    const v = this.#map.get(param)?.val
    if (!v) {
      this.ctx.issue(`Unable to resolve type of parameter '${param.label}'.`)
    }
    return v
  }

  setConst(param: Param<ParamKind.Const>, val: Const): boolean {
    const entry = this.#map.get(param)
    if (!entry) {
      return false
    }

    if (entry.val) {
      return (entry.val as Const).eqTo(val, this)
    } else {
      entry.val = val
      return true
    }
  }

  setTy(param: Param<ParamKind.Ty>, val: Ty, variance: Var): boolean {
    const entry = this.#map.get(param)
    if (!entry) {
      return false
    }

    if (entry.val) {
      // TODO: if `variance` is `Var.Coercible`, coerce types into each other
      return (entry.val as Ty).eq(val, this)
    } else {
      entry.val = val
      return true
    }
  }

  clone() {
    const self = new FnParams(this.ctx)
    for (const [k, v] of this.#map) {
      self.#map.set(k, { param: v.param, val: v.val })
    }
    return self
  }

  /** `other` should be considered unusable after being copied from. */
  copyFrom(other: FnParams) {
    this.#map = other.#map
  }

  [INSPECT](d: number, p: BunInspectOptions, inspect: typeof Bun.inspect) {
    return `FnParams { ${Array.from(this.#map)
      .map(([, v]) => inspect(v.param, p) + " => " + inspect(v.val, p))
      .join(", ")} }`
  }
}
