// Picks a random item from an array.

export function randomItem<T>(values: readonly T[]): T | undefined {
  return values[Math.floor(Math.random() * values.length)]
}
