import type { T, Ty } from "./ty"

export class Val<K extends T = T> {
  readonly const: boolean

  // value is `string` for code, `null` for void things (e.g. glsl has no text for things which are `void`)
  constructor(value: string | null, ty: Ty<K>, isConst: false)

  // value can be anything
  constructor(value: unknown, ty: Ty<K>, isConst: true)

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
  transmute(ty: Ty) {
    return new Val(this.value, ty, this.const as any)
  }
}
