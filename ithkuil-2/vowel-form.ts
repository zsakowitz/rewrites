import {
  IA_UÄ,
  IE_UË,
  IO_ÜÄ,
  IÖ_ÜË,
  UA_IÄ,
  UE_IË,
  UO_ÖÄ,
  UÖ_ÖË,
  WithWYAlternative,
} from "@zsnout/ithkuil"
import { insertGlottalStop } from "./insert-glottal-stop.js"

export const ALL_VOWEL_FORMS = [
  ,
  ["ae", "a", "ä", "e", "i", "ëi", "ö", "o", "ü", "u"],
  ["ea", "ai", "au", "ei", "eu", "ëu", "ou", "oi", "iu", "ui"],
  ["üo", IA_UÄ, IE_UË, IO_ÜÄ, IÖ_ÜË, "eë", UÖ_ÖË, UO_ÖÄ, UE_IË, UA_IÄ],
  ["üö", "ao", "aö", "eo", "eö", "oë", "öe", "oe", "öa", "oa"],
] as const

export class VowelForm<S extends 1 | 2 | 3 | 4 = 1 | 2 | 3 | 4> {
  static of<S extends 1 | 2 | 3 | 4>(
    sequence: S,
    value: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
    hasGlottalStop = false,
    isAtEndOfWord = false,
  ): S extends 3 ? WithWYAlternative : string {
    const form = ALL_VOWEL_FORMS[sequence][value]

    if (hasGlottalStop) {
      return insertGlottalStop(form, isAtEndOfWord) as any
    } else {
      return form as any
    }
  }

  static parse(text: keyof typeof VOWEL_FORM_TO_OBJECT_MAP): VowelForm

  static parse(text: string): VowelForm | undefined

  static parse(text: string): VowelForm | undefined {
    let hasGlottalStop = text.includes("'")
    text = text.replace(/'/g, "")

    if (text in VOWEL_FORM_TO_OBJECT_MAP) {
      return VOWEL_FORM_TO_OBJECT_MAP[
        text as keyof typeof VOWEL_FORM_TO_OBJECT_MAP
      ].withGlottalStop(hasGlottalStop)
    }
  }

  static parseOrThrow(text: keyof typeof VOWEL_FORM_TO_OBJECT_MAP): VowelForm
  static parseOrThrow(text: string): VowelForm
  static parseOrThrow(text: string): VowelForm {
    let hasGlottalStop = text.includes("'")
    text = text.replace(/'/g, "")

    if (text in VOWEL_FORM_TO_OBJECT_MAP) {
      return VOWEL_FORM_TO_OBJECT_MAP[
        text as keyof typeof VOWEL_FORM_TO_OBJECT_MAP
      ].withGlottalStop(hasGlottalStop)
    }

    throw new Error("Invalid vowel form: " + text + ".")
  }

  constructor(
    readonly sequence: S,
    readonly degree: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
    readonly hasGlottalStop = false,
  ) {
    Object.freeze(this)
  }

  toString(isAtEndOfWord: boolean): S extends 3 ? WithWYAlternative : string
  toString(isAtEndOfWord: boolean): string | WithWYAlternative {
    const form = ALL_VOWEL_FORMS[this.sequence][this.degree]

    if (this.hasGlottalStop) {
      return insertGlottalStop(form, isAtEndOfWord)
    } else {
      return form
    }
  }

  withGlottalStop(hasGlottalStop = true) {
    return new VowelForm(this.sequence, this.degree, hasGlottalStop)
  }
}

export const VOWEL_FORM_TO_OBJECT_MAP = Object.freeze({
  ae: new VowelForm(1, 0),
  a: new VowelForm(1, 1),
  ä: new VowelForm(1, 2),
  e: new VowelForm(1, 3),
  i: new VowelForm(1, 4),
  ëi: new VowelForm(1, 5),
  ö: new VowelForm(1, 6),
  o: new VowelForm(1, 7),
  ü: new VowelForm(1, 8),
  u: new VowelForm(1, 9),

  ea: new VowelForm(2, 0),
  ai: new VowelForm(2, 1),
  au: new VowelForm(2, 2),
  ei: new VowelForm(2, 3),
  eu: new VowelForm(2, 4),
  ëu: new VowelForm(2, 5),
  ou: new VowelForm(2, 6),
  oi: new VowelForm(2, 7),
  iu: new VowelForm(2, 8),
  ui: new VowelForm(2, 9),

  üo: new VowelForm(3, 0),
  ia: new VowelForm(3, 1),
  uä: new VowelForm(3, 1),
  ie: new VowelForm(3, 2),
  uë: new VowelForm(3, 2),
  io: new VowelForm(3, 3),
  üä: new VowelForm(3, 3),
  iö: new VowelForm(3, 4),
  üë: new VowelForm(3, 4),
  eë: new VowelForm(3, 5),
  uö: new VowelForm(3, 6),
  öë: new VowelForm(3, 6),
  uo: new VowelForm(3, 7),
  öä: new VowelForm(3, 7),
  ue: new VowelForm(3, 8),
  ië: new VowelForm(3, 8),
  ua: new VowelForm(3, 9),
  iä: new VowelForm(3, 9),

  üö: new VowelForm(4, 0),
  ao: new VowelForm(4, 1),
  aö: new VowelForm(4, 2),
  eo: new VowelForm(4, 3),
  eö: new VowelForm(4, 4),
  oë: new VowelForm(4, 5),
  öe: new VowelForm(4, 6),
  oe: new VowelForm(4, 7),
  öa: new VowelForm(4, 8),
  oa: new VowelForm(4, 9),
} as const)
