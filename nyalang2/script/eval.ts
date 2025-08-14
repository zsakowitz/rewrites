import type { Block } from "../impl/block"
import type { Const } from "../impl/const"
import { Ctx } from "../impl/ctx"
import { Bool, Int, Null, Num, T, Ty, Void } from "../impl/ty"
import { Val } from "../impl/val"
import { E, Y, type EData, type Expr, type Type, type YData } from "./ast"

function arraySize(expr: Expr, block: Block) {
  const ctx = new Ctx(block, expr.p)
  const val = exprVal(expr, block)
  if (!ctx.coerce.can(val.ty, Int, null)) {
    expr.p.issue(`Array sizes must be of type 'int'; found '${val.ty}'.`)
  }
  const int = ctx.coerce.map(ctx, val, Int, null)
  return block.target.toConst(ctx, int as Val<T.Int>) as Const<T.Int>
}

export function typeTy(ty: Type, block: Block): Ty {
  const ctx = new Ctx(block, ty.p)
  switch (ty.k) {
    case Y.Ident: {
      const d = ty.d as YData[Y.Ident]
      return block.scope.ty(d) ?? ctx.issue(`Unknown type '${d.label}'.`)
    }
    case Y.Sym: {
      const d = ty.d as YData[Y.Sym]
      return new Ty(T.Sym, {
        tag: d.tag,
        el: d.of ? typeTy(d.of, block) : Void,
      })
    }
    case Y.Paren:
      return typeTy(ty.d as YData[Y.Paren], block)
    case Y.Option: {
      const d = ty.d as YData[Y.Option]
      return new Ty(T.Option, typeTy(d, block))
    }
    case Y.Null:
      return Null
    case Y.Tuple: {
      const d = ty.d as YData[Y.Tuple]
      return new Ty(
        T.Tuple,
        d.map((x) => typeTy(x, block)),
      )
    }
    case Y.ArrayFixed: {
      const d = ty.d as YData[Y.ArrayFixed]
      return new Ty(T.ArrayFixed, {
        el: typeTy(d.el, block),
        size: d.size.map((expr) => arraySize(expr, block)),
      })
    }
    case Y.ArrayUnsized: {
      const d = ty.d as YData[Y.ArrayUnsized]
      return new Ty(T.ArrayUnsized, { el: typeTy(d.el, block), size: null })
    }
  }
}

export function exprTy(expr: Expr, block: Block): Ty {
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
      return exprTy(expr.d as EData[E.Paren], block)
    case E.Some:
      return new Ty(T.Option, exprTy(expr.d as EData[E.Some], block))
    case E.Tuple:
      return new Ty(
        T.Tuple,
        (expr.d as EData[E.Tuple]).map((x) => exprTy(x, block)),
      )
    case E.Array:
      return ctx.arrayTy(
        (expr.d as EData[E.Array]).map((x) => exprTy(x, block)),
      )
    case E.Unary:
      return ctx.callTy((expr.d as EData[E.Unary]).id, [
        exprTy((expr.d as EData[E.Unary]).on, block),
      ])
    case E.Binary:
      return ctx.callTy((expr.d as EData[E.Binary]).id, [
        exprTy((expr.d as EData[E.Binary]).lhs, block),
        exprTy((expr.d as EData[E.Binary]).rhs, block),
      ])
    case E.Runtime:
      return exprTy(expr.d as EData[E.Runtime], block)
    case E.TupleIndex: {
      const d = expr.d as EData[E.TupleIndex]
      const v = exprTy(d.on, block)
      if (v.is(T.Tuple)) {
        return ctx.indexTupleTy(v, d.idx)
      } else {
        return ctx.at(d.on.p).issue("Tuple indexing is only valid on tuples.")
      }
    }
    case E.Ascribe: {
      const d = expr.d as EData[E.Ascribe]
      const actual = exprTy(d.on, block)
      const expected = typeTy(d.ty, block)
      // TODO: this should allow _ binding, as in (2, 3) :: (num, _)
      if (ctx.coerce.can(actual, expected, null)) {
        return expected
      } else {
        return d.on.p.issue(
          `Expected value of type '${expected}', but found '${actual}'.`,
        )
      }
    }
  }
}

export function exprVal(expr: Expr, block: Block): Val {
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
      return exprVal(expr.d as EData[E.Paren], block)
    case E.Some:
      return ctx.some(exprVal(expr.d as EData[E.Some], block))
    case E.Tuple:
      return ctx.tuple((expr.d as EData[E.Tuple]).map((x) => exprVal(x, block)))
    case E.Array:
      return ctx.array((expr.d as EData[E.Tuple]).map((x) => exprVal(x, block)))
    case E.Unary:
      return ctx.callVal((expr.d as EData[E.Unary]).id, [
        exprVal((expr.d as EData[E.Unary]).on, block),
      ])
    case E.Binary:
      return ctx.callVal((expr.d as EData[E.Binary]).id, [
        exprVal((expr.d as EData[E.Binary]).lhs, block),
        exprVal((expr.d as EData[E.Binary]).rhs, block),
      ])
    case E.Runtime: {
      const v = exprVal(expr.d as EData[E.Runtime], block)
      return ctx.asRuntime(v)
    }
    case E.TupleIndex: {
      const d = expr.d as EData[E.TupleIndex]
      const v = exprVal(d.on, block)
      if (v.ty.is(T.Tuple)) {
        return ctx.indexTuple(v as Val<T.Tuple>, d.idx)
      } else {
        return ctx.at(d.on.p).issue("Tuple indexing is only valid on tuples.")
      }
    }
    case E.Ascribe: {
      const d = expr.d as EData[E.Ascribe]
      const actual = exprVal(d.on, block)
      const expected = typeTy(d.ty, block)
      // TODO: this should allow _ binding, as in (2, 3) :: (num, _)
      if (ctx.coerce.can(actual.ty, expected, null)) {
        return ctx.coerce.map(ctx, actual, expected, null)
      } else {
        return d.on.p.issue(
          `Expected value of type '${expected}', but found '${actual.ty}'.`,
        )
      }
    }
  }
}
