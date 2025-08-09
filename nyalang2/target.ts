import type { Block } from "./block"
import type { Pos } from "./pos"
import type { T } from "./ty"
import type { Val } from "./val"

export class EmitTarget<SymTag = unknown> {
  constructor(
    readonly symSplit: (
      block: Block,
      pos: Pos,
      val: Val<T.Sym>,
    ) => [tag: SymTag, el: Val],
    readonly symJoin: (block: Block, pos: Pos, tag: SymTag, el: Val) => Val,

    readonly tupleSplit: (block: Block, pos: Pos, val: Val<T.Tuple>) => Val[],
    readonly tupleJoin: (block: Block, pos: Pos, els: Val[]) => Val<T.Tuple>,

    readonly arrayMap: (
      block: Block,
      pos: Pos,
      val: Val<T.ArrayAny>,
      map: (el: Val) => Val,
    ) => Val<T.ArrayAny>,
    readonly arrayToCapped: (
      block: Block,
      pos: Pos,
      val: Val<T.ArrayFixed>,
    ) => Val<T.ArrayCapped>,
    readonly arrayToUnsized: (
      block: Block,
      pos: Pos,
      val: Val<T.ArrayFixed | T.ArrayCapped>,
    ) => Val<T.ArrayUnsized>,
  ) {}
}
