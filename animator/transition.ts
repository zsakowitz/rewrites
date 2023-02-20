// Basic timing functions and interpolators for Animator.

export type Timing = (percentage: number) => number
export type Interpolator<T> = (percentage: number, start: T, end: T) => T

export function linearMap(percentage: number, start = 0, end = 1): number {
  if (typeof start != "number" || typeof end != "number") {
    throw new TypeError("'linearMap' can only operate on numbers.")
  }

  return (1 - percentage) * start + percentage * end
}
