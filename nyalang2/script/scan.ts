import type { BunInspectOptions } from "bun"
import { issue } from "../impl/error"
import { INSPECT } from "../impl/inspect"
import { Loc, Pos } from "../impl/pos"
import { K, KWS, OPS_KEYED } from "./token"

class Scanned {
  constructor(
    readonly k: K,
    readonly pos: Pos,
  ) {}

  [INSPECT](d: number, p: BunInspectOptions, inspect: typeof Bun.inspect) {
    return `${K[this.k].padEnd(10, " ")} ${inspect(this.pos.content, p)}`
  }
}

class Scan {
  constructor(readonly p: Scanned[]) {}

  [INSPECT](d: number, p: BunInspectOptions, inspect: typeof Bun.inspect) {
    let indent = 0
    let ret = ""
    for (const el of this.p) {
      switch (el.k) {
        case K.OLParen:
        case K.OLBrack:
        case K.OLBrace:
        case K.OLAngle:
        case K.OLIterp:
          ret += "\n" + " ".repeat(indent) + inspect(el, p)
          indent += 2
          continue
        case K.ORParen:
        case K.ORBrack:
        case K.ORBrace:
        case K.ORAngle:
        case K.ORIterp:
          indent -= 2
          break
      }
      ret += "\n" + " ".repeat(indent) + inspect(el, p)
    }
    return ret
  }
}

const WS0 = " ".charCodeAt(0)
const WS1 = "\r".charCodeAt(0)
const WS2 = "\t".charCodeAt(0)

const CODE_NL = "\n".charCodeAt(0)
const CODE__ = "_".charCodeAt(0)
const CODE_A = "A".charCodeAt(0)
const CODE_Z = "Z".charCodeAt(0)
const CODE_a = "a".charCodeAt(0)
const CODE_z = "z".charCodeAt(0)
const CODE_E = "E".charCodeAt(0)
const CODE_e = "e".charCodeAt(0)
const CODE_P = "+".charCodeAt(0)
const CODE_M = "-".charCodeAt(0)
const CODE_0 = "0".charCodeAt(0)
const CODE_9 = "9".charCodeAt(0)
const CODE_DOT = ".".charCodeAt(0)

// our strings start with 0+ hashes, then ",
// contain interpolations in the form ${,
//   where there are max(1,# of hashes) $s before the {,
// and end with a reversal of the opening delimeter
//   (so `###"hello"###` is valid)
// this lets us cover everything without introducing ANY backslash escapes
//   (which we won't do, even though it's probably necessary for special characters)
const CODE_HASH = "#".charCodeAt(0)
const CODE_QUOT = '"'.charCodeAt(0)
const CODE_DOLR = "$".charCodeAt(0)
const CODE_LBRC = "{".charCodeAt(0)
const CODE_RBRC = "}".charCodeAt(0)

function isAlpha(code: number) {
  return (
    code == CODE__
    || (CODE_A <= code && code <= CODE_Z)
    || (CODE_a <= code && code <= CODE_z)
  )
}

