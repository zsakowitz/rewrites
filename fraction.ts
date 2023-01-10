// Expresses arbitrary precision fractions using bigints.

export function gcd(a: bigint, b: bigint): bigint {
  if (b) {
    return gcd(b, a % b)
  } else {
    return a
  }
}

export function lcm(a: bigint, b: bigint): bigint {
  return (a * b) / gcd(a, b)
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

  constructor(readonly top: bigint, readonly bottom: bigint) {
    if (bottom === 0n) {
      throw new Error("The denominator of a fraction cannot be 0.")
    }
  }

  simplify(this: FractionLike) {
    const GCD = gcd(this.top, this.bottom)
    return new Fraction(this.top / GCD, this.bottom / GCD)
  }

  flip(this: FractionLike) {
    return new Fraction(this.bottom, this.top)
  }

  times(this: FractionLike, other: FractionLike) {
    return new Fraction(
      this.top * other.top,
      this.bottom * other.bottom
    ).simplify()
  }

  dividedBy(this: FractionLike, other: FractionLike) {
    return new Fraction(
      this.top * other.bottom,
      this.bottom * other.top
    ).simplify()
  }

  plus(this: FractionLike, other: FractionLike) {
    return new Fraction(
      this.top * other.bottom + this.bottom * other.top,
      this.bottom * other.bottom
    ).simplify()
  }

  minus(this: FractionLike, other: FractionLike) {
    return new Fraction(
      this.top * other.bottom - this.bottom * other.top,
      this.bottom * other.bottom
    ).simplify()
  }

  toString(this: FractionLike) {
    if (this.bottom == 1n) {
      return String(this.top)
    }

    return `${this.top}/${this.bottom}`
  }
}
