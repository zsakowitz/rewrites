import { deepFreeze } from "./deep-freeze"

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

export function stressVowelForm(vowelForm: string): string {
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

export function countVowelForms(text: string) {
  return text.match(/[aeëou]i|[aeëio]u|[aeiouäëöü]/g)?.length || 0
}

export function applyStress(word: string, position: -4 | -3 | -2 | -1): string {
  const sequences = word.match(/[aeëou]i|[aeëio]u|[aeiouäëöü]|[^aeiouäëöü]+/g)

  if (!sequences) {
    throw new Error("Cannot add stress to an empty word.")
  }

  const vowelFormIndices = sequences
    .map((value, index) => [value, index] as const)
    .filter(([value]) => /[aeiouäëöü]/.test(value))

  const stressType =
    position == -1
      ? "ultimate"
      : position == -2
      ? "penultimate"
      : position == -3
      ? "antepenultimate"
      : position == -4
      ? "preantepenultimate"
      : "(unknown stress)"

  const item = vowelFormIndices.at(position)

  if (!item) {
    throw new Error(
      "Cannot apply " +
        stressType +
        " stress to a word with " +
        vowelFormIndices.length +
        " vowel form" +
        (vowelFormIndices.length == 1 ? "" : "s") +
        ".",
    )
  }

  sequences[item[1]] = stressVowelForm(item[0])

  return sequences.join("")
}
