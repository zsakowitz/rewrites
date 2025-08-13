import type { Block } from "../impl/block"
import { Ctx } from "../impl/ctx"
import { Bool, Int, Null, Num, T, Ty } from "../impl/ty"
import { Val } from "../impl/val"
import { E, type EData, type Expr } from "./ast"

export function evalTy(expr: Expr, block: Block): Ty {
  const ctx = new Ctx(block, expr.p)

  switch (expr.k) {
    case E.Ident:
      return ctx.callTy(expr.d as EData[E.Ident], [])
    case E.Int:
      return Int
    case E.Num:
      return Num
    case E.Bool:
      return Bool
    case E.Null:
      return Null
    case E.SymTag:
      return Ty.Sym(expr.d as EData[E.SymTag])
    case E.Paren:
      return evalTy(expr.d as EData[E.Paren], block)
    case E.Some:
      return new Ty(T.Option, evalTy(expr.d as EData[E.Some], block))
    case E.Tuple:
      return new Ty(
        T.Tuple,
        (expr.d as EData[E.Tuple]).map((x) => evalTy(x, block)),
      )
    case E.Array:
      return ctx.arrayTy(
        (expr.d as EData[E.Array]).map((x) => evalTy(x, block)),
      )
    case E.Unary:
      return ctx.callTy((expr.d as EData[E.Unary]).id, [
        evalTy((expr.d as EData[E.Unary]).on, block),
      ])
    case E.Binary:
      return ctx.callTy((expr.d as EData[E.Binary]).id, [
        evalTy((expr.d as EData[E.Binary]).lhs, block),
        evalTy((expr.d as EData[E.Binary]).rhs, block),
      ])
    case E.Runtime:
      return evalTy(expr.d as EData[E.Runtime], block)
    case E.TupleIndex: {
      const d = expr.d as EData[E.TupleIndex]
      const v = evalTy(d.on, block)
      if (v.is(T.Tuple)) {
        return ctx.indexTupleTy(v, d.idx)
      } else {
        return ctx.at(d.on.p).issue("Tuple indexing is only valid on tuples.")
      }
    }
  }
}

export function evalVal(expr: Expr, block: Block): Val {
  const ctx = new Ctx(block, expr.p)
  switch (expr.k) {
    case E.Ident:
      return ctx.callVal(expr.d as EData[E.Ident], [])
    case E.Int:
      return ctx.int(expr.d as EData[E.Int])
    case E.Num:
      return ctx.num(expr.d as EData[E.Num])
    case E.Bool:
      return ctx.bool(expr.d as EData[E.Bool])
    case E.Null:
      return ctx.null()
    case E.SymTag:
      return ctx.unit(Ty.Sym(expr.d as EData[E.SymTag]))
    case E.Paren:
      return evalVal(expr.d as EData[E.Paren], block)
    case E.Some:
      return ctx.some(evalVal(expr.d as EData[E.Some], block))
    case E.Tuple:
      return ctx.tuple((expr.d as EData[E.Tuple]).map((x) => evalVal(x, block)))
    case E.Array:
      return ctx.array((expr.d as EData[E.Tuple]).map((x) => evalVal(x, block)))
    case E.Unary:
      return ctx.callVal((expr.d as EData[E.Unary]).id, [
        evalVal((expr.d as EData[E.Unary]).on, block),
      ])
    case E.Binary:
      return ctx.callVal((expr.d as EData[E.Binary]).id, [
        evalVal((expr.d as EData[E.Binary]).lhs, block),
        evalVal((expr.d as EData[E.Binary]).rhs, block),
      ])
    case E.Runtime: {
      const v = evalVal(expr.d as EData[E.Runtime], block)
      return ctx.asRuntime(v)
    }
    case E.TupleIndex: {
      const d = expr.d as EData[E.TupleIndex]
      const v = evalVal(d.on, block)
      if (v.ty.is(T.Tuple)) {
        return ctx.indexTuple(v as Val<T.Tuple>, d.idx)
      } else {
        return ctx.at(d.on.p).issue("Tuple indexing is only valid on tuples.")
      }
    }
  }
}
