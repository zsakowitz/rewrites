import { deepFreeze } from "../../deep-freeze"
import type { Expand } from "../../expand"
import type { Affix } from "../affix"
import { type CA, type PartialCA } from "../ca"
import { applyStress, countVowelForms } from "../stress"
import { WithWYAlternative } from "../with-wy-alternative"
import { fillInDefaultFormativeSlots } from "./default"
import { slotIToIthkuil, type ConcatenationType } from "./slot-1"
import { applySlotXStress } from "./slot-10"
import { slotIIToIthkuil, type Stem, type Version } from "./slot-2"
import {
  slotIVToIthkuil,
  type Context,
  type Function,
  type Specification,
} from "./slot-4"
import { slotVToIthkuil } from "./slot-5"
import { slotVIToIthkuil } from "./slot-6"
import { slotVIIToIthkuil } from "./slot-7"
import {
  slotVIIIToIthkuil,
  type Aspect,
  type CaseScope,
  type Effect,
  type Level,
  type Mood,
  type Phase,
  type Valence,
} from "./slot-8"
import {
  ALL_CASES,
  slotIXToIthkuil,
  type Case,
  type IllocutionOrValidation,
} from "./slot-9"

export * from "./default"
export * from "./slot-1"
export * from "./slot-10"
export * from "./slot-2"
export * from "./slot-3"
export * from "./slot-4"
export * from "./slot-5"
export * from "./slot-6"
export * from "./slot-7"
export * from "./slot-8"
export * from "./slot-9"

export type CoreFormative = {
  readonly version: Version
  readonly stem: Stem

  readonly root: string

  readonly function: Function
  readonly specification: Specification
  readonly context: Context

  readonly slotVAffixes: readonly Affix[]
  readonly ca: CA
  readonly slotVIIAffixes: readonly Affix[]

  readonly vn: Valence | Aspect | Phase | Level | Effect
}

export type PartialCoreFormative = Expand<
  Partial<Omit<CoreFormative, "ca" | "root">> & {
    readonly ca?: PartialCA
    readonly root: string
  }
>

export type NominalFormative = CoreFormative & {
  readonly type: "UNF/C"

  readonly concatenatenationType: ConcatenationType
  readonly caseScope: CaseScope
  readonly case: Case
}

export type PartialNominalFormative = PartialCoreFormative & {
  readonly type: "UNF/C"

  readonly concatenatenationType?: ConcatenationType
  readonly caseScope?: CaseScope
  readonly case?: Case
}

export type UnframedVerbalFormative = CoreFormative & {
  readonly type: "UNF/K"

  readonly mood: Mood
  readonly illocutionValidation: IllocutionOrValidation
}

export type PartialUnframedVerbalFormative = PartialCoreFormative & {
  readonly type: "UNF/K"

  readonly mood?: Mood
  readonly illocutionValidation?: IllocutionOrValidation
}

export type FramedVerbalFormative = CoreFormative & {
  readonly type: "FRM"

  readonly caseScope: CaseScope
  readonly case: Case
}

export type PartialFramedVerbalFormative = PartialCoreFormative & {
  readonly type: "FRM"

  readonly caseScope?: CaseScope
  readonly case?: Case
}

export type Formative =
  | NominalFormative
  | UnframedVerbalFormative
  | FramedVerbalFormative

export type PartialFormative =
  | PartialNominalFormative
  | PartialUnframedVerbalFormative
  | PartialFramedVerbalFormative

export const FORMATIVE_TYPE_TO_NAME_MAP = deepFreeze({
  "UNF/C": "Nominal",
  "UNF/K": "Unframed Verbal",
  FRM: "Framed Verbal",
})

// TODO: Handle verbal formatives.

// This function does not compute any Vr+Ca shortcuts.
function completeFormativeToIthkuil(formative: Formative) {
  const slot3 = formative.root

  const slot4 = slotIVToIthkuil(formative, { slotIII: slot3 })

  const slot5 = slotVToIthkuil(
    { affixes: formative.slotVAffixes },
    { isAtEndOfWord: false, isSlotVIElided: false },
  ).withPreviousText(slot3 + slot4)

  const slot6 = slotVIToIthkuil(formative, {
    isSlotVFilled: formative.slotVAffixes.length > 0,
  })

  const slot7 = slotVIIToIthkuil({ affixes: formative.slotVIIAffixes })

  if (formative.type == "UNF/C") {
    const slot1 = slotIToIthkuil({
      concatenationType: formative.concatenatenationType,
      caShortcutType: "none",
    })

    const slot2 = slotIIToIthkuil(formative, {
      slotI: slot1,
      doesSlotVHaveAtLeastTwoAffixes: formative.slotVAffixes.length >= 2,
    })

    const slot8 = slotVIIIToIthkuil(
      {
        vn: formative.vn,
        cn: formative.caseScope,
      },
      {
        allowOmittingDefaultValence: true,
      },
    ).withPreviousText(slot6 + slot7)

    const slot9 = WithWYAlternative.of(
      slotIXToIthkuil(formative.case, {
        elideIfPossible:
          !slot8 &&
          countVowelForms(
            slot1 + slot2 + slot3 + slot4 + slot5 + slot6 + slot7 + slot8,
          ) >= 2,
        isPartOfConcatenatedFormative:
          formative.concatenatenationType != "none",
      }),
    ).withPreviousText(slot6 + slot7 + slot8)

    const word =
      slot1 + slot2 + slot3 + slot4 + slot5 + slot6 + slot7 + slot8 + slot9

    if (formative.concatenatenationType == "none") {
      return applySlotXStress(word, "UNF/C")
    }

    if (ALL_CASES.indexOf(formative.case) >= 36) {
      return applyStress(word, -1)
    } else {
      return word
    }
  }
}

export function formativeToIthkuil(formative: PartialFormative) {
  return completeFormativeToIthkuil(fillInDefaultFormativeSlots(formative))
}
