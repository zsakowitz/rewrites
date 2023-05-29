import { deepFreeze } from "../../helpers/deep-freeze"

export type Function = "STA" | "DYN"

export const ALL_FUNCTIONS: readonly Function[] = /* @__PURE__ */ deepFreeze([
  "STA",
  "DYN",
])

export const FUNCTION_TO_NAME_MAP = /* @__PURE__ */ deepFreeze({
  STA: "Static",
  DYN: "Dynamic",
})
