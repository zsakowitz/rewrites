import * as Z from "../../parsers/parser-5"

export type Vowel =
  | "a"
  | "e"
  | "i"
  | "o"
  | "u"
  | "ä"
  | "ë"
  | "ö"
  | "ü"
  | "á"
  | "é"
  | "í"
  | "ó"
  | "ú"
  | "â"
  | "ê"
  | "ô"
  | "û"

export const Vowel = Z.regex(/^[aeiouäëöüáéíóúâêôû]/i).map(
  (result) => result[0] as Vowel,
)

export const VowelGroup = Z.regex(/^[aeiouäëöüáéíóúâêôû]+/i).map(
  (result) => result[0],
)

export const Consonant = Z.regex(/^(?![^aeiouäëöüáéíóúâêôû])\p{L}/iu).map(
  (result) => result[0] as Vowel,
)

export const ConsonantGroup = Z.regex(
  /^(?:(?![^aeiouäëöüáéíóúâêôû])\p{L})+/iu,
).map((result) => result[0])

export const NonGlottalStopConsonant = Z.regex(
  /^(?![^aeiouäëöüáéíóúâêôû'‘’])\p{L}/iu,
).map((result) => result[0] as Vowel)

export const NonGlottalStopConsonantGroup = Z.regex(
  /^(?:(?![^aeiouäëöüáéíóúâêôû'‘’])\p{L})+/iu,
).map((result) => result[0])
