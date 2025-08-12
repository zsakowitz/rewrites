import type * as Bun from "bun"
import type { BunInspectOptions } from "bun"
import { type IdGlobal } from "../impl/id"
import { INSPECT } from "../impl/inspect"
import { Pos } from "../impl/pos"
import { K } from "./token"

/** Expression kind */
export enum E {
  // Basic values
  Ident,
  Int,
  Num,
  Bool,
  Null,
  SymTag,

  Paren,
  Some,
  Tuple,
  Array,

  Unary,
  Binary,
}

export interface EData {
  [E.Ident]: IdGlobal
  [E.Int]: string
  [E.Num]: string
  [E.Bool]: boolean
  [E.Null]: null
  [E.SymTag]: IdGlobal

  [E.Paren]: Expr
  [E.Some]: Expr
  [E.Tuple]: Expr[]
  [E.Array]: Expr[]

  [E.Unary]: { kind: K.UnaryPre; id: IdGlobal; on: Expr }
  [E.Binary]: { kind: K.Binary; id: IdGlobal; lhs: Expr; rhs: Expr }
}

export class Expr<K extends E = E> {
  constructor(
    readonly p: Pos,
    readonly k: K,
    readonly d: EData[K],
  ) {}

  [INSPECT](_: unknown, p: BunInspectOptions, inspect: typeof Bun.inspect) {
    const inner = inspect(this.d, p)
    if (inner[0] == "[" || inner[0] == "{") {
      return `${E[this.k]} ${inner}`
    } else {
      return `${E[this.k]}(${inner})`
    }
  }
}
