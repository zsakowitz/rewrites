import type { Color } from "./render/colors.js"

export type StatementShape = "block" | "head" | "tail"
export type ExpressionShape = "rect" | "round" | "sharp"
export type Shape = StatementShape | ExpressionShape

export type Script = {
  readonly type: "script"
  readonly blocks: readonly Block[]
}

export type MutableScript = {
  type: "script"
  blocks: Block[]
}

export type Item =
  | number
  | string
  | bigint
  | Block
  | Script
  | {
      readonly type: "field"
      readonly value?: number | string | bigint | undefined
      readonly embedded?: Block | undefined
    }
  | {
      readonly type: "boolean"
      readonly embedded?: Block | undefined
    }
  | {
      readonly type: "dropdown"
      readonly shape?: "rect" | "round" | undefined
      readonly value?: number | string | bigint | undefined
      readonly embedded?: Block | undefined
    }
  | {
      readonly type: "dropdown-arrow"
    }

export type MutableItem =
  | number
  | string
  | bigint
  | Block
  | Script
  | {
      type: "field"
      value?: number | string | bigint | undefined
      embedded?: Block | undefined
    }
  | {
      type: "boolean"
      embedded?: Block | undefined
    }
  | {
      type: "dropdown"
      shape?: "rect" | "round" | undefined
      value?: number | string | bigint | undefined
      embedded?: Block | undefined
    }
  | {
      type: "dropdown-arrow"
    }

export type Block = {
  readonly color: Color
  readonly isField?: boolean | undefined
  readonly items: readonly Item[]
  readonly type: Shape
}

export type MutableBlock = {
  color: Color
  isField?: boolean | undefined
  items: Item[]
  type: Shape
}

export type Stack = {
  readonly x: number
  readonly y: number
  readonly blocks: readonly Block[]
}

export type MutableStack = {
  x: number
  y: number
  blocks: Block[]
}
