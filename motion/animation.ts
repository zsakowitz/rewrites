// Basic animation functions for Motion.

import { get, to } from "color-string"

export type Easer = (percentage: number) => number

export type Interpolator<T> = (percentage: number, start: T, end: T) => T

export function linear(percentage: number, start = 0, end = 1) {
  return (1 - percentage) * start + percentage * end
}

export function rgb(percentage: number, start: string, end: string) {
  const [sR, sG, sB, sA] = get.rgb(start) || [0, 0, 0, 0]
  const [eR, eG, eB, eA] = get.rgb(end) || [0, 0, 0, 0]

  return to.rgb(
    linear(percentage, sR, eR),
    linear(percentage, sG, eG),
    linear(percentage, sB, eB),
    linear(percentage, sA, eA),
  )
}
