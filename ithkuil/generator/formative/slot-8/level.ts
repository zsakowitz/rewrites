import { deepFreeze } from "../../helpers/deep-freeze"

export type Level =
  | "MIN"
  | "SBE"
  | "IFR"
  | "DFT"
  | "EQU"
  | "SUR"
  | "SPL"
  | "SPQ"
  | "MAX"

export const ALL_LEVELS: readonly Level[] = deepFreeze([
  "MIN",
  "SBE",
  "IFR",
  "DFT",
  "EQU",
  "SUR",
  "SPL",
  "SPQ",
  "MAX",
])

export const LEVEL_TO_LETTER_MAP = deepFreeze({
  MIN: "ao",
  SBE: "aö",
  IFR: "eo",
  DFT: "eö",
  EQU: "oë",
  SUR: "öe",
  SPL: "oe",
  SPQ: "öa",
  MAX: "oa",
})

export const LEVEL_TO_NAME_MAP = deepFreeze({
  MIN: "Minimal",
  SBE: "Subequative",
  IFR: "Inferior",
  DFT: "Deficient",
  EQU: "Equative",
  SUR: "Surpassive",
  SPL: "Superlative",
  SPQ: "Superequative",
  MAX: "Maximal",
})

export function levelToIthkuil(level: Level) {
  return LEVEL_TO_LETTER_MAP[level]
}
