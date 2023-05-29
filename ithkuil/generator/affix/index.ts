// TODO: Referential Affixes

import { caToIthkuil, type PartialCA } from "../ca"
import { deepFreeze } from "../helpers/deep-freeze"
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
import { referentialAffixToIthkuil, type Referrent } from "../referential"
import type { AffixDegree } from "./degree"
import type { AffixType } from "./type"

export * from "./degree"
export * from "./type"

export type ReferentialAffixCase =
  | "THM"
  | "INS"
  | "ABS"
  | "AFF"
  | "STM"
  | "EFF"
  | "ERG"
  | "DAT"
  | "IND"
  | "POS"
  | "PRP"
  | "GEN"
  | "ATT"
  | "PDC"
  | "ITP"
  | "OGN"
  | "IDP"
  | "PAR"

export type Affix =
  | {
      readonly type: AffixType
      readonly degree: AffixDegree
      readonly cs: string
    }
  | {
      readonly type: "ca"
      readonly ca: PartialCA
    }
  | {
      readonly type: "ref"
      readonly referrent: Referrent
      readonly perspective?: "M" | "G" | "N"
      readonly case?: ReferentialAffixCase
    }

export type AffixMetadata = {
  reversed: boolean
}

const AFFIX_TO_ITHKUIL_MAP = /* @__PURE__ */ deepFreeze([
  ,
  ["ae", "a", "ä", "e", "i", "ëi", "ö", "o", "ü", "u"],
  ["ea", "ai", "au", "ei", "eu", "ëu", "ou", "oi", "iu", "ui"],
  ["üo", IA_UÄ, IE_UË, IO_ÜÄ, IÖ_ÜË, "eë", UÖ_ÖË, UO_ÖÄ, UE_IË, UA_IÄ],
])

const REFERENTIAL_AFFIX_TO_ITHKUIL_MAP = /* @__PURE__ */ deepFreeze({
  THM: "ao",
  INS: "aö",
  ABS: "eo",
  AFF: "eö",
  STM: "oë",
  EFF: "öe",
  ERG: "oe",
  DAT: "öa",
  IND: "oa",

  POS: IA_UÄ,
  PRP: IE_UË,
  GEN: IO_ÜÄ,
  ATT: IÖ_ÜË,
  PDC: "eë",
  ITP: UÖ_ÖË,
  OGN: UO_ÖÄ,
  IDP: UE_IË,
  PAR: UA_IÄ,
})

export function affixToIthkuil(
  affix: Affix,
  metadata: AffixMetadata,
): WithWYAlternative {
  let vowel = WithWYAlternative.of(
    affix.type == "ca"
      ? "üö"
      : affix.type == "ref"
      ? REFERENTIAL_AFFIX_TO_ITHKUIL_MAP[affix.case ?? "THM"]
      : AFFIX_TO_ITHKUIL_MAP[affix.type][affix.degree],
  )

  const consonant =
    affix.type == "ca"
      ? caToIthkuil(affix.ca)
      : affix.type == "ref"
      ? referentialAffixToIthkuil(affix.referrent, affix.perspective ?? "M")
      : affix.cs

  if (metadata.reversed) {
    return WithWYAlternative.of(consonant).add(vowel)
  } else {
    return vowel.add(consonant)
  }
}
