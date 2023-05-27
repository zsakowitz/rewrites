// TODO: Referential Affixes

import { deepFreeze } from "../helpers/deep-freeze"
import { caToIthkuil, type PartialCA } from "../ca"
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
} from "../helpers/with-wy-alternative"
import type { AffixDegree } from "./degree"
import type { AffixType } from "./type"

export * from "./degree"
export * from "./type"

export type Affix =
  | {
      readonly type: AffixType
      readonly degree: AffixDegree
      readonly cs: string
    }
  | {
      readonly type: "CA"
      readonly ca: PartialCA
    }

export type AffixMetadata = {
  reversed: boolean
}

const AFFIX_TO_LETTER_MAP = deepFreeze([
  ,
  ["ae", "a", "ä", "e", "i", "ëi", "ö", "o", "ü", "u"],
  ["ea", "ai", "au", "ei", "eu", "ëu", "ou", "oi", "iu", "ui"],
  ["üo", IA_UÄ, IE_UË, IO_ÜÄ, IÖ_ÜË, "eë", UÖ_ÖË, UO_ÖÄ, UE_IË, UA_IÄ],
])

export function affixToIthkuil(
  affix: Affix,
  metadata: AffixMetadata,
): WithWYAlternative {
  let vowel = WithWYAlternative.of(
    affix.type == "CA" ? "üö" : AFFIX_TO_LETTER_MAP[affix.type][affix.degree],
  )

  const consonant = affix.type == "CA" ? caToIthkuil(affix.ca) : affix.cs

  if (metadata.reversed) {
    return WithWYAlternative.of(consonant).add(vowel)
  } else {
    return vowel.add(consonant)
  }
}
