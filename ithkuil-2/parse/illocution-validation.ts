import { ALL_VALIDATIONS, type IllocutionOrValidation } from "@zsnout/ithkuil"
import type { VowelForm } from "../vowel-form.js"

const ILLOCUTIONS = [
  ,
  "DIR",
  "DEC",
  "IRG",
  "VRF",
  ,
  "ADM",
  "POT",
  "HOR",
  "CNJ",
] as const

export function parseIllocutionValidation(
  vk: VowelForm,
): IllocutionOrValidation {
  if (vk.sequence == 1) {
    const validation = ALL_VALIDATIONS[vk.degree - 1]

    if (validation != null) {
      return validation
    }
  }

  if (vk.sequence == 2) {
    const illocution = ILLOCUTIONS[vk.degree]

    if (illocution != null) {
      return illocution
    }
  }

  throw new Error("Invalid Vk slot: " + vk + ".")
}
