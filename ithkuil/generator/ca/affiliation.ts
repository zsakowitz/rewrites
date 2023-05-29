import { deepFreeze } from "../helpers/deep-freeze"

export type Affiliation = "CSL" | "COA" | "ASO" | "VAR"

export const ALL_AFFILIATIONS: readonly Affiliation[] =
  /* @__PURE__ */ deepFreeze(["CSL", "COA", "ASO", "VAR"])

export const AFFILIATION_TO_NAME_MAP = /* @__PURE__ */ deepFreeze({
  CSL: "Consolidative",
  COA: "Coalescent",
  ASO: "Associative",
  VAR: "Variative",
})

export const AFFILIATION_TO_ITHKUIL_MAP = /* @__PURE__ */ deepFreeze({
  CSL: ["", ""],
  COA: ["r", "rļ"],
  ASO: ["l", "nļ"],
  VAR: ["ř", "n"],
})

export function affiliationToIthkuil(
  affiliation: Affiliation,
  isStandalone: boolean,
): string {
  return AFFILIATION_TO_ITHKUIL_MAP[affiliation][+isStandalone as 0 | 1]
}
