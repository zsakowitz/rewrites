// TODO: validate that all fractions to float conversions are valid

import type { Frac } from "./frac"

export type FloatBitSize = 32 | 64
export const FLOAT_BIT_SIZES: FloatBitSize[] = [32, 64]

export function floatMinSafeInteger(bits: FloatBitSize): bigint {
    return {
        32: -(2n ** 24n - 1n),
        64: -(2n ** 53n - 1n),
    }[bits]
}

export function floatMaxSafeInteger(bits: FloatBitSize): bigint {
    return {
        32: 2n ** 24n - 1n,
        64: 2n ** 53n - 1n,
    }[bits]
}

export function floatFromFrac(frac: Frac): number {
    return Number(frac.n) / Number(frac.d)
}

export function isSafeInt(kind: "u" | "i", bits: number, value: bigint): boolean {
    if (kind === "u") {
        return 0n <= value && value < 2n ** BigInt(bits)
    }

    if (bits === 0) {
        return value === 0n
    }

    return -(2n ** BigInt(bits - 1)) <= value && value < 2n ** BigInt(bits - 1)
}
