import { caseToIthkuil, type Case } from "./case"
import { ALL_ILLOCUTIONS } from "./illocution"
import {
  illocutionAndValidationToIthkuil,
  type IllocutionOrValidation,
} from "./illocution-and-validation"
import { ALL_VALIDATIONS } from "./validation"

export * from "./case"
export * from "./illocution"
export * from "./illocution-and-validation"
export * from "./validation"

export type SlotIX = Case | IllocutionOrValidation

export interface SlotIXMetadata {
  elideIfPossible: boolean
}

export function slotIXToIthkuil(slot: SlotIX, metadata: SlotIXMetadata) {
  if (ALL_ILLOCUTIONS.includes(slot) || ALL_VALIDATIONS.includes(slot)) {
    return illocutionAndValidationToIthkuil(slot, metadata.elideIfPossible)
  } else {
    return caseToIthkuil(slot, metadata.elideIfPossible)
  }
}
