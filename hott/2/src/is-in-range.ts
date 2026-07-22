export function isInRange(max: number, value: number): boolean {
    return Number.isSafeInteger(value) && 0 <= value && value < max
}
