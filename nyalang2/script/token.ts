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
  Percent, // actual modulus (-2%3 == 1), not `rem` like C or JS
  Caret, // exponentiation, not xor

  // Bitwise and set operators
  Shl,
  Shr,
  Tilde, // inverse as prefix, xor as infix
  Amp,
  Bar,
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
  ColonColon,
  Arrow, // ->
  ArrowDouble, // =>
  Semi,
  Ques, // ?
  Underscore,

  // Brackets
  LParen,
  LBrack,
  LBrace,
  OLAngle,
  LIterp, // short for "interpolation", our `${` delimeter in strings
  RParen,
  RBrack,
  RBrace,
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
  KRuntime,
  KSym,
}

export const KWS = new Map<string, K>([
  ["_", K.Underscore],
  ["true", K.KTrue],
  ["false", K.KFalse],
  ["null", K.KNull],
  ["fn", K.KFn],
  ["runtime", K.KRuntime],
  ["sym", K.KSym],
])

export declare namespace K {
  type UnaryPre = K.Bang | K.Plus | K.Minus | K.Tilde

  // Sorted by precedence
  // `+`  being left-associative  means `a + b + c` == `(a + b) + c`
  // `^`  being right-associative means `a ^ b ^ c` == `a ^ (b ^ c)`
  // `<<` being "parens required" means `a << b << c` is a syntax error
  type Binary =
    // Bitwise shifts (parens required)
    | K.Shl
    | K.Shr
    // Bitwise combinations (parens required)
    | K.Amp
    | K.Bar
    | K.Tilde
    // Exponentiation (right-associative)
    | K.Caret
    // Products (left-associative)
    | K.Star
    | K.Slash
    | K.Percent
    | K.At
    // Sums (left-associative)
    | K.Plus
    | K.Minus
    // Equalities (chain like desmos; ineq-ineq or eq-eq, but not in any other ways)
    // e.g. 2 == 3 == 4, 2 < 3 <= 4, and 2 < 3 > 4 are valid, but not 2 < 3 == 4
    | K.Eq
    | K.Ne
    | K.Lt
    | K.Le
    | K.Gt
    | K.Ge
    // Logical AND
    | K.AmpAmp
    // Logical OR
    | K.BarBar
}

export const OPS = new Map<string, K>([
  ["+", K.Plus],
  ["-", K.Minus],
  ["*", K.Star],
  ["/", K.Slash],
  ["//", K.Comment],
  ["^", K.Caret],
  ["%", K.Percent],
  ["&", K.Amp],
  ["|", K.Bar],
  ["~", K.Tilde],
  ["<<", K.Shl],
  [">>", K.Shr],
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
  ["::", K.ColonColon],
  ["->", K.Arrow],
  ["=>", K.ArrowDouble],
  [";", K.Semi],
  ["?", K.Ques],

  ["(", K.LParen],
  ["[", K.LBrack],
  ["{", K.LBrace],
  ["${", K.LIterp],
  [")", K.RParen],
  ["]", K.RBrack],
  ["}", K.RBrace],
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
