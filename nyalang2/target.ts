import type { Ctx } from "./ctx"
import type { T, Ty } from "./ty"
import type { Val } from "./val"

export interface Target<SymTag = unknown> {
  name: string

  symSplit(ctx: Ctx, val: Val<T.Sym>): [tag: SymTag, el: Val]
  symJoin(ctx: Ctx, tag: SymTag, el: Val): Val

  tupleSplit(ctx: Ctx, val: Val<T.Tuple>): Val[]
  tupleJoin(ctx: Ctx, els: Val[]): Val<T.Tuple>

  arrayCons(
    ctx: Ctx,
    size: number[],
    el: Ty,
    vals: Val[], // should assume that `vals.length == size.reduce((a,b)=>a*b,1)`
  ): Val<T.ArrayFixed>
  arrayMap(
    ctx: Ctx,
    val: Val<T.ArrayAny>,
    mapTy: Ty,
    map: (el: Val) => Val,
  ): Val<T.ArrayAny>
  arrayToCapped(ctx: Ctx, val: Val<T.ArrayFixed>): Val<T.ArrayCapped>
  arrayToUnsized(
    ctx: Ctx,
    val: Val<T.ArrayFixed | T.ArrayCapped>,
  ): Val<T.ArrayUnsized>

  createBool(value: boolean): Val<T.Bool>
  createInt(value: string): Val<T.Int>
  createNum(value: string): Val<T.Num>
  createVoid(): Val<T.Tuple>

  x(ctx: Ctx, val: Val): string
}
