import { ident, type IdGlobal } from "../impl/id"
import { join, Pos, type Loc } from "../impl/pos"
import { E, Expr, Type, Y } from "./ast"
import { tokenIdent } from "./ident"
import type { Scan, Token } from "./scan"
import { K } from "./token"

// #region Helpers

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
      return { els: [], finalComma: false, end: peeked.p.end }
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
      return { els, finalComma: comma, end: peeked.p.end }
    } else if (!comma) {
      scan.issue(`Expected comma or closing ${untilName}.`)
    }
  }
}

// #endregion
// #region Expr parsing

type ExprScanner = (scan: Scan) => Expr

function parseExprAtom(scan: Scan): Expr {
  const token = scan.next()

  switch (token.k) {
    case K.Int:
      return new Expr(token.p, E.Int, token.content)
    case K.Num:
      return new Expr(token.p, E.Num, token.content)
    case K.NumOrTupleIndex:
      return new Expr(token.p, E.Num, token.content)
    case K.Ident:
      return new Expr(token.p, E.Ident, tokenIdent(token))
    case K.Colon: {
      const next = scan.next()
      if (next.k != K.Ident) {
        scan.issue(`Expected symbol identifier after colon.`)
      }
      return new Expr(join(token.p, next.p), E.SymTag, tokenIdent(next))
    }
    case K.KTrue:
      return new Expr(token.p, E.Bool, true)
    case K.KFalse:
      return new Expr(token.p, E.Bool, false)
    case K.KNull:
      return new Expr(token.p, E.Null, null)
    case K.LParen: {
      const { els, finalComma, end } = parseGroupList(
        scan,
        K.RParen,
        "parenthesis",
        parseExpr,
      )
      const pos = new Pos(token.p.file, token.p.start, end)
      if (els.length == 1 && !finalComma) {
        return new Expr(pos, E.Paren, els[0]!)
      } else {
        return new Expr(pos, E.Tuple, els)
      }
    }
    case K.LBrack: {
      const { els, end } = parseGroupList(scan, K.RBrack, "bracket", parseExpr)
      const pos = new Pos(token.p.file, token.p.start, end)
      return new Expr(pos, E.Array, els)
    }
    default:
      return token.issue("Expected expression.")
  }
}

function parseExprSuffixed(scan: Scan): Expr {
  let ret = parseExprAtom(scan)

  while (true) {
    const next = scan.peek()

    switch (next?.k) {
      case K.NumOrTupleIndex: {
        scan.next()
        const idx = +next.content.slice(1) // cut off the .
        if (!Number.isSafeInteger(idx)) {
          next.issue(`Bug: Tuple index '${next.content}' was not numeric.`)
        }
        ret = new Expr(join(ret.p, next.p), E.TupleIndex, { on: ret, idx })
        break
      }
      default:
        return ret
    }
  }
}

const EXPR_TIGHT_PREFIXES = [K.Ques, K.Bang, K.Plus, K.Tilde, K.Minus] as const
type ExprTightPrefix = (typeof EXPR_TIGHT_PREFIXES)[number]
function parseExprPrefixed(scan: Scan): Expr {
  const prefixes: Token<ExprTightPrefix>[] = []

  while (true) {
    const prefix = scan.peek()
    if (prefix && has(EXPR_TIGHT_PREFIXES, prefix.k)) {
      scan.next()
      prefixes.push(prefix satisfies Token<K> as any)
    } else break
  }

  const expr = parseExprSuffixed(scan)

  return prefixes.reduceRight(
    (a, b) =>
      new Expr(
        join(b.p, a.p),
        b.k == K.Ques ? E.Some : E.Unary,
        b.k == K.Ques ? a : { kind: b.k, id: OP_IDS[b.k], on: a },
      ),
    expr,
  )
}

