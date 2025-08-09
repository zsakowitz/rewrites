import type { BunInspectOptions } from "bun"
import { ANSI } from "./ansi"
import { INSPECT } from "./inspect"
import type { T, Ty } from "./ty"

export class ValString {
  constructor(readonly value: string) {}

  toString() {
    return this.value
  }

  ty<K extends T>(ty: Ty<K>): Val<K> {
    return new Val(this.value, ty, false)
  }
}

export class Val<K extends T = T> {
  readonly const: boolean

  constructor(
    readonly value: unknown,
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
   */
  transmute<K extends T>(ty: Ty<K>) {
    return new Val(this.value, ty, this.const)
  }

  [INSPECT](_: unknown, p: BunInspectOptions, inspect: typeof Bun.inspect) {
    return `${inspect(this.value, p)} ${ANSI.dim}::${ANSI.reset} ${inspect(this.ty, p)}`
  }
}
