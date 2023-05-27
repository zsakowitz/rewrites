import { deepFreeze } from "../helpers/deep-freeze"

export type AffixDegree = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0

export const ALL_AFFIX_DEGREES: readonly AffixDegree[] = deepFreeze([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 0,
])
