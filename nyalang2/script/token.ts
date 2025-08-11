export const enum K {
  // Core values; see Keywords for `true`, `false`, and `null`
  Int,
  Num,
  Str,

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
  ["^", K.Carat],
  ["%", K.Percent],
  ["&", K.Amp],
  ["|", K.Bar],
  ["\\", K.Backslash],

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
  ["_", K.Underscore],

  ["(", K.OLParen],
  ["[", K.OLBrack],
  ["{", K.OLBrace],
  ["<", K.OLAngle],
  ["${", K.OLIterp],
  [")", K.ORParen],
  ["]", K.ORBrack],
  ["}", K.ORBrace],
  [">", K.ORAngle],

  ["true", K.KTrue],
  ["false", K.KFalse],
  ["null", K.KNull],
  ["fn", K.KFn],
])

export const ANY_OP_REGEX = new RegExp(
  "^(?:"
    + Array.from(OPS.keys())
      .sort((a, b) => b.length - a.length)
      .map((x) => x.replace(/[+*^|\\{}()[\]$?]/g, (x) => "\\" + x))
      .join("|")
    + ")",
)
