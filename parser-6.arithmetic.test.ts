// Parser arithmetic using parser-6.ts.

import * as Z from "./parser-6"

const OptionalWhitespace = Z.voidify(Z.regex(/^\s*/))

const Number = Z.map(
  Z.regex(/^[+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?/),
  (value) => +value[0]
)

export const ExprLevel3: Z.Parser<number> = Z.choice(
  Number,
  Z.map(
    Z.seq(
      Z.text("("),
      OptionalWhitespace,
      Z.lazy(() => ExprLevel1),
      OptionalWhitespace,
      Z.text(")")
    ),
    (value) => value[2]
  )
)

export const ExprLevel2: Z.Parser<number> = Z.map(
  Z.seq(
    ExprLevel3,
    Z.many(
      Z.seq(
        OptionalWhitespace,
        Z.choice(Z.text("*"), Z.text("/")),
        OptionalWhitespace,
        ExprLevel3
      )
    )
  ),
  ([initial, next]) =>
    next.reduce((a, b) => {
      if (b[1] == "*") {
        return a * b[3]
      } else {
        return a / b[3]
      }
    }, initial)
)

export const ExprLevel1: Z.Parser<number> = Z.map(
  Z.seq(
    ExprLevel2,
    Z.many(
      Z.seq(
        OptionalWhitespace,
        Z.choice(Z.text("+"), Z.text("-")),
        OptionalWhitespace,
        ExprLevel2
      )
    )
  ),
  ([initial, next]) =>
    next.reduce((a, b) => {
      if (b[1] == "+") {
        return a + b[3]
      } else {
        return a - b[3]
      }
    }, initial)
)

export const parse = Z.createParseFn(ExprLevel1)
