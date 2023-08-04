import type { Color } from "./render/colors.js"

export type StatementShape = "block" | "head" | "tail"
export type ExpressionShape = "rect" | "round" | "sharp"
export type Shape = StatementShape | ExpressionShape

export interface Script {
  readonly type: "script"
  readonly blocks: readonly Block[]
}

export interface MutableScript {
  type: "script"
  blocks: MutableBlock[]
}

export interface Field {
  readonly type: "field"
  readonly value?: number | string | bigint | undefined
  readonly embedded?: Block | undefined
}

export interface MutableField {
  type: "field"
  value?: number | string | bigint | undefined
  embedded?: MutableBlock | undefined
}

export type Item =
  | number
  | string
  | bigint
  | Block
  | Script
  | Field
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
  | MutableField
  | {
      type: "boolean"
      embedded?: MutableBlock | undefined
    }
  | {
      type: "dropdown"
      shape?: "rect" | "round" | undefined
      value?: number | string | bigint | undefined
      embedded?: MutableBlock | undefined
    }
  | {
      type: "dropdown-arrow"
    }

export interface Block {
  readonly color: Color
  readonly isField?: boolean | undefined
  readonly items: readonly Item[]
  readonly type: Shape
}

export interface MutableBlock {
  color: Color
  isField?: boolean | undefined
  items: MutableItem[]
  type: Shape
}

export interface Stack {
  readonly x: number
  readonly y: number
  readonly blocks: readonly Block[]
}

export interface MutableStack {
  x: number
  y: number
  blocks: MutableBlock[]
}
