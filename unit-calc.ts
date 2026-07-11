interface Frac {
    n: bigint
    d: bigint // must be positive (and therefore nonzero)
}

interface Value {
    v: Frac // the most precise value for this number
    p: number // the precision of this number. "0" is for inputs like "4", which is more like `[4 +/- 5*10^0]`. "-1" is for inputs like "3.4", which is more like `[3.4 +/- 5*10^-1]`
    u: Units
}

/** Each item represents the number of exponents of this power that we have. */
interface Units {
    s: number // seconds
    B: number // buckets
    EU: number // GregTech EU
    m: number // meters
    i: number // items
}

const UNITS = ["s", "B", "EU", "m", "i"] as const

function uPrintRaw(a: Units) {
    let text = ""

    for (const unit of UNITS) {
        if (a[unit] !== 0) {
            text += `${unit}^${a[unit]} `
        }
    }

    return text.trim() || "unitless"
}

function uEnsureCompatible(a: Units, b: Units) {
    for (const unit of UNITS) {
        if (a[unit] !== b[unit]) {
            throw new Error(
                `${uPrintRaw(a)} and ${uPrintRaw(b)} cannot be added together`,
            )
        }
    }
}

function uProd(a: Units, b: Units) {
    return {
        s: a.s + b.s,
        B: a.B + b.B,
        EU: a.EU + b.EU,
        m: a.m + b.m,
        i: a.i + b.i,
    }
}

function uPow(a: Units, exp: number) {
    return {
        s: a.s * exp,
        B: a.B * exp,
        EU: a.EU * exp,
        m: a.m * exp,
        i: a.i * exp,
    }
}
