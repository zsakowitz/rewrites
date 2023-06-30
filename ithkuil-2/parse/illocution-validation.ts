import {
  ALL_ILLOCUTIONS,
  ALL_VALIDATIONS,
  type IllocutionOrValidation,
} from "@zsnout/ithkuil"
import type { VowelForm } from "../vowel-form.js"

export function parseIllocutionValidation(
  vk: VowelForm,
): IllocutionOrValidation {
  if (vk.sequence == 1) {
    const illocution = ALL_ILLOCUTIONS[vk.value - 1]

    if (illocution != null && illocution != "ASR") {
      return illocution
    }
  }

  if (vk.sequence == 2) {
    const validation = ALL_VALIDATIONS[vk.value - 1]

    if (validation != null) {
      return validation
    }
  }

  throw new Error("Invalid Vk slot: '" + vk.value + "'.")
}
