import { deepFreeze } from "../../../deep-freeze"

export type ConcatenationType = "none" | 1 | 2

export const ALL_CONCATENATION_TYPES: readonly ConcatenationType[] = deepFreeze(
  ["none", 1, 2],
)
