import type * as Bun from "bun"
import type { BunInspectOptions } from "bun"
import type { Block } from "../impl/block"
import { Ctx } from "../impl/ctx"
import { ident, type IdGlobal } from "../impl/id"
import { INSPECT } from "../impl/inspect"
import { join, Pos } from "../impl/pos"
import { Bool, Int, Null, Num, T, Ty } from "../impl/ty"
import { Val } from "../impl/val"
import { tokenIdent } from "./ident"
import type { Scan } from "./scan"
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

  Some,
  Tuple,
  Array,

  Unary,
}

export interface Data {
  [E.Ident]: IdGlobal
  [E.Int]: string
  [E.Num]: string
  [E.Bool]: boolean
  [E.Null]: null
  [E.SymTag]: IdGlobal

  [E.Some]: Expr
  [E.Tuple]: Expr[]
  [E.Array]: Expr[]

  [E.Unary]: {
    kind: K.Bang | K.Plus | K.Minus | K.Star | K.Carat
    id: IdGlobal
    on: Expr
  }
}

export class Expr<K extends E = E> {
  constructor(
    readonly p: Pos,
    readonly k: K,
    readonly d: Data[K],
  ) {}

  [INSPECT](_: unknown, p: BunInspectOptions, inspect: typeof Bun.inspect) {
    const inner = inspect(this.d, p)
    if (inner[0] == "[" || inner[0] == "{") {
      return `${E[this.k]} ${inner}`
    } else {
      return `${E[this.k]}(${inner})`
    }
  }

  evalTy(block: Block): Ty {
    const ctx = new Ctx(block, this.p)
    switch (this.k) {
      case E.Ident:
        return ctx.callTy(this.d as Data[E.Ident], [])
      case E.Int:
        return Int
      case E.Num:
        return Num
      case E.Bool:
        return Bool
      case E.Null:
        return Null
      case E.SymTag:
        return Ty.Sym(this.d as Data[E.SymTag])
      case E.Some:
        return new Ty(T.Option, (this.d as Data[E.Some]).evalTy(block))
      case E.Tuple:
        return new Ty(
          T.Tuple,
          (this.d as Data[E.Tuple]).map((x) => x.evalTy(block)),
        )
      case E.Array:
        return ctx.arrayTy(
          (this.d as Data[E.Array]).map((x) => x.evalTy(block)),
        )
      case E.Unary:
        return ctx.callTy((this.d as Data[E.Unary]).id, [
          (this.d as Data[E.Unary]).on.evalTy(block),
        ])
    }
  }

  evalVal(block: Block): Val {
    const ctx = new Ctx(block, this.p)
    switch (this.k) {
      case E.Ident:
        return ctx.callVal(this.d as Data[E.Ident], [])
      case E.Int:
        return ctx.int(this.d as Data[E.Int])
      case E.Num:
        return ctx.num(this.d as Data[E.Num])
      case E.Bool:
        return ctx.bool(this.d as Data[E.Bool])
      case E.Null:
        return ctx.null()
      case E.SymTag:
        return ctx.unit(Ty.Sym(this.d as Data[E.SymTag]))
      case E.Some:
        return ctx.some((this.d as Data[E.Some]).evalVal(block))
      case E.Tuple:
        return ctx.tuple((this.d as Data[E.Tuple]).map((x) => x.evalVal(block)))
      case E.Array:
        return ctx.array((this.d as Data[E.Tuple]).map((x) => x.evalVal(block)))
      case E.Unary:
        return ctx.callVal((this.d as Data[E.Unary]).id, [
          (this.d as Data[E.Unary]).on.evalVal(block),
        ])
    }
  }
}

function parseAtom(scan: Scan): Expr {
  const token = scan.next()

  switch (token.k) {
    case K.Int:
      return new Expr(token.pos, E.Int, token.content)
    case K.Num:
      return new Expr(token.pos, E.Num, token.content)
    case K.NumOrTupleIndex:
      return new Expr(token.pos, E.Num, token.content)
    case K.Ques: {
      const el = parseAtom(scan)
      return new Expr(join(token.pos, el.p), E.Some, el)
    }
    case K.Ident:
      return new Expr(token.pos, E.Ident, tokenIdent(token))
    case K.Colon: {
      const next = scan.next()
      if (next.k != K.Ident) {
        scan.issue(`Expected identifier following symbol.`)
      }
      return new Expr(join(token.pos, next.pos), E.SymTag, tokenIdent(next))
    }
    case K.KTrue:
      return new Expr(token.pos, E.Bool, true)
    case K.KFalse:
      return new Expr(token.pos, E.Bool, false)
    case K.KNull:
      return new Expr(token.pos, E.Null, null)
    case K.Bang:
    case K.Plus:
    case K.Minus:
    case K.Star:
    case K.Carat: {
      const el = parseAtom(scan)
      return new Expr(join(token.pos, el.p), E.Unary, {
        kind: token.k,
        id: ident(
          {
            [K.Bang]: "!",
            [K.Plus]: "+",
            [K.Minus]: "-",
            [K.Star]: "*",
            [K.Carat]: "^",
          }[token.k],
        ),
        on: el,
      })
    }
    case K.OLParen: {
      const els: Expr[] = []

      // empty tuple
      {
        const peeked = scan.peek()
        if (peeked == null) {
          scan.eof()
        }
        if (peeked.k == K.ORParen) {
          scan.next()
          return new Expr(join(token.pos, peeked.pos), E.Tuple, els)
        }
      }

      let comma = false
      while (true) {
        els.push(parseExpr(scan))

        const peeked = scan.peek()
        if (peeked == null) {
          scan.eof()
        } else if (peeked.k == K.Comma) {
          comma = true
          scan.next()
          continue
        } else if (peeked.k == K.ORParen) {
          scan.next()
          if (els.length == 0 && !comma) {
            return els[0]! // representing parentheses separately sounds like an annoyance
          }
          return new Expr(join(token.pos, peeked.pos), E.Tuple, els)
        } else {
          scan.issue(
            "Expected comma or closing parenthesis to terminate tuple.",
          )
        }
      }
    }
    default:
      return token.issue("Expected expression.")
  }
}

export function parseExpr(scan: Scan): Expr {
  return parseAtom(scan)
}
