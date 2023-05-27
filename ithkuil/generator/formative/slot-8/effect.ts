import { deepFreeze } from "../../../deep-freeze"
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
} from "../../with-wy-alternative"

export type Effect =
  | "1:BEN"
  | "2:BEN"
  | "3:BEN"
  | "SLF:BEN"
  | "UNK"
  | "SLF:DET"
  | "3:DET"
  | "2:DET"
  | "1:DET"

export const ALL_EFFECTS: readonly Effect[] = deepFreeze([
  "1:BEN",
  "2:BEN",
  "3:BEN",
  "SLF:BEN",
  "UNK",
  "SLF:DET",
  "3:DET",
  "2:DET",
  "1:DET",
])

export const EFFECT_TO_LETTER_MAP = deepFreeze({
  "1:BEN": IA_UÄ,
  "2:BEN": IE_UË,
  "3:BEN": IO_ÜÄ,
  "SLF:BEN": IÖ_ÜË,
  UNK: WithWYAlternative.of("eë"),
  "SLF:DET": UÖ_ÖË,
  "3:DET": UO_ÖÄ,
  "2:DET": UE_IË,
  "1:DET": UA_IÄ,
})

export const EFFECT_TO_NAME_MAP = deepFreeze({
  "1:BEN": "Beneficial to Speaker",
  "2:BEN": "Beneficial to Addressee",
  "3:BEN": "Beneficial to 3rd Party",
  "SLF:BEN": "Beneficial to Self",
  UNK: "Unknown",
  "SLF:DET": "Detrimental to Self",
  "3:DET": "Detrimental to Third Party",
  "2:DET": "Detrimental to Addressee",
  "1:DET": "Detrimental to Speaker",
})

export function effectToIthkuil(effect: Effect) {
  return EFFECT_TO_LETTER_MAP[effect]
}

export type EffectAsObject =
  | {
      readonly effect: "BEN" | "DET"
      readonly target: 1 | 2 | 3 | "SLF"
    }
  | {
      readonly effect: "UNK"
      readonly target?: undefined
    }

export const EFFECT_TO_EFFECT_OBJECT_MAP: Record<Effect, EffectAsObject> =
  deepFreeze({
    "1:BEN": { effect: "BEN", target: 1 },
    "2:BEN": { effect: "BEN", target: 2 },
    "3:BEN": { effect: "BEN", target: 3 },
    "SLF:BEN": { effect: "BEN", target: "SLF" },
    UNK: { effect: "UNK" },
    "SLF:DET": { effect: "DET", target: "SLF" },
    "3:DET": { effect: "DET", target: 3 },
    "2:DET": { effect: "DET", target: 2 },
    "1:DET": { effect: "DET", target: 1 },
  })

export function effectToEffectObject(effect: Effect) {
  return EFFECT_TO_EFFECT_OBJECT_MAP[effect]
}

export function effectObjectToEffect(effectObject: EffectAsObject): Effect {
  if (effectObject.effect == "UNK") {
    return "UNK"
  }

  return `${effectObject.target}:${effectObject.effect}`
}
