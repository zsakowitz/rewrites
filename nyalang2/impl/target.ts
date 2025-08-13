import type { Const } from "./const"
import type { Ctx } from "./ctx"
import type { T, Ty } from "./ty"
import type { Val } from "./val"

export interface Target<SymTag = unknown> {
  /** A short name for this target, for debugging purposes. */
  name: string

  /** Converts a value to its runtime representation. */
  x(ctx: Ctx, val: Val): string | null

  /** The input type might have a const-known tag. */
  symTag(ctx: Ctx, val: Val<T.Sym>): SymTag

  /** The input type might have a const-known tag. */
  symSplit(ctx: Ctx, val: Val<T.Sym>): [tag: SymTag, el: Val]

  /** The returned type should not have a const-known tag. */
  symJoin(ctx: Ctx, tag: SymTag, el: Val): Val

  tupleSplit(ctx: Ctx, val: Val<T.Tuple>): Val[]
  tupleIndex(ctx: Ctx, val: Val<T.Tuple>, index: number): Val
  tupleJoin(ctx: Ctx, els: Val[]): Val<T.Tuple>

  /** The passed `ty` is valid for empty arrays. */
  arrayEmpty(ctx: Ctx, ty: Ty<T.ArrayAny>): Val<T.ArrayAny>
  arrayCons(
    ctx: Ctx,
    size: number[],
    el: Ty,
    vals: Val[], // should assume that `vals.length == size.reduce((a,b)=>a*b,1)`
  ): Val<T.ArrayFixed>
  arrayMapPure(
    ctx: Ctx,
    val: Val<T.ArrayAny>,
    dstEl: Ty,
    map: (el: Val) => Val,
  ): Val<T.ArrayAny>
  arrayToCapped(
    ctx: Ctx,
    val: Val<T.ArrayFixed>,
    cap: Const<T.Int>,
  ): Val<T.ArrayCapped>
  arrayToUnsized(
    ctx: Ctx,
    val: Val<T.ArrayFixed | T.ArrayCapped>,
  ): Val<T.ArrayUnsized>

  createBool(ctx: Ctx, value: boolean): Val<T.Bool>
  createInt(ctx: Ctx, value: string): Val<T.Int>
  createNum(ctx: Ctx, value: string): Val<T.Num>

  optFromNull(ctx: Ctx, ty: Ty<T.Option>): Val<T.Option>
  optFromVal(ctx: Ctx, val: Val): Val<T.Option>
  optMapPure(
    ctx: Ctx,
    val: Val<T.Option>,
    retTy: Ty,
    map: (val: Val) => Val,
  ): Val<T.Option>

  toConst(ctx: Ctx, val: Val<T.Int | T.Bool>): Const
}
