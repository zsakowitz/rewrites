import { deepFreeze } from "../helpers/deep-freeze"

export type ParsingAdjunct =
  | "monosyllabic"
  | "ultimate"
  | "penultimate"
  | "antepenultimate"

export const ALL_PARSING_ADJUNCTS: readonly ParsingAdjunct[] =
  /* @__PURE__ */ deepFreeze([
    "monosyllabic",
    "ultimate",
    "penultimate",
    "antepenultimate",
  ])

export const PARSING_ADJUNCT_TO_ITHKUIL_MAP = /* @__PURE__ */ deepFreeze({
  monosyllabic: "a'",
  ultimate: "e'",
  penultimate: "o'",
  antepenultimate: "u'",
})

export function parsingAdjunctToIthkuil(adjunct: ParsingAdjunct) {
  return PARSING_ADJUNCT_TO_ITHKUIL_MAP[adjunct]
}
