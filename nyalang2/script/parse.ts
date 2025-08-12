import { ident, type IdGlobal } from "../impl/id"
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

type ExprScanner = (scan: Scan) => Expr

function parseExprAtom(scan: Scan): Expr {
  const token = scan.next()

  switch (token.k) {
    case K.Int:
      return new Expr(token.pos, E.Int, token.content)
    case K.Num:
      return new Expr(token.pos, E.Num, token.content)
    case K.NumOrTupleIndex:
      return new Expr(token.pos, E.Num, token.content)
    case K.Ques: {
      const el = parseExprAtom(scan)
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
      const el = parseExprAtom(scan)
      return new Expr(join(token.pos, el.p), E.Unary, {
        kind: token.k,
        id: ident({ [K.Bang]: "!", [K.Plus]: "+", [K.Minus]: "-" }[token.k]),
        on: el,
      })
    }
    case K.LParen: {
      const { els, finalComma, end } = parseGroupList(
        scan,
        K.RParen,
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
    case K.LBrack: {
      const { els, end } = parseGroupList(scan, K.RBrack, "bracket", parseExpr)
      const pos = new Pos(token.pos.file, token.pos.start, end)
      return new Expr(pos, E.Array, els)
    }
    default:
      return token.issue("Expected expression.")
  }
}

const BINARY_IDS: Record<K.Binary, IdGlobal> = {
  [K.Shl]: ident("<<"),
  [K.Shr]: ident(">>"),
  [K.Amp]: ident("&"),
  [K.Bar]: ident("|"),
  [K.Tilde]: ident("~"),
  [K.Caret]: ident("^"),
  [K.Star]: ident("*"),
  [K.Slash]: ident("/"),
  [K.Percent]: ident("%"),
  [K.At]: ident("@"),
  [K.Plus]: ident("+"),
  [K.Minus]: ident("-"),
  [K.Eq]: ident("=="),
  [K.Ne]: ident("!="),
  [K.Lt]: ident("<"),
  [K.Le]: ident("<="),
  [K.Gt]: ident(">"),
  [K.Ge]: ident(">="),
  [K.AmpAmp]: ident("&&"),
  [K.BarBar]: ident("||"),
}

function binParenReq(self: K.Binary[], side: ExprScanner): ExprScanner {
  return (scan) => {
    let ret = side(scan)
    const next = scan.peek()
    if (next != null && self.includes(next.k as any)) {
      scan.next()
      const rhs = side(scan)
      ret = new Expr(join(ret.p, rhs.p), E.Binary, {
        kind: next.k as K.Binary,
        id: BINARY_IDS[next.k as K.Binary],
        lhs: ret,
        rhs,
      })
    }
    {
      const next = scan.peek()
      if (next != null && self.includes(next.k as any)) {
        next.issue("Use parentheses to disambiguate operator precedence.")
      }
    }
    return ret
  }
}

function binLhsAssoc(self: K.Binary[], side: ExprScanner): ExprScanner {
  return (scan) => {
    let ret = side(scan)
    while (true) {
      const next = scan.peek()
      if (next != null && self.includes(next.k as any)) {
        scan.next()
        const rhs = side(scan)
        ret = new Expr(join(ret.p, rhs.p), E.Binary, {
          kind: next.k as K.Binary,
          id: BINARY_IDS[next.k as K.Binary],
          lhs: ret,
          rhs,
        })
      } else return ret
    }
  }
}

function binRhsAssoc(self: K.Binary, side: ExprScanner): ExprScanner {
  return (scan) => {
    const lhs = []
    let rhs = side(scan)
    while (true) {
      const next = scan.peek()
      if (next != null && self == next.k) {
        scan.next()
        const nextRhs = side(scan)
        lhs.push(rhs)
        rhs = nextRhs
      } else {
        return lhs.reduceRight(
          (a, b) =>
            new Expr(join(a.p, b.p), E.Binary, {
              kind: self,
              id: BINARY_IDS[self],
              lhs: a,
              rhs: b,
            }),
          rhs,
        )
      }
    }
  }
}

function binChain(
  set1: K.Binary[],
  set2: K.Binary[],
  side: ExprScanner,
): ExprScanner {
  return binParenReq([...set1, ...set2], side)
}

const parseExprBinary = binLhsAssoc(
  [K.BarBar],
  binLhsAssoc(
    [K.AmpAmp],
    binChain(
      [K.Lt, K.Le, K.Gt, K.Ge],
      [K.Eq, K.Ne],
      binLhsAssoc(
        [K.Plus, K.Minus],
        binLhsAssoc(
          [K.Star, K.Slash, K.Percent, K.At],
          binRhsAssoc(
            K.Caret,
            binParenReq(
              [K.Amp, K.Bar, K.Tilde],
              binParenReq([K.Shl, K.Shr], parseExprAtom),
            ),
          ),
        ),
      ),
    ),
  ),
)

function parseExprBig(scan: Scan): Expr {
  if (scan.peek()?.k == K.KRuntime) {
    const t = scan.next()!
    const el = parseExprBinary(scan)
    return new Expr(join(t.pos, el.p), E.Runtime, el)
  }
  return parseExprBinary(scan)
}

export function parseExpr(scan: Scan): Expr {
  return parseExprBig(scan)
}
