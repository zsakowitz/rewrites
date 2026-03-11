export interface Rat {
    readonly n: bigint
    readonly d: bigint
}

export function int(a: number | bigint | Rat): Rat {
    if (typeof a == "object") {
        return a
    }

    return {
        n: BigInt(a),
        d: 1n,
    }
}

export function rat(a: number | bigint, b: number | bigint): Rat {
    a = BigInt(a)
    b = BigInt(b)

    if (b == 0n) {
        throw new Error("rational denominator cannot be zero")
    }

    if (b < 0n) {
        a = -a
        b = -b
    }

    const d = gcd(a, b)
    return { n: a / d, d: b / d }
}

export function isZero(a: Rat): boolean {
    return a.n == 0n
}

export function add(a: Rat, b: Rat): Rat {
    const n = a.n * b.d + a.d * b.n
    const d = a.d * b.d
    const g = gcd(n > 0n ? n : -n, d)
    return { n: n / g, d: d / g }
}

export function neg(a: Rat): Rat {
    return {
        n: -a.n,
        d: a.d,
    }
}

export function mul(a: Rat, b: Rat): Rat {
    const n = a.n * b.n
    const d = a.d * b.d
    const g = gcd(n > 0n ? n : -n, d)
    return { n: n / g, d: d / g }
}

export function inv(a: Rat): Rat {
    if (a.n == 0n) {
        throw new Error("zero is not invertible")
    }

    return {
        n: a.d,
        d: a.n,
    }
}

export function str(a: Rat): string {
    if (a.d == 1n) {
        return "" + a.n
    }

    return a.n + "/" + a.d
}

function gcd(a: bigint, b: bigint): bigint {
    let c
    while (b != 0n) {
        c = a
        a = b
        b = c % b
    }
    return a
}

export function match(a: Rat[]): bigint[] {
    let lcm = 1n

    for (let i = 0; i < a.length; i++) {
        lcm = (lcm * a[i]!.d) / gcd(lcm, a[i]!.d)
    }

    return a.map((x) => x.n * (lcm / x.d))
}
