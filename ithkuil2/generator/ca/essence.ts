import { deepFreeze } from "../../deep-freeze"

export type Essence = "NRM" | "RPV"

export const ALL_ESSENCES: readonly Essence[] = deepFreeze(["NRM", "RPV"])

export const ESSENCE_TO_NAME_MAP = deepFreeze({
  NRM: "Normal",
  RPV: "Representative",
} as const)
