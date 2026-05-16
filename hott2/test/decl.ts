export function eq<T>(actual: T, expected: T) {
    if (actual !== expected) {
        throw new Error(`❌ found ${actual}, expected ${expected}`)
    }
}

const ANSI = /\x1b\[\d+(?:,\d+)*m/g

/** Strips ANSI character sequences from `x`, then checks equality to `y`. */
export function eqAnsi(actual: string, expected: string) {
    if (actual.replaceAll(ANSI, "") !== expected) {
        throw new Error(`❌ found ${actual}, expected ${expected}`)
    }
}
