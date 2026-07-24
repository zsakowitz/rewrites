export interface Frac {
    n: bigint

    /** Must be positive. */
    d: bigint
}

function gcd(a: bigint, b: bigint): bigint {
    while (b !== 0n) {
        const t = a % b
        a = b
        b = t
    }

    return a
}

/**
 * Assumes `body` matches one of these regular expressions:
 *
 * - `/^[0-9]+(\.[0-9]+)?(e[+-]?[0-9]+)?$/i`
 * - `/^0x[0-9a-f]+(\.[0-9a-f]+)?(e[+-]?[0-9a-f]+)?$/i`
 */
export function readFrac(body: string): Frac {
    body = body.toLowerCase().replaceAll("_", "")

    let base: 10 | 16 = 10

    if (body.startsWith("0x")) {
        base = 16
        body = body.slice(2)
    }

    const e = body.indexOf(base === 16 ? "p" : "e")
    let exponent = e === -1 ? 0n : BigInt(body.slice(e + 1))

    const mantissaRaw = body.slice(0, e === -1 ? body.length : e)
    const mantissa = BigInt((base === 16 ? "0x" : "") + mantissaRaw.replace(".", ""))

    const mantissaDot = mantissaRaw.indexOf(".")
    const mantissaDecimalPlaces =
        mantissaDot === -1 ? 0n : BigInt(mantissaRaw.length - mantissaDot - 1)
    if (e === 16) exponent -= 4n * mantissaDecimalPlaces
    else exponent -= mantissaDecimalPlaces

    return simplify({
        n: mantissa * (exponent > 0n ? BigInt(base) ** exponent : 1n),
        d: exponent < 0n ? BigInt(base) ** -exponent : 1n,
    })
}

export function simplify(f: Frac): Frac {
    const g = gcd(f.n, f.d)
    return { n: f.n / g, d: f.d / g }
}
