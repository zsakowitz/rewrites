import { deepFreeze } from "../../helpers/deep-freeze"

export type ModularAdjunctScope =
  | "CASE/MOOD+ILL/VAL"
  | "CASE/MOOD"
  | "FORMATIVE"
  | "ADJACENT"

export const ALL_MODULAR_ADJUNCT_SCOPES: readonly ModularAdjunctScope[] =
  /* @__PURE__ */ deepFreeze([
    "CASE/MOOD+ILL/VAL",
    "CASE/MOOD",
    "FORMATIVE",
    "ADJACENT",
  ])

export const MODULAR_ADJUNCT_SCOPE_TO_ITHKUIL_MAP = /* @__PURE__ */ deepFreeze({
  "CASE/MOOD+ILL/VAL": "a",
  "CASE/MOOD": "e",
  FORMATIVE: "i",
  ADJACENT: "o",
})

export const MODULAR_ADJUNCT_SCOPE_TO_DESCRIPTION_MAP =
  /* @__PURE__ */ deepFreeze({
    "CASE/MOOD+ILL/VAL": "has scope over Case/Mood and Validation + Illocution",
    "CASE/MOOD": "has scope over Case/Mood",
    FORMATIVE: "has scope over the formative as a whole",
    ADJACENT: "has scope over the formative and adjacent adjuncts",
  })

export function modularAdjunctScopeToIthkuil(type: ModularAdjunctScope) {
  return MODULAR_ADJUNCT_SCOPE_TO_ITHKUIL_MAP[type]
}
