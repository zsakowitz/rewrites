import { assert } from "./assert"

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

export function clz(bits: number, value: bigint): number {
    if (value < 0n) return 0
    if (value === 0n) return bits
    if (bits <= 32) return Math.clz32(Number(value)) - (32 - bits)
    return bits - value.toString(2).length
}

export function idivFloor(n: bigint, d: bigint): bigint {
    assert(d !== 0n)

    const rem = n % d
    if (rem === 0n) return n / d
    return n < 0n != d < 0n ? n / d - 1n : n / d
}

assert(idivFloor(-3n, 3n) === -1n)
assert(idivFloor(-2n, 3n) === -1n)
assert(idivFloor(-1n, 3n) === -1n)
assert(idivFloor(0n, 3n) === 0n)
assert(idivFloor(1n, 3n) === 0n)
assert(idivFloor(2n, 3n) === 0n)
assert(idivFloor(3n, 3n) === 1n)
assert(idivFloor(4n, 3n) === 1n)
assert(idivFloor(5n, 3n) === 1n)
assert(idivFloor(6n, 3n) === 2n)

assert(idivFloor(-3n, -3n) === 1n)
assert(idivFloor(-2n, -3n) === 0n)
assert(idivFloor(-1n, -3n) === 0n)
assert(idivFloor(0n, -3n) === 0n)
assert(idivFloor(1n, -3n) === -1n)
assert(idivFloor(2n, -3n) === -1n)
assert(idivFloor(3n, -3n) === -1n)
assert(idivFloor(4n, -3n) === -2n)
assert(idivFloor(5n, -3n) === -2n)
assert(idivFloor(6n, -3n) === -2n)

export function idivCeil(n: bigint, d: bigint): bigint {
    assert(d !== 0n)

    const rem = n % d
    if (rem === 0n) return n / d
    return n < 0n != d < 0n ? n / d : n / d + 1n
}

assert(idivCeil(-3n, 3n) === -1n)
assert(idivCeil(-2n, 3n) === 0n)
assert(idivCeil(-1n, 3n) === 0n)
assert(idivCeil(0n, 3n) === 0n)
assert(idivCeil(1n, 3n) === 1n)
assert(idivCeil(2n, 3n) === 1n)
assert(idivCeil(3n, 3n) === 1n)
assert(idivCeil(4n, 3n) === 2n)
assert(idivCeil(5n, 3n) === 2n)
assert(idivCeil(6n, 3n) === 2n)

assert(idivCeil(-3n, -3n) === 1n)
assert(idivCeil(-2n, -3n) === 1n)
assert(idivCeil(-1n, -3n) === 1n)
assert(idivCeil(0n, -3n) === 0n)
assert(idivCeil(1n, -3n) === 0n)
assert(idivCeil(2n, -3n) === 0n)
assert(idivCeil(3n, -3n) === -1n)
assert(idivCeil(4n, -3n) === -1n)
assert(idivCeil(5n, -3n) === -1n)
assert(idivCeil(6n, -3n) === -2n)
