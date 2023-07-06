import { any, anyText, chars, seq, text } from "./index.js"

export type Stress =
  | "antepenultimate"
  | "penultimate"
  | "ultimate"
  | "unmarked"
  | "monosyllabic"
  | "zerosyllabic"

export interface TransformedWord {
  readonly original: string
  readonly word: string
  readonly stress: Stress
}

function freeze<const T>(value: T): Readonly<T> {
  Object.setPrototypeOf(value, null)
  return Object.freeze(value)
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

export function preTransform(word: string) {
  const original = word

  word = word
    .toLowerCase()
    .replace(/[ḍđıìȷłḷṇṛṭŧù‘’]|l͕|n͕|r͕/g, (x) => (LETTER_SUBSTITUTIONS as any)[x])

  if (word.startsWith("'")) {
    word = word.slice(1)
  }

  const syllables = word.match(
    /[aáeéëêoóuú][ií]|[aáeéëêiíoó][uú]|[aeiouäëöüáéíóúâêôû]/g,
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
    original,
    word: word.replace(
      /[áéíóúâêôû]/g,
      (x) => (STRESSED_TO_UNSTRESSED_VOWEL_MAP as any)[x],
    ),
    stress,
  })
}

export const vowel = chars("aeiouäëöü")

export const vowelOrGlottalStop = chars("aeiouäëöü'")

export const vWithoutStop = vowel.oneOrMore()

export const vWithStop = seq(
  vowelOrGlottalStop.oneOrMore(),
  text("'"),
  vowelOrGlottalStop.zeroOrMore(),
)

export const V = vowelOrGlottalStop.oneOrMore()

export const consonant = chars("pbtdkgfvţḑszšžçxhļcżčjmnňrlwyř")

export const consonantForm = consonant.oneOrMore()

export const geminate = anyText(
  ...("pbtdkgfvţḑszšžçxhļcżčjmnňrlwyř".split("").map((x) => x + x) as [
    any,
    ...any[],
  ]),
)

export const H = any(chars("wy"), seq(text("h"), consonant.zeroOrMore()))
export const notH = chars("wyh").not()

export const C = seq(notH, consonant.oneOrMore())

export const CG = seq(
  notH,
  consonant.zeroOrMore(),
  geminate,
  consonant.zeroOrMore(),
)

export const CNG = seq(
  notH,
  seq(consonant.zeroOrMore(), geminate).not(),
  consonant.oneOrMore(),
)
