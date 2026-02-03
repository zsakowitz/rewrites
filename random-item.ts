// Picks a random item from an array.

export function randomItem<T>(values: readonly [T, ...T[]]): T
export function randomItem<T>(values: readonly T[]): T | undefined
export function randomItem<T extends string>(
    values: T,
): string extends T ? string | undefined
: T extends "" ? string | undefined
: string
export function randomItem<T>(values: ArrayLike<T> & { 0: T }): T
export function randomItem<T>(values: ArrayLike<T>): T | undefined
export function randomItem<T>(values: ArrayLike<T>): T | undefined {
    return values[Math.floor(Math.random() * values.length)]
}
