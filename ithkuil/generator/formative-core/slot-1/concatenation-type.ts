import { deepFreeze } from "../../../deep-freeze"

export type ConcatenationType = 1 | 2

export const ALL_CONCATENATION_TYPES: readonly ConcatenationType[] = deepFreeze(
  [1, 2],
)
