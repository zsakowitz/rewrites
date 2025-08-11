import type { BunInspectOptions } from "bun"
import * as ANSI from "./ansi"
import type { Ctx } from "./ctx"
import { issue } from "./error"
import { INSPECT } from "./inspect"
import type { FnParams } from "./param"
import type { Pos } from "./pos"
import type { T, Ty } from "./ty"

export class ValString {
  constructor(readonly value: string) {}

  toString() {
    return this.value
  }

  ty<K extends T>(ty: Ty<K>): Val<K> {
    return new Val(this.value, ty, false)
  }

  [INSPECT](d: number, p: BunInspectOptions, i: typeof Bun.inspect) {
    return `ValString ` + i(this.value, p)
  }
}

export class Val<K extends T = T, V = unknown> {
  static unit<K extends T>(ty: Ty<K>, pos: Pos) {
    if (!ty.has1) {
      issue(`Bug: 'Val.unit' not allowed for non-unit type '${ty}'.`, pos)
    }
    return new Val(null, ty, true)
  }

  readonly const: boolean

  constructor(
    readonly value: V,
    readonly ty: Ty<K>,
    isConst: boolean,
  ) {
    this.const = isConst
  }

  /**
   * Transmutes this value into a value with a different type, but the same
   * script representation. Note that transmutes are only valid for:
   *
   * - `:sym(el) -> el` if `:sym` is a single known symbol
   * - `el -> :sym(el)` if `:sym` is a single known symbol
   * - `A -> B` if `A` and `B` are variable-size arrays with elements of 'has1'
   * - `?A -> ?B` if `A` and `B` are both has0 or both has1
   * - `A -> B` if `A` and `B` are both has0 or both has1
   */
  transmute<K extends T>(ty: Ty<K>) {
    return new Val(this.value, ty, this.const)
  }

  coerce(ctx: Ctx, into: Ty, params: FnParams | null) {
    return ctx.root.coerce.map(ctx, this, into, params)
  }

  runtime(ctx: Ctx) {
    return ctx.target.x(ctx, this)
  }

  toString() {
    return `${this.value}::${this.ty}`
  }

  [INSPECT](_: unknown, p: BunInspectOptions, inspect: typeof Bun.inspect) {
    return `${inspect(this.value, p)} ${ANSI.dim}::${ANSI.reset} ${inspect(this.ty, p)}`
  }
}

export type UntypedVal = Omit<Val, "ty">
