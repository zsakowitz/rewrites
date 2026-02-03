// An arbitrary precision complex number library.

import { Fraction } from "./fraction.js"

export class Complex {
    readonly real: Fraction
    readonly imag: Fraction

    constructor(real = new Fraction(0n, 1n), imag = new Fraction(0n, 1n)) {
        this.real = real
        this.imag = imag
    }

    plus(other: Complex) {
        return new Complex(
            this.real.plus(other.real),
            this.imag.plus(other.imag),
        )
    }

    minus(other: Complex) {
        return new Complex(
            this.real.minus(other.real),
            this.imag.minus(other.imag),
        )
    }

    times(other: Complex) {
        return new Complex(
            this.real.times(other.real).minus(this.imag.times(other.imag)),
            this.imag.times(other.real).plus(this.real.times(other.imag)),
        )
    }

    conj() {
        return new Complex(this.real, this.imag.negate())
    }

    dividedBy(other: Complex) {
        const partial = this.times(other.conj())
        const bottom = other.real.square().plus(other.imag.square())

        return new Complex(
            partial.real.dividedBy(bottom),
            partial.imag.dividedBy(bottom),
        )
    }
}

// (a + bi) / (c + di)
// (a+bi)(c-di) / (c+di)(c-di)
// (a+bi)(c-di) / (c^2+d^2)
