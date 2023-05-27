import { deepFreeze } from "../../../deep-freeze"

export type Function = "STA" | "DYN"

export const ALL_FUNCTIONS: readonly Function[] = deepFreeze(["STA", "DYN"])

export const FUNCTION_TO_NAME_MAP = deepFreeze({
  STA: "Static",
  DYN: "Dynamic",
})
