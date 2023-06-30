// Tetration is repeated exponentiation. It is defined for any base `a` and any
// natural "exponent" `n` as the following:
//
//     a^^0 = 1,
//     a^^n = a^(a^^(n-1)).
//
// However, it can be extended to complex exponents using formulas. One of these
// such extensions is available on MathOverflow at https://mathoverflow.net/a/259371.
//
// This file implements the extension proposed there. I'd provide an accompanying
// Desmos graph, but Desmos doesn't understand tetration.

import D from "decimal.js"
import { gamma } from "./gamma.js"

const Decimal = D as typeof D.default
type Decimal = D.default

function factorial(x: Decimal): Decimal {
  if (x.lessThan(0) && x.floor().equals(x)) {
    return new Decimal(Infinity)
  }

  return gamma(x.plus(1))
}

function tetrate(base: Decimal, exponent: number): Decimal {
  let result = new Decimal(1)

  for (let i = 0; i < exponent; i++) {
    result = base.pow(result)
  }

  return result
}

function tetrateAny(
  a: Decimal | number,
  z: Decimal | number,
  approx: number,
): Decimal {
  a = new Decimal(a)
  z = new Decimal(z)

  let result = new Decimal(0)

  for (let n = 0; n <= approx; n++) {
    for (let k = 0; k <= n; k++) {
      result = result.plus(
        factorial(z)
          .dividedBy(factorial(new Decimal(k)))
          .dividedBy(factorial(new Decimal(n - k)))
          .dividedBy(factorial(z.minus(n)))
          .times(tetrate(a, k))
          .times((-1) ** (n - k)),
      )
    }
  }

  return result
}
