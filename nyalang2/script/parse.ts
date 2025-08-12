import { ident } from "../impl/id"
import { join, Pos, type Loc } from "../impl/pos"
import { E, Expr } from "./ast"
import { tokenIdent } from "./ident"
import type { Scan } from "./scan"
import { K } from "./token"

function parseGroupList<T>(
  scan: Scan,
  until: K,
  untilName: "parenthesis" | "bracket",
  el: (scan: Scan) => T,
): { els: T[]; finalComma: boolean; end: Loc | null } {
  const els: T[] = []

  // empty tuple
  {
    const peeked = scan.peek()
    if (peeked == null) {
      scan.eof()
    }
    if (peeked.k == until) {
      scan.next()
      return { els: [], finalComma: false, end: peeked.pos.end }
    }
  }

  while (true) {
    els.push(el(scan))

    let comma = false
    if (scan.peek()?.k == K.Comma) {
      comma = true
      scan.next()
    }

    const peeked = scan.peek()
    if (peeked == null) {
      scan.eof()
    } else if (peeked.k == until) {
      scan.next()
      return { els, finalComma: comma, end: peeked.pos.end }
    } else if (!comma) {
      scan.issue(`Expected comma or closing ${untilName}.`)
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
    case K.Minus: {
      const el = parseAtom(scan)
      return new Expr(join(token.pos, el.p), E.Unary, {
        kind: token.k,
        id: ident({ [K.Bang]: "!", [K.Plus]: "+", [K.Minus]: "-" }[token.k]),
        on: el,
      })
    }
    case K.OLParen: {
      const { els, finalComma, end } = parseGroupList(
        scan,
        K.ORParen,
        "parenthesis",
        parseExpr,
      )
      const pos = new Pos(token.pos.file, token.pos.start, end)
      if (els.length == 1 && !finalComma) {
        return new Expr(pos, E.Paren, els[0]!)
      } else {
        return new Expr(pos, E.Tuple, els)
      }
    }
    case K.OLBrack: {
      const { els, end } = parseGroupList(scan, K.ORBrack, "bracket", parseExpr)
      const pos = new Pos(token.pos.file, token.pos.start, end)
      return new Expr(pos, E.Array, els)
    }
    default:
      return token.issue("Expected expression.")
  }
}

export function parseExpr(scan: Scan): Expr {
  return parseAtom(scan)
}
