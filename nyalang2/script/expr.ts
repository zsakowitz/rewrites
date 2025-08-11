import type { IdGlobal } from "../impl/id"
import type { Pos } from "../impl/pos"

/** Expression kind */
export const enum E {
  Ident,
  Int,
  Num,
  Bool,
  Null,
  SymTag,
}

export interface ExprData {
  [E.Ident]: IdGlobal
  [E.Int]: null
  [E.Num]: null
  [E.Bool]: boolean
  [E.Null]: null
  [E.SymTag]: null
}

export class Expr<K extends E = E> {
  constructor(
    readonly p: Pos,
    readonly k: K,
    readonly d: ExprData[K],
  ) {}
}