const OP_IDS: Record<K.Binary | K.UnaryPre, IdGlobal> = {
  [K.Bang]: ident("!"),
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

/**
 * TypeScript needs an `a is maybe b` predicate, but we don't use the "else"
 * case ever, so it's fine.
 */
function has<const T>(items: readonly T[], checked: unknown): checked is T {
  return items.includes(checked as T)
}

function binParenReq(self: K.Binary[], side: ExprScanner): ExprScanner {
  return (scan) => {
    let ret = side(scan)

    const next = scan.peekK()
    if (has(self, next)) {
      scan.next()
      const rhs = side(scan)
      ret = new Expr(join(ret.p, rhs.p), E.Binary, {
        kind: next,
        id: OP_IDS[next],
        lhs: ret,
        rhs,
      })
    }

    {
      if (has(self, scan.peekK())) {
        scan.issue("Use parentheses to disambiguate operator precedence.")
      }
    }

    return ret
  }
}

function binLhsAssoc(self: K.Binary[], side: ExprScanner): ExprScanner {
  return (scan) => {
    let ret = side(scan)
    while (true) {
      const next = scan.peekK()
      if (has(self, next)) {
        scan.next()
        const rhs = side(scan)
        ret = new Expr(join(ret.p, rhs.p), E.Binary, {
          kind: next,
          id: OP_IDS[next],
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
              id: OP_IDS[self],
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
              binParenReq([K.Shl, K.Shr], parseExprPrefixed),
            ),
          ),
        ),
      ),
    ),
  ),
)

function parseExprAscribe(scan: Scan): Expr {
  let ret = parseExprBinary(scan)
  while (scan.peekK() == K.ColonColon) {
    scan.next()
    const ty = parseType(scan)
    ret = new Expr(join(ret.p, ty.p), E.Ascribe, { on: ret, ty })
  }
  return ret
}

function parseExprRuntime(scan: Scan): Expr {
  if (scan.peek()?.k == K.KRuntime) {
    const t = scan.next()!
    const el = parseExprAscribe(scan)
    return new Expr(join(t.p, el.p), E.Runtime, el)
  } else {
    return parseExprAscribe(scan)
  }
}

export function parseExpr(scan: Scan): Expr {
  return parseExprRuntime(scan)
}

// #endregion

// #region Type parsing

export function parseType(scan: Scan): Type {
  const token = scan.next()

  switch (token.k) {
    case K.Ident:
      return new Type(token.p, Y.Ident, tokenIdent(token))
    case K.KSym:
    case K.Colon: {
      const next = scan.next()
      if (next.k != K.Ident && next.k != K.KSym) {
        scan.issue(`Expected symbol identifier after colon.`)
      }
      if (scan.peekK() == K.LParen) {
        const inner = parseType(scan) // parenthesized or tuple
        return new Type(join(token.p, inner.p), Y.Sym, {
          tag: tokenIdent(next),
          of: inner,
        })
      }
      return new Type(join(token.p, next.p), Y.Sym, {
        tag: next.k == K.KSym ? null : tokenIdent(next),
        of: null,
      })
    }
    case K.KNull:
      return new Type(token.p, Y.Null, null)
    case K.LParen: {
      const { els, finalComma, end } = parseGroupList(
        scan,
        K.RParen,
        "parenthesis",
        parseType,
      )
      const pos = new Pos(token.p.file, token.p.start, end)
      if (els.length == 1 && !finalComma) {
        return new Type(pos, Y.Paren, els[0]!)
      } else {
        return new Type(pos, Y.Tuple, els)
      }
    }
    case K.LBrack: {
      const lbrack = token
      const el = parseType(scan)
      const semi = scan.next()
      if (semi.k == K.RBrack) {
        return new Type(join(lbrack.p, semi.p), Y.ArrayUnsized, {
          el,
          size: null,
        })
      }

      const { els, end } = parseGroupList(scan, K.RBrack, "bracket", parseExpr)
      const pos = new Pos(token.p.file, token.p.start, end)
      return new Type(pos, Y.ArrayFixed, { el, size: els })
    }
    case K.Ques: {
      const el = parseType(scan)
      return new Type(join(token.p, el.p), Y.Option, el)
    }
    default:
      return token.issue("Expected type.")
  }
}

// #endregion
