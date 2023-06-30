import { ConsonantForm } from "./consonant-form.js"
import { freezeNullPrototype } from "./null-proto-frozen.js"
import { ParsedWord, type Stress } from "./parsed-word.js"
import { VowelForm } from "./vowel-form.js"

export type LetterForm = VowelForm | ConsonantForm

const VOWELS = "aeiouäëöüáéíóúìùâêôû'"
const STRESSED_VOWELS = "áéíóúâêôû"

const STRESSED_TO_UNSTRESSED_MAP = {
  á: "a",
  é: "e",
  í: "i",
  ó: "o",
  ú: "u",
  â: "ä",
  ê: "ë",
  ô: "ö",
  û: "ü",
}

const LETTER_SUBSTITUTIONS = freezeNullPrototype({
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
  "‘": "'",
  "’": "'",
})

function makeSubstitutions(text: string): string {
  return text.replace(
    /ḍ|đ|ı|ì|ȷ|ł|ḷ|l͕|n͕|ṇ|ṛ|r͕|ṭ|ŧ|ù|‘|’/g,
    (x) => (LETTER_SUBSTITUTIONS as any)[x],
  )
}

const LETTER_FORM = /[aeiouäëöüáéíóúìùâêôû']+|[^aeiouäëöüáéíóúìùâêôû']+/g

export function parseWord(text: string) {
  if (text.startsWith("'")) {
    text = text.slice(1)
  }

  if (text.length == 0) {
    throw new Error("Cannot parse zero-character words.")
  }

  text = makeSubstitutions(text).toLowerCase()

  const forms = text.match(LETTER_FORM)!.map<LetterForm>((text) => {
    if (VOWELS.includes(text[0]!)) {
      text = text
        .split("")
        .map((char) => {
          if (STRESSED_VOWELS.includes(char)) {
            return (STRESSED_TO_UNSTRESSED_MAP as any)[char]
          }

          return char
        })
        .join("")

      const value = VowelForm.parse(text)

      if (value == null) {
        throw new Error("Invalid vowel form: '" + text + "'.")
      }

      return value
    } else {
      return new ConsonantForm(text)
    }
  })

  const syllables = text.match(
    /[aeiouäëöüáéíóúìùâêôû]'?|[aáeéëêoóuú][ií]|[aáeéëêoóií][uú]/g,
  )

  let stress: Stress

  if (syllables) {
    if (syllables.length == 1) {
      stress = "monosyllabic"
    } else {
      const stressedSyllables = syllables.map((x) =>
        x.split("").some((y) => "áéíóúâêôû".includes(y)),
      )

      const stressedSyllable = stressedSyllables.findIndex((x) => x)
      const lastStressedSyllable = stressedSyllables.findLastIndex((x) => x)

      if (stressedSyllable != lastStressedSyllable) {
        throw new Error("Multiple syllables are stressed.")
      }

      if (stressedSyllable == -1) {
        stress = "unmarked"
      } else if (stressedSyllable == syllables.length - 1) {
        stress = "ultimate"
      } else if (stressedSyllable == syllables.length - 2) {
        stress = "penultimate"
      } else if (stressedSyllable == syllables.length - 3) {
        stress = "antepenultimate"
      } else {
        throw new Error(
          "The stressed syllable in '" +
            text +
            "' cannot be " +
            (syllables.length - stressedSyllable) +
            " syllables from the end.",
        )
      }
    }
  } else {
    stress = "zerosyllabic"
  }

  return new ParsedWord(forms, stress)
}
