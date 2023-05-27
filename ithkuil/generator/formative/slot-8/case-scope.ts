import { deepFreeze } from "../../../deep-freeze"

export type CaseScope = "CCN" | "CCA" | "CCS" | "CCQ" | "CCP" | "CCV"

export const ALL_CASE_SCOPES: readonly CaseScope[] = deepFreeze([
  "CCN",
  "CCA",
  "CCS",
  "CCQ",
  "CCP",
  "CCV",
])

export const CASE_SCOPE_TO_LETTER_MAP = deepFreeze({
  false: {
    CCN: "h",
    CCA: "hl",
    CCS: "hr",
    CCQ: "hm",
    CCP: "hn",
    CCV: "hň",
  },
  true: {
    CCN: "w",
    CCA: "hw",
    CCS: "hrw",
    CCQ: "hmw",
    CCP: "hnw",
    CCV: "hňw",
  },
})

export const CASE_SCOPE_TO_NAME_MAP = deepFreeze({
  CCN: "Natural",
  CCA: "Antecedent",
  CCS: "Subaltern",
  CCQ: "Qualifier",
  CCP: "Precedent",
  CCV: "Successive",
})

export function caseScopeToIthkuil(
  caseScope: CaseScope,
  whatDoesSlot8Contain: "aspect" | "non-aspect" | "empty",
) {
  const value =
    CASE_SCOPE_TO_LETTER_MAP[`${whatDoesSlot8Contain == "aspect"}`][caseScope]

  if (value == "h" && whatDoesSlot8Contain == "empty") {
    return ""
  }

  return value
}
