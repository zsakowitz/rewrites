import { deepFreeze } from "../helpers/deep-freeze"

export type Affiliation = "CSL" | "COA" | "ASO" | "VAR"

export const ALL_AFFILIATIONS: readonly Affiliation[] = deepFreeze([
  "CSL",
  "COA",
  "ASO",
  "VAR",
])

export const AFFILIATION_TO_NAME_MAP = deepFreeze({
  CSL: "Consolidative",
  COA: "Coalescent",
  ASO: "Associative",
  VAR: "Variative",
})

export const AFFILIATION_TO_LETTER_MAP = deepFreeze({
  CSL: ["", ""],
  COA: ["r", "rļ"],
  ASO: ["l", "nļ"],
  VAR: ["ř", "n"],
})

export function affiliationToIthkuil(
  affiliation: Affiliation,
  isStandalone: boolean,
): string {
  return AFFILIATION_TO_LETTER_MAP[affiliation][+isStandalone as 0 | 1]
}
