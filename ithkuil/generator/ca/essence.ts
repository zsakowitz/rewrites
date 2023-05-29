import { deepFreeze } from "../helpers/deep-freeze"

export type Essence = "NRM" | "RPV"

export const ALL_ESSENCES: readonly Essence[] = /* @__PURE__ */ deepFreeze([
  "NRM",
  "RPV",
])

export const ESSENCE_TO_NAME_MAP = /* @__PURE__ */ deepFreeze({
  NRM: "Normal",
  RPV: "Representative",
})
