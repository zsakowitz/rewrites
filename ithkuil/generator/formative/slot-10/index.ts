import { applyStress, countVowelForms } from "../../stress"

export type SlotX = "UNF/C" | "UNF/K" | "FRM"

export function applySlotXStress(word: string, stress: SlotX) {
  const vowelFormCount = countVowelForms(word)

  if (stress == "UNF/C") {
    if (vowelFormCount >= 2) {
      return word
    }

    throw new Error(`The formative '${word}' cannot be marked nominal.`)
  }

  if (stress == "UNF/K") {
    if (vowelFormCount == 1) {
      return word
    }

    return applyStress(word, -1)
  }

  if (stress == "FRM") {
    return applyStress(word, -3)
  }

  throw new Error("Invalid stress type '" + stress + "'.")
}
