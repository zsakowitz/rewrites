import { deepFreeze } from "../../helpers/deep-freeze"

export type Stem = 1 | 2 | 3 | 0

export const ALL_STEMS: readonly Stem[] = /* @__PURE__ */ deepFreeze([
  1, 2, 3, 0,
])