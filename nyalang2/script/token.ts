export enum K {
  // Core values; see Keywords for `true`, `false`, and `null`
  Int,
  Num,
  NumOrTupleIndex,

  // String parts
  StrFull, // "world"
  StrStart, // "world${
  StrMid, // }world${
  StrFinal, // }world"

  // Arithmetic operators
  Plus,
  Minus,
  Star,
  // if ** is encountered, an error is thrown recommending it be switched to ^
  Slash,
  Carat,
  Percent, // actual modulus (-2%3 == 1), not `rem` like C or JS
  Amp,
  Bar,
  Backslash, // set difference and xor
  At,

  // Logical operators
  Bang,
  AmpAmp,
  BarBar,

  // Comparison operators
  Eq, // ==
  Ne, // !=
  Lt,
  Le, // <=
  Gt,
  Ge, // >=

  // Miscellaneous operators
  Assign, // =
  Comma,
  Dot,
  Colon,
  Arrow, // ->
  ArrowDouble, // =>
  Semi,
  Ques, // ?
  Underscore,

  // Brackets
  OLParen,
  OLBrack,
  OLBrace,
  OLAngle,
  OLIterp, // short for "interpolation", our `${` delimeter in strings
  ORParen,
  ORBrack,
  ORBrace,
  ORAngle,
  ORIterp, // looks the same as `ORBrace`, but it's differentiated in the lexing stage

  // Miscellaneous
  Comment, // only prettier cares about these; we allow only //-style line comments
  Ident,

  // Keywords
  KTrue,
  KFalse,
  KNull,
  KFn,
}

export const OPS = new Map<string, K>([
  ["+", K.Plus],
  ["-", K.Minus],
  ["*", K.Star],
  ["/", K.Slash],
  ["//", K.Comment],
  ["^", K.Carat],
  ["%", K.Percent],
  ["&", K.Amp],
  ["|", K.Bar],
  ["\\", K.Backslash],
  ["@", K.At],

  ["!", K.Bang],
  ["&&", K.AmpAmp],
  ["||", K.BarBar],

  ["==", K.Eq],
  ["!=", K.Ne],
  ["<", K.Lt],
  ["<=", K.Le],
  [">", K.Gt],
  [">=", K.Ge],

  ["=", K.Assign],
  [",", K.Comma],
  [".", K.Dot],
  [":", K.Colon],
  ["->", K.Arrow],
  ["=>", K.ArrowDouble],
  [";", K.Semi],
  ["?", K.Ques],

  ["(", K.OLParen],
  ["[", K.OLBrack],
  ["{", K.OLBrace],
  ["<", K.OLAngle],
  ["${", K.OLIterp],
  [")", K.ORParen],
  ["]", K.ORBrack],
  ["}", K.ORBrace],
  [">", K.ORAngle],
])

/** first char -> (second char | 0) -> K */
export const OPS_KEYED = new Map<number, Map<number, K>>()

for (const [k, v] of OPS) {
  let m = OPS_KEYED.get(k.charCodeAt(0))
  if (!m) {
    m = new Map()
    OPS_KEYED.set(k.charCodeAt(0), m)
  }

  if (k.length == 2) {
    m.set(k.charCodeAt(1), v)
  } else {
    m.set(0, v)
  }
}

export const KWS = new Map<string, K>([
  ["_", K.Underscore],
  ["true", K.KTrue],
  ["false", K.KFalse],
  ["null", K.KNull],
  ["fn", K.KFn],
])
