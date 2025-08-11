import { issue } from "../impl/error"
import { Loc, Pos } from "../impl/pos"
import { ANY_OP_REGEX, K, OPS } from "./token"

class Scanned {
  constructor(
    readonly k: K,
    readonly pos: Pos,
  ) {}
}

const WS0 = " ".charCodeAt(0)
const WS4 = "\n".charCodeAt(0)
const WS5 = "\r".charCodeAt(0)
const WS6 = "\t".charCodeAt(0)

const CODE_NL = "\n".charCodeAt(0)

const TOKENS: [RegExp, (pos: Pos, match: string) => Scanned][] = [
  [/^(?:\.\d+|\d+\.(?:\d+)?)(?:[Ee][+-]?\d+)?/, (p) => new Scanned(K.Num, p)],
  [/^\d+/, (p) => new Scanned(K.Int, p)],
  // TODO: Str
  [/^\/\/.*/, (p) => new Scanned(K.Comment, p)],
  [ANY_OP_REGEX, (p, match) => new Scanned(OPS.get(match)!, p)],
  [/^[A-Za-z_]\w*/, (p) => new Scanned(K.Ident, p)],
]

export function scan(file: string, text: string): Scanned[] {
  let row = 1
  let col = 0
  const ret = []

  let i = 0
  next: for (; i < text.length; ) {
    let code
    while (
      ((code = text.charCodeAt(i)),
      code == WS0 || code == WS4 || code == WS5 || code == WS6)
    ) {
      if (code == CODE_NL) {
        row++
        col = 1
      } else {
        col++
      }
      i++
    }

    for (const [regex, fn] of TOKENS) {
      const match = text.slice(i).match(regex)
      if (match) {
        const start = new Loc(row, col, i)
        i += match[0].length
        col += match[0].length
        const end = new Loc(row, col, i)
        ret.push(fn(new Pos(file, start, end), match[0]))
        continue next
      }
    }

    if (i < text.length) {
      const pos = new Pos(file, new Loc(row, col, i), new Loc(row, col, i))
      issue(`Unknown character '${text[i]}'.`, pos)
    } else break
  }

  return ret
}
