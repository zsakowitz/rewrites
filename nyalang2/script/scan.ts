import { type BunInspectOptions } from "bun"
import { issue } from "../impl/error"
import { INSPECT } from "../impl/inspect"
import { Loc, Pos } from "../impl/pos"
import { K, KWS, OPS_KEYED } from "./token"

export class Token<V extends K = K> {
  constructor(
    readonly k: V,
    readonly pos: Pos,
  ) {}

  get content() {
    return this.pos.content
  }

  issue(reason: string): never {
    return issue(reason, this.pos)
  }

  [INSPECT](d: number, p: BunInspectOptions, inspect: typeof Bun.inspect) {
    return `${K[this.k].padEnd(10, " ")} ${inspect(this.pos.content, p)}`
  }
}

export class Scan {
  i = 0

  constructor(
    readonly filename: string,
    readonly end: Pos,
    readonly p: Token[],
  ) {}

  peek() {
    return this.p[this.i]
  }

  eof(): never {
    this.issue("Unexpected end of input.")
  }

  next() {
    return this.p[this.i++] ?? this.eof()
  }

  issue(reason: string): never {
    issue(reason, this.peek()?.pos ?? this.end)
  }

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
          ret += (ret ? "\n" : "") + " ".repeat(indent) + inspect(el, p)
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
      ret += (ret ? "\n" : "") + " ".repeat(indent) + inspect(el, p)
    }
    return ret
  }
}

const WS0 = " ".charCodeAt(0)
const WS1 = "\r".charCodeAt(0)
const WS2 = "\t".charCodeAt(0)

const CODE_BACKSLASH = "\\".charCodeAt(0)
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

export function scan(filename: string, text: string): Scan {
  const depth: { kind: K.OLBrace | K.OLIterp; hashes: number }[] = []
  let row = 1
  let col = 1
  const ret = []

  let i = 0
  let code
  const len = text.length
  while (i < len) {
    code = text.charCodeAt(i)

    switch (code) {
      case CODE_NL:
        row++
        col = 1
        i++
        break
      case WS0:
      case WS1:
      case WS2:
        col++
        i++
        break
      case CODE_HASH:
      case CODE_QUOT:
        parseHashOrQuote()
        break
      case CODE_LBRC:
        depth.push({ kind: K.OLBrace, hashes: 0 })
        i++
        col++
        continue
      case CODE_RBRC: {
        const start = new Loc(row, col, i)
        i++
        col++
        const pos = new Pos(text, start, new Loc(row, col, i))
        const last = depth.pop()
        if (!last) {
          issue("Unmatched closing brace.", pos)
        }
        if (last.kind == K.OLBrace) {
          ret.push(new Token(K.ORBrace, pos))
          continue
        }
        ret.push(new Token(K.ORIterp, pos))
        stringContents(last.hashes, false)
        continue
      }
      case 0x30:
      case 0x31:
      case 0x32:
      case 0x33:
      case 0x34:
      case 0x35:
      case 0x36:
      case 0x37:
      case 0x38:
      case 0x39:
        parseNum()
        break
      case CODE_DOT: {
        const next = text.charCodeAt(i + 1)
        if (CODE_0 <= next && next <= CODE_9) {
          parseNum()
          break
        }
        const start = new Loc(row, col, i)
        i++
        col++
        const end = new Loc(row, col, i)
        ret.push(new Token(K.Dot, new Pos(text, start, end)))
        break
      }
      case 0x41:
      case 0x42:
      case 0x43:
      case 0x44:
      case 0x45:
      case 0x46:
      case 0x47:
      case 0x48:
      case 0x49:
      case 0x4a:
      case 0x4b:
      case 0x4c:
      case 0x4d:
      case 0x4e:
      case 0x4f:
      case 0x50:
      case 0x51:
      case 0x52:
      case 0x53:
      case 0x54:
      case 0x55:
      case 0x56:
      case 0x57:
      case 0x58:
      case 0x59:
      case 0x5a:
      case 0x61:
      case 0x62:
      case 0x63:
      case 0x64:
      case 0x65:
      case 0x66:
      case 0x67:
      case 0x68:
      case 0x69:
      case 0x6a:
      case 0x6b:
      case 0x6c:
      case 0x6d:
      case 0x6e:
      case 0x6f:
      case 0x70:
      case 0x71:
      case 0x72:
      case 0x73:
      case 0x74:
      case 0x75:
      case 0x76:
      case 0x77:
      case 0x78:
      case 0x79:
      case 0x7a:
      case 0x5f: {
        const start = new Loc(row, col, i)
        while (
          (code = text.charCodeAt(++i))
          && (isAlpha(code) || (CODE_0 <= code && code <= CODE_9))
        );

        const word = text.slice(start.idx, i)
        const pos = new Pos(text, start, new Loc(row, col, i))
        ret.push(new Token(KWS.get(word) ?? K.Ident, pos))
        continue
      }
      default: {
        const start = new Loc(row, col, i)
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
            ret.push(new Token(op, new Pos(text, start, end)))
          } else if (entry.has(0)) {
            const end = new Loc(row, col, i)
            ret.push(new Token(entry.get(0)!, new Pos(text, start, end)))
          } else {
            issue(
              `Unknown operator '${text[i - 1]!}'`,
              new Pos(text, start, start),
            )
          }

          continue
        }
      }
    }
  }

  const last = depth.at(-1)
  if (last) {
    const pos = new Pos(text, new Loc(row, col, i), new Loc(row, col, i))
    if (last.kind == K.OLBrace) {
      issue(`Unclosed block.`, pos)
    } else {
      issue(`Unterminated string.`, pos)
    }
  }

  const end = new Pos(text, new Loc(row, col, i), new Loc(row, col, i))

  return new Scan(filename, end, ret)

  function parseNum() {
    const start = new Loc(row, col, i)

    while (
      (code = text.charCodeAt(i))
      && i < text.length
      && CODE_0 <= code
      && code <= CODE_9
    )
      i++

    let tupleIndex = i == start.idx
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
        tupleIndex = false
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
    ret.push(
      new Token(
        tupleIndex ? K.NumOrTupleIndex
        : num ? K.Num
        : K.Int,
        pos,
      ),
    )
  }

  function parseHashOrQuote() {
    let code

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
  }

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
              new Token(
                isStart ? K.StrStart : K.StrMid,
                new Pos(text, start, end),
              ),
            )
            depth.push({ kind: K.OLIterp, hashes })
            i += dollars + 1
            col += dollars + 1
            const end2 = new Loc(row, col, i)
            ret.push(new Token(K.OLIterp, new Pos(text, end, end2)))
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
              new Token(
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
        case CODE_BACKSLASH:
          if (hashes == 0) {
            i++
            col++
            if (text.charCodeAt(i) == CODE_NL) {
              i++
              row++
              col += 1
            } else {
              i++
              col++
            }
            break
          } else {
            i++
            col++
            break
          }
        default:
          i++
          col++
          break
      }
    }
  }
}
