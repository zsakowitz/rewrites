import { deepFreeze } from "../../helpers/deep-freeze"

export type ConcatenationType = "none" | 1 | 2

export const ALL_CONCATENATION_TYPES: readonly ConcatenationType[] =
  /* @__PURE__ */ deepFreeze(["none", 1, 2])