export function scan(text: string): Scan {
  const depth: { kind: K.OLBrace | K.OLIterp; hashes: number }[] = []
  let row = 1
  let col = 1
  const ret = []

  let i = 0
  for (; i < text.length; ) {
    // Consume whitespace
    let code
    while (true) {
      code = text.charCodeAt(i)
      if (code == CODE_NL) {
        row++
        col = 1
        i++
      } else if (code == WS0 || code == WS1 || code == WS2) {
        col++
        i++
      } else break
    }

    // Exit if at end of source
    if (i >= text.length) {
      const last = depth.at(-1)
      if (last) {
        const pos = new Pos(text, new Loc(row, col, i), new Loc(row, col, i))
        if (last.kind == K.OLBrace) {
          issue(`Unclosed block.`, pos)
        } else {
          issue(`Unterminated string.`, pos)
        }
      }

      break
    }

    const start = new Loc(row, col, i)
    if (code == CODE_HASH || code == CODE_QUOT) {
      let hashes = 0
      while (((code = text.charCodeAt(i)), code == CODE_HASH))
        (hashes++, i++, col++)

      if (code != CODE_QUOT)
        issue(
          `Unknown string delimeter '${text[i] ?? "<EOF>"}'.`,
          new Pos(text, new Loc(row, col, i), new Loc(row, col, i)),
        )

      i++
      col++

      stringContents(hashes, true)
      continue
    }

    if (code == CODE_LBRC) {
      depth.push({ kind: K.OLBrace, hashes: 0 })
      i++
      col++
      continue
    }

    if (code == CODE_RBRC) {
      i++
      col++
      const pos = new Pos(text, start, new Loc(row, col, i))
      const last = depth.pop()
      if (!last) {
        issue("Unmatched closing brace.", pos)
      }
      if (last.kind == K.OLBrace) {
        ret.push(new Scanned(K.ORBrace, pos))
        continue
      }
      ret.push(new Scanned(K.ORIterp, pos))
      stringContents(last.hashes, false)
      continue
    }

    const entry = OPS_KEYED.get(code)
    if (entry) {
      i++
      col++
      const code2 = text.charCodeAt(i)
      if (entry.has(code2)) {
        i++
        col++
        const op = entry.get(code2)!
        if (op == K.Comment) {
          while (i < text.length && text.charCodeAt(i) != CODE_NL) {
            i++
            col++
          }
        }
        const end = new Loc(row, col, i)
        ret.push(new Scanned(op, new Pos(text, start, end)))
      } else if (entry.has(0)) {
        const end = new Loc(row, col, i)
        ret.push(new Scanned(entry.get(0)!, new Pos(text, start, end)))
      } else {
        issue(`Unknown operator '${text[i - 1]!}'`, new Pos(text, start, start))
      }

      continue
    }

    if (CODE_0 <= code && code <= CODE_9) {
      while (
        (code = text.charCodeAt(++i))
        && i < text.length
        && CODE_0 <= code
        && code <= CODE_9
      ) {}

      let num = false
      if (code == CODE_DOT && !isAlpha(text.charCodeAt(i + 1))) {
        num = true
        i++
        col++
        while (((code = text.charCodeAt(i)), CODE_0 <= code && code <= CODE_9))
          i++
        col++
      }

      if (code == CODE_E || code == CODE_e) {
        const next = text.charCodeAt(i + 1)
        const next2 = text.charCodeAt(i + 2)
        if (
          ((next == CODE_P || next == CODE_M)
            && CODE_0 <= next2
            && next2 <= CODE_9)
          || (CODE_0 <= next && next <= CODE_9)
        ) {
          num = true
          if (next == CODE_P || next == CODE_M) {
            i++
            col++
          }
          i++
          col++
          while (
            i < text.length
            && (code = text.charCodeAt(++i))
            && CODE_0 <= next
            && next <= CODE_9
          );
        }
      }

      const pos = new Pos(text, start, new Loc(row, col, i))
      ret.push(new Scanned(num ? K.Num : K.Int, pos))
      continue
    }

    if (isAlpha(code)) {
      while (
        (code = text.charCodeAt(++i))
        && (isAlpha(code) || (CODE_0 <= code && code <= CODE_9))
      );

      const word = text.slice(start.idx, i)
      const pos = new Pos(text, start, new Loc(row, col, i))
      ret.push(new Scanned(KWS.get(word) ?? K.Ident, pos))
      continue
    }

    if (i < text.length) {
      const pos = new Pos(text, new Loc(row, col, i), new Loc(row, col, i))
      issue(`Unknown character '${text[i]}'.`, pos)
    } else break
  }

  return new Scan(ret)

  function stringContents(hashes: number, isStart: boolean) {
    const dollars = Math.max(hashes, 1)
    let code
    const start = new Loc(row, col, i)
    while (true) {
      if (i >= text.length) {
        issue(
          "Unterminated string literal.",
          new Pos(text, new Loc(row, col, i), new Loc(row, col, i)),
        )
      }
      code = text.charCodeAt(i)
      switch (code) {
        case CODE_NL:
          i++
          row++
          col = 1
          break
        case CODE_DOLR:
          interp: {
            for (let j = 1; j < dollars; j++) {
              if (text.charCodeAt(i + j) != CODE_DOLR) {
                break interp
              }
            }
            if (text.charCodeAt(i + dollars) != CODE_LBRC) {
              break interp
            }
            const end = new Loc(row, col, i)
            ret.push(
              new Scanned(
                isStart ? K.StrStart : K.StrMid,
                new Pos(text, start, end),
              ),
            )
            depth.push({ kind: K.OLIterp, hashes })
            i += dollars + 1
            col += dollars + 1
            const end2 = new Loc(row, col, i)
            ret.push(new Scanned(K.OLIterp, new Pos(text, end, end2)))
            return
          }
          i++
          col++
          break
        case CODE_QUOT:
          final: {
            for (let j = 0; j < hashes; j++) {
              if (text.charCodeAt(i + 1 + j) != CODE_HASH) {
                break final
              }
            }
            const end = new Loc(row, col, i)
            ret.push(
              new Scanned(
                isStart ? K.StrFull : K.StrFinal,
                new Pos(text, start, end),
              ),
            )
            i += hashes + 1
            col += hashes + 1
            return
          }
          i++
          col++
          break
        default:
          i++
          col++
          break
      }
    }
  }
}
