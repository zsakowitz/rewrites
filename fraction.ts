// Expresses arbitrary precision fractions using bigints.

export function gcd(a: bigint, b: bigint): bigint {
  while (b) {
    ;[a, b] = [b, a % b]
  }

  return a
}

export function lcm(a: bigint, b: bigint): bigint {
  return (a * b) / gcd(a, b)
}

export function abs(a: bigint) {
  if (a < 0n) {
    return -a
  }

  return a
}

export type FractionLike = {
  readonly top: bigint
  readonly bottom: bigint
}

export class Fraction implements FractionLike {
  of(value: number | bigint | boolean) {
    if (typeof value == "bigint") {
      return new Fraction(value, 1n)
    }

    if (typeof value == "boolean") {
      return new Fraction(value ? 1n : 0n, 1n)
    }

    if (Number.isNaN(value) || !Number.isFinite(value)) {
      throw new RangeError("Cannot convert " + value + " to a Fraction.")
    }

    let bottom = 1n

    while (value != Math.floor(value)) {
      value *= 10
      bottom *= 10n
    }

    return new Fraction(BigInt(value), bottom)
  }

  readonly top: bigint
  readonly bottom: bigint

  constructor(top: bigint, bottom: bigint) {
    if (bottom === 0n) {
      throw new Error("The denominator of a fraction cannot be 0.")
    }

    if (bottom < 0n) {
      top = -top
      bottom = -bottom
    }

    if (top == 0n) {
      bottom = 1n
    }

    const GCD = gcd(abs(top), abs(bottom))

    this.top = top / GCD
    this.bottom = bottom / GCD
  }

  flip(this: FractionLike) {
    return new Fraction(this.bottom, this.top)
  }

  times(this: FractionLike, other: FractionLike) {
    return new Fraction(this.top * other.top, this.bottom * other.bottom)
  }

  square(this: FractionLike) {
    return new Fraction(this.top * this.top, this.bottom * this.bottom)
  }

  dividedBy(this: FractionLike, other: FractionLike) {
    return new Fraction(this.top * other.bottom, this.bottom * other.top)
  }

  plus(this: FractionLike, other: FractionLike) {
    return new Fraction(
      this.top * other.bottom + this.bottom * other.top,
      this.bottom * other.bottom,
    )
  }

  minus(this: FractionLike, other: FractionLike) {
    return new Fraction(
      this.top * other.bottom - this.bottom * other.top,
      this.bottom * other.bottom,
    )
  }

  negate(this: FractionLike) {
    return new Fraction(-this.top, this.bottom)
  }

  power(this: FractionLike, exponent: bigint) {
    let base = new Fraction(1n, 1n)

    for (let i = 0n; i < exponent; i++) {
      base = base.times(this)
    }

    return base
  }

  toString(this: FractionLike) {
    if (this.bottom == 1n) {
      return String(this.top)
    }

    return `${this.top}/${this.bottom}`
  }
}
