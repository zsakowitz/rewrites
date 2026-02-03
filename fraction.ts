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

function factorial(n: bigint): bigint {
    let product = 1n

    for (let i = 2n; i <= n; i++) {
        product *= i
    }

    return product
}

function fraction(a: number | bigint, b: number | bigint): Fraction {
    return new Fraction(1n, factorial(BigInt(a)) * factorial(BigInt(b)))
}

const x = [
    fraction(1, 31),
    fraction(3, 29),
    fraction(5, 27),
    fraction(7, 25),
    fraction(9, 23),
    fraction(11, 21),
    fraction(13, 19),
    fraction(15, 17),
]

const y = x.reduce((a, b) => a.plus(b))

const z = y.times(new Fraction(factorial(32n), 1n))

const w = [1, 0].flatMap((ericaA) =>
    [1, 0].flatMap((ericaB) =>
        [1, 0].flatMap((alanA) =>
            [1, 0]
                .filter((alanB) => ericaA + ericaB > alanA + alanB)
                .flatMap((alanB) =>
                    [1, 0].flatMap((ericaC) =>
                        [1, 0].flatMap((ericaD) =>
                            [1, 0].flatMap((alanC) =>
                                [1, 0].flatMap((alanD) =>
                                    [1, 0].flatMap((ericaE) =>
                                        [1, 0].flatMap(
                                            (alanE) =>
                                                ericaA
                                                    + ericaB
                                                    + ericaC
                                                    + ericaD
                                                    + ericaE
                                                > alanA
                                                    + alanB
                                                    + alanC
                                                    + alanD
                                                    + alanE,
                                        ),
                                    ),
                                ),
                            ),
                        ),
                    ),
                ),
        ),
    ),
)
