import type { Essence } from "../ca"
import { applyStress, countVowelForms } from "../helpers/stress"

export function applyReferentialEssence(word: string, essence: Essence) {
  if (essence == "NRM") {
    return word
  }

  if (!word.startsWith("ë") && countVowelForms(word) < 2) {
    word = "ë" + word
  }

  return applyStress(word, -1)
}
