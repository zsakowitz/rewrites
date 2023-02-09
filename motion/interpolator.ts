export type Interpolator<T> = (time: number, start: T, end: T) => T

export function linear(time: number, start = 0, end = 1): number {
  if (typeof start != "number" || typeof end != "number") {
    throw new Error("'linear' was passed non-numerical arguments.")
  }

  return start * (time - 1) + end * time
}
