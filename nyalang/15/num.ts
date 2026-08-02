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

export function intIsSafe(kind: "u" | "i", bits: number, value: bigint): boolean {
    if (kind === "u") {
        return 0n <= value && value < 2n ** BigInt(bits)
    }

    if (bits === 0) {
        return value === 0n
    }

    return -(2n ** BigInt(bits - 1)) <= value && value < 2n ** BigInt(bits - 1)
}

export function floatTruncate(bits: FloatBitSize, value: number): number {
    switch (bits) {
        case 32:
            return Math.fround(value)

        case 64:
            return value
    }
}

export function bitCountWithVariants(count: number): number {
    if (count === 0) return 0

    return 32 - Math.clz32(count - 1)
}
