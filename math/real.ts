export function gcd(a: bigint, b: bigint): bigint {
    while (b) {
        ;[a, b] = [b, a % b]
    }

    return a
}

export class Rat {
    n
    d

    constructor(n: bigint, d: bigint) {
        if (d == 0n) {
            n = 0n
        } else if (n == 0n) {
            d = 1n
        } else {
            if (d < 0n) {
                n = -n
                d = -d
            }

            const g = gcd(n, d)
            n = n / g
            d = d / g
        }

        this.n = n
        this.d = d
    }

    add(rhs: Rat) {
        return new Rat(this.n * rhs.d + this.d * rhs.n, this.d * rhs.d)
    }

    sub(rhs: Rat) {
        return new Rat(this.n * rhs.d - this.d * rhs.n, this.d * rhs.d)
    }

    mul(rhs: Rat) {
        return new Rat(this.n * rhs.n, this.d * rhs.d)
    }

    div(rhs: Rat) {
        return new Rat(this.n * rhs.d, this.d * rhs.n)
    }

    neg() {
        return new Rat(-this.n, this.d)
    }

    inv() {
        return new Rat(this.d, this.n)
    }

    eq(rhs: Rat) {
        return this.n == rhs.n && this.d == rhs.d
    }

    lt(rhs: Rat) {
        return this.n * rhs.d < this.d * rhs.n
    }

    le(rhs: Rat) {
        return this.n * rhs.d <= this.d * rhs.n
    }

    ne(rhs: Rat) {
        return this.n != rhs.n || this.d != rhs.d
    }

    gt(rhs: Rat) {
        return this.n * rhs.d > this.d * rhs.n
    }

    ge(rhs: Rat) {
        return this.n * rhs.d >= this.d * rhs.n
    }
}

export class Real {
    constructor(readonly f: (p: number) => Rat) {}
}
