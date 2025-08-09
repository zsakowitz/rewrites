import type { T, Ty } from "./ty"

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
}
