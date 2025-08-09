import type { Ty } from "./ty"

export class Val {
  readonly const: boolean

  // value is `string` for code, `null` for void things (e.g. glsl has no text for things which are `void`)
  constructor(value: string | null, ty: Ty, isConst: false)

  // value can be anything
  constructor(value: unknown, ty: Ty, isConst: true)

  constructor(
    readonly value: unknown,
    readonly ty: Ty,
    isConst: boolean,
  ) {
    this.const = isConst
  }
}
