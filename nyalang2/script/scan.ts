import { issue } from "../impl/error"
import { Loc, Pos } from "../impl/pos"
import { K, KWS, OPS_KEYED } from "./token"

class Scanned {
  constructor(
    readonly k: K,
    readonly pos: Pos,
  ) {}
}

const WS0 = " ".charCodeAt(0)
const WS1 = "\n".charCodeAt(0)
const WS2 = "\r".charCodeAt(0)
const WS3 = "\t".charCodeAt(0)

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

// const TOKENS: [RegExp, (pos: Pos, match: string) => Scanned][] = [
//   [/^(?:\.\d+|\d+\.(?:\d+)?)(?:[Ee][+-]?\d+)?/, (p) => new Scanned(K.Num, p)],
//   [/^\d+/, (p) => new Scanned(K.Int, p)],
//   [/^[A-Za-z_]\w*/, (p) => new Scanned(K.Ident, p)],
// ]

function isAlpha(code: number) {
  return (
    code == CODE__
    || (CODE_A <= code && code <= CODE_Z)
    || (CODE_a <= code && code <= CODE_z)
  )
}

export function scan(file: string, text: string): Scanned[] {
  let row = 1
  let col = 0
  const ret = []

  let i = 0
  next: for (; i < text.length; ) {
    let code
    while (
      ((code = text.charCodeAt(i)),
      code == WS0 || code == WS1 || code == WS2 || code == WS3)
    ) {
      if (code == CODE_NL) {
        row++
        col = 1
      } else {
        col++
      }
      i++
    }
    if (i >= text.length) {
      break
    }

    const start = new Loc(row, col, i)

    const entry = OPS_KEYED.get(code)
    if (entry) {
      i++
      const code2 = text.charCodeAt(i)
      if (entry.has(code2)) {
        i++
        const op = entry.get(code2)!
        if (op == K.Comment) {
          while (i < text.length && text.charCodeAt(i) != CODE_NL) {
            i++
          }
        }
        const end = new Loc(row, col, i)
        ret.push(new Scanned(op, new Pos(file, start, end)))
      } else if (entry.has(0)) {
        const end = new Loc(row, col, i)
        ret.push(new Scanned(entry.get(0)!, new Pos(file, start, end)))
      } else {
        issue(`Unknown operator '${text[i]!}'`, new Pos(file, start, start))
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
        while (((code = text.charCodeAt(i)), CODE_0 <= code && code <= CODE_9))
          i++
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
          if (next == CODE_P || next == CODE_M) i++
          i++
          while (
            i < text.length
            && (code = text.charCodeAt(++i))
            && CODE_0 <= next
            && next <= CODE_9
          );
        }
      }

      const pos = new Pos(file, start, new Loc(row, col, i))
      ret.push(new Scanned(num ? K.Num : K.Int, pos))
      continue
    }

    if (isAlpha(code)) {
      while (
        (code = text.charCodeAt(++i))
        && (isAlpha(code) || (CODE_0 <= code && code <= CODE_9))
      );

      const word = text.slice(start.idx, i)
      const pos = new Pos(file, start, new Loc(row, col, i))
      ret.push(new Scanned(KWS.get(word) ?? K.Ident, pos))
      continue
    }

    if (i < text.length) {
      const pos = new Pos(file, new Loc(row, col, i), new Loc(row, col, i))
      issue(`Unknown character '${text[i]}'.`, pos)
    } else break
  }

  return ret
}
