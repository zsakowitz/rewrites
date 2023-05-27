import { deepFreeze } from "../../../deep-freeze"

export type SlotX = "NOM" | "VRB" | "FRM"

export const VOWEL_TO_STRESSED_VOWEL_MAP = deepFreeze({
  a: "á",
  ä: "â",
  e: "é",
  ë: "ê",
  i: "í",
  o: "ó",
  ö: "ô",
  u: "ú",
  ü: "û",
})

export function addStressMarker(vowelForm: string): string {
  if (vowelForm.length == 0) {
    throw new Error("Expected a vowel form; found ''.")
  }

  const firstChar = vowelForm[0]!

  if (firstChar in VOWEL_TO_STRESSED_VOWEL_MAP) {
    return (
      VOWEL_TO_STRESSED_VOWEL_MAP[
        firstChar as keyof typeof VOWEL_TO_STRESSED_VOWEL_MAP
      ] + vowelForm.slice(1)
    )
  }

  throw new Error("Expected a vowel form; found '" + vowelForm + "'.")
}

export function applySlotXStress(word: string, slot: SlotX): string {
  const sequences = word.match(/[aeiouäëöü]+|[^aeiouäëöü]+/g)

  const stressType =
    slot == "NOM"
      ? "penultimate"
      : slot == "FRM"
      ? "antepenultimate"
      : "ultimate"

  if (!sequences) {
    throw new Error("Cannot add stress to an empty word.")
  }

  const vowelFormIndices = sequences
    .map((value, index) => [value, index] as const)
    .filter(([value]) => /[aeiouäëöü]/.test(value))

  if (vowelFormIndices.length == 0) {
    throw new Error("Cannot add stress to a word with no vowel forms.")
  }

  if (slot == "VRB") {
    if (vowelFormIndices.length == 1) {
      return word
    }

    const [vowelForm, index] = vowelFormIndices.at(-1)!

    sequences[index] = addStressMarker(vowelForm)

    return sequences.join("")
  }

  if (slot == "NOM") {
    if (vowelFormIndices.length == 1) {
      throw new Error("Cannot mark a single-syllable word as a nominal.")
    }

    return word
  }

  if (slot == "FRM") {
    if (vowelFormIndices.length == 1) {
      throw new Error("Cannot mark a single-syllable word as a framed verb.")
    }

    if (vowelFormIndices.length == 2) {
      throw new Error("Cannot mark a dual-syllable word as a framed verb.")
    }

    const [vowelForm, index] = vowelFormIndices.at(-3)!

    sequences[index] = addStressMarker(vowelForm)

    return sequences.join("")
  }

  throw new Error("Invalid word stress: '" + slot + "'.")
}
