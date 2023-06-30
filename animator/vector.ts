// A Vector type and helpers for it for Animator.

import { get, type MaybeValue } from "./value.js"

export type Vector = { readonly x: number; readonly y: number }

export type VectorLike = MaybeValue<number | Partial<Vector>>

export function getVector(vector: VectorLike | undefined): Vector {
  const value = get(vector)

  if (typeof value == "number") {
    return { x: value, y: value }
  }

  return { x: value?.x || 0, y: value?.y || 0 }
}
