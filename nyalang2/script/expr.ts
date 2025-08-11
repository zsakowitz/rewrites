import type * as Bun from "bun"
import type { BunInspectOptions } from "bun"
import { type IdGlobal } from "../impl/id"
import { INSPECT } from "../impl/inspect"
import { join, Pos } from "../impl/pos"
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

export interface ExprData {
  [E.Ident]: IdGlobal
  [E.Int]: string
  [E.Num]: string
  [E.Bool]: boolean
  [E.Null]: null
  [E.SymTag]: IdGlobal

  [E.Some]: Expr
  [E.Tuple]: Expr[]
  [E.Array]: Expr[]

  [E.Unary]: { kind: K.Bang | K.Plus | K.Minus | K.Star | K.Carat; on: Expr }
}

export class Expr<K extends E = E> {
  constructor(
    readonly p: Pos,
    readonly k: K,
    readonly d: ExprData[K],
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
      return new Expr(join(token.pos, el.p), E.Unary, { kind: token.k, on: el })
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
