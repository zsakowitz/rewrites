import { deepFreeze } from "../helpers/deep-freeze"

export type AffixType = 1 | 2 | 3

export const ALL_AFFIX_TYPES: readonly AffixType[] = deepFreeze([1, 2, 3])
