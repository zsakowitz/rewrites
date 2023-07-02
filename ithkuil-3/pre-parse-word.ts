import { freeze } from "./freeze.js"

export type Stress =
  | "antepenultimate"
  | "penultimate"
  | "ultimate"
  | "unmarked"
  | "monosyllabic"
  | "zerosyllabic"

export interface TransformedWord {
  readonly source: string
  readonly normalized: string
  readonly word: string
  readonly stress: Stress
}

const STRESSED_TO_UNSTRESSED_VOWEL_MAP = freeze({
  á: "a",
  é: "e",
  í: "i",
  ó: "o",
  ú: "u",
  â: "ä",
  ê: "ë",
  ô: "ö",
  û: "ü",
})

const LETTER_SUBSTITUTIONS = freeze({
  ḍ: "ḑ",
  đ: "ḑ",
  ı: "i",
  ì: "i",
  ȷ: "j",
  ł: "ļ",
  ḷ: "ļ",
  l͕: "ļ",
  n͕: "ň",
  ṇ: "ň",
  ṛ: "ř",
  r͕: "ř",
  ṭ: "ţ",
  ŧ: "ţ",
  ù: "u",
  ẓ: "ż",
  "‘": "'",
  "’": "'",
})

export function preTransform(word: string): TransformedWord {
  const source = word

  word = word
    .toLowerCase()
    .replace(
      /ḍ|đ|ı|ì|ȷ|ł|ḷ|l͕|n͕|ṇ|ṛ|r͕|ṭ|ŧ|ù|‘|’/g,
      (x) => (LETTER_SUBSTITUTIONS as any)[x],
    )

  if (word.startsWith("'")) {
    word = word.slice(1)
  }

  const normalized = word

  const syllables = word.match(
    /[aáeéëêoóuú][iìí]|[aáeéëêiíoó][uùú]|[aeiouäëöüìùáéíóúâêôû]/g,
  )

  let stress: Stress

  if (syllables == null) {
    stress = "zerosyllabic"
  } else if (syllables.length == 1) {
    stress = "monosyllabic"
  } else {
    const stressed = syllables.map((syllable) => /[áéíóúâêôû]/.test(syllable))

    const index = stressed.findIndex((x) => x)
    const lastIndex = stressed.findLastIndex((x) => x)

    if (index != lastIndex) {
      throw new Error("Two syllables are marked as stressed.")
    }

    if (index == -1) {
      stress = "unmarked"
    } else {
      const value = stressed.length - index

      if (value == 1) {
        stress = "ultimate"
      } else if (value == 2) {
        stress = "penultimate"
      } else if (value == 3) {
        stress = "antepenultimate"
      } else {
        throw new Error("Invalid stress in '" + word + "'.")
      }
    }
  }

  return freeze({
    source,
    normalized,
    word: word.replace(
      /[áéíóúâêôû]/g,
      (x) => (STRESSED_TO_UNSTRESSED_VOWEL_MAP as any)[x],
    ),
    stress,
  })
}
