import {
  ALL_ILLOCUTIONS,
  ALL_VALIDATIONS,
  type IllocutionOrValidation,
} from "@zsnout/ithkuil"
import type { VowelForm } from "../forms.js"

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
    const illocution = ALL_ILLOCUTIONS[vk.degree - 1]

    if (illocution != null && illocution != "ASR") {
      return illocution
    }
  }

  throw new Error("Invalid Vk slot: " + vk + ".")
}
