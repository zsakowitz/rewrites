export function assert(condition: boolean): asserts condition {
    if (!condition) {
        throw new Error("Assertion failed.")
    }
}

export function unreachable(): never {
    throw new Error("Reached unreachable branch.")
}
