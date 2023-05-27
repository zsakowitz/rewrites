import { deepFreeze } from "../../helpers/deep-freeze"

export type Mood = "FAC" | "SUB" | "ASM" | "SPC" | "COU" | "HYP"

export const ALL_MOODS: readonly Mood[] = deepFreeze([
  "FAC",
  "SUB",
  "ASM",
  "SPC",
  "COU",
  "HYP",
])

export const MOOD_TO_LETTER_MAP = deepFreeze({
  false: {
    FAC: "h",
    SUB: "hl",
    ASM: "hr",
    SPC: "hm",
    COU: "hn",
    HYP: "hň",
  },
  true: {
    FAC: "w",
    SUB: "hw",
    ASM: "hrw",
    SPC: "hmw",
    COU: "hnw",
    HYP: "hňw",
  },
})

export const MOOD_TO_NAME_MAP = deepFreeze({
  FAC: "Factual",
  SUB: "Subjunctive",
  ASM: "Assumptive",
  SPC: "Speculative",
  COU: "Counterfactive",
  HYP: "Hypothetical",
})

export function moodToIthkuil(
  mood: Mood,
  whatDoesSlot8Contain: "aspect" | "non-aspect" | "empty",
) {
  const value = MOOD_TO_LETTER_MAP[`${whatDoesSlot8Contain == "aspect"}`][mood]

  if (value == "h" && whatDoesSlot8Contain == "empty") {
    return ""
  }

  return value
}
