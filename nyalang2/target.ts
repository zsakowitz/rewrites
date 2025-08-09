import type { Block } from "./block"
import type { Pos } from "./pos"
import type { T, Ty } from "./ty"
import type { Val } from "./val"

export interface Target<SymTag = unknown> {
  name: string

  symSplit(block: Block, pos: Pos, val: Val<T.Sym>): [tag: SymTag, el: Val]
  symJoin(block: Block, pos: Pos, tag: SymTag, el: Val): Val

  tupleSplit(block: Block, pos: Pos, val: Val<T.Tuple>): Val[]
  tupleJoin(block: Block, pos: Pos, els: Val[]): Val<T.Tuple>

  arrayCons(
    block: Block,
    pos: Pos,
    size: number[],
    el: Ty,
    vals: Val[], // should assume that `vals.length == size.reduce((a,b)=>a*b,1)`
  ): Val<T.ArrayFixed>
  arrayMap(
    block: Block,
    pos: Pos,
    val: Val<T.ArrayAny>,
    mapTy: Ty,
    map: (el: Val) => Val,
  ): Val<T.ArrayAny>
  arrayToCapped(
    block: Block,
    pos: Pos,
    val: Val<T.ArrayFixed>,
  ): Val<T.ArrayCapped>
  arrayToUnsized(
    block: Block,
    pos: Pos,
    val: Val<T.ArrayFixed | T.ArrayCapped>,
  ): Val<T.ArrayUnsized>

  createBool(value: boolean): Val<T.Bool>
  createInt(value: string): Val<T.Int>
  createNum(value: string): Val<T.Num>
  createVoid(): Val<T.Tuple>
}
