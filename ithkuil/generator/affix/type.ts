import { deepFreeze } from "../helpers/deep-freeze"

export type AffixType = 1 | 2 | 3

export const ALL_AFFIX_TYPES: readonly AffixType[] = /* @__PURE__ */ deepFreeze(
  [1, 2, 3],
)
