import { deepFreeze } from "../../../deep-freeze"
import type { Illocution } from "./illocution"
import type { Validation } from "./validation"

export type IllocutionOrValidation = Exclude<Illocution, "ASR"> | Validation

export const ILLOCUTION_AND_VALIDATION_TO_LETTER_MAP = deepFreeze({
  OBS: "a",
  REC: "ä",
  PUP: "e",
  RPR: "i",
  USP: "ëi",
  IMA: "ö",
  CVN: "o",
  ITU: "ü",
  INF: "u",

  DIR: "ai",
  DEC: "au",
  IRG: "ei",
  VRF: "eu",
  ADM: "ou",
  POT: "oi",
  HOR: "iu",
  CNJ: "ui",
})

export function illocutionAndValidationToIthkuil(
  illocutionOrValidation: IllocutionOrValidation,
  elideIfPossible: boolean,
): string {
  if (elideIfPossible && illocutionOrValidation == "OBS") {
    return ""
  }

  return ILLOCUTION_AND_VALIDATION_TO_LETTER_MAP[illocutionOrValidation]
}
