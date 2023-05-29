import { deepFreeze } from "../../helpers/deep-freeze"

export type AffixualAdjunctScope =
  | "V:DOM"
  | "V:SUB"
  | "VII:DOM"
  | "VII:SUB"
  | "FORMATIVE"
  | "ADJACENT"

export const ALL_AFFIXUAL_ADJUNCT_SCOPES: readonly AffixualAdjunctScope[] =
  /* @__PURE__ */ deepFreeze([
    "V:DOM",
    "V:SUB",
    "VII:DOM",
    "VII:SUB",
    "FORMATIVE",
    "ADJACENT",
  ])

export const AFFIXUAL_ADJUNCT_SCOPE_TO_ITHKUIL_MAP = /* @__PURE__ */ deepFreeze(
  {
    vs: {
      "V:DOM": "a",
      "V:SUB": "u",
      "VII:DOM": "e",
      "VII:SUB": "i",
      FORMATIVE: "o",
      ADJACENT: "ö",
    },
    cz: {
      "V:DOM": "h",
      "V:SUB": "'h",
      "VII:DOM": "'hl",
      "VII:SUB": "'hr",
      FORMATIVE: "hw",
      ADJACENT: "'hw",
    },
  },
)

export const AFFIXUAL_ADJUNCT_SCOPE_TO_NAME_MAP = /* @__PURE__ */ deepFreeze({
  "V:DOM": "Last of Slot V",
  "V:SUB": "First of Slot V",
  "VII:DOM": "Last of Slot VII",
  "VII:SUB": "First of Slot VII",
  FORMATIVE: "Entire Formative",
  ADJACENT: "Formative + Affixes",
})

export function affixualAdjunctScopeToIthkuil(
  scope: AffixualAdjunctScope,
  type: "vs" | "cz" | "vz",
  omitWhenPossible: boolean,
): string {
  if (type == "vs" && scope == "V:DOM" && omitWhenPossible) {
    return ""
  }

  return AFFIXUAL_ADJUNCT_SCOPE_TO_ITHKUIL_MAP[type == "vz" ? "vs" : type][
    scope
  ]
}
