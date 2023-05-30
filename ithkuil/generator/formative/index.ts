import type { Affix } from "../affix"
import { type CA, type PartialCA } from "../ca"
import { deepFreeze } from "../helpers/deep-freeze"
import { applyStress, countVowelForms } from "../helpers/stress"
import { WithWYAlternative } from "../helpers/with-wy-alternative"
import { referrentListToPersonalReferenceRoot } from "../referential"
import { fillInDefaultFormativeSlots } from "./default"
import { slotIToIthkuil, type ConcatenationType } from "./slot-1"
import { applySlotXStress } from "./slot-10"
import { slotIIToIthkuil, type Stem, type Version } from "./slot-2"
import type { SlotIII } from "./slot-3"
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

/** The core structure shared between all formatives. */
export type CoreFormative = {
  /** The version of the formative. */
  readonly version: Version

  /** The stem of the formative. */
  readonly stem: Stem

  /** The root of the formative. */
  readonly root: SlotIII

  /** The function of the formative. */
  readonly function: Function

  /** The specification of the formative. */
  readonly specification: Specification

  /** The context of the formative. */
  readonly context: Context

  /** The Slot V affixes of the formative. */
  readonly slotVAffixes: readonly Affix[]

  /** The Ca affix complex of the formative. */
  readonly ca: CA

  /** The Slot VII affixes of the formative. */
  readonly slotVIIAffixes: readonly Affix[]

  /** The Vn slot of the formative. */
  readonly vn: Valence | Aspect | Phase | Level | Effect
}

/**
 * The core structure shared between all formatives, with all optional slots
 * properly marked as optional.
 *
 * Note that the `type` and `root` properties are still required, and the `ca`
 * property is also partial. For these reasons, use `PartialFormative` instead
 * of `Partial<Formative>`, as the latter gives improper results.
 */
export type PartialCoreFormative = {
  /** The version of the formative. */
  readonly version?: Version

  /** The stem of the formative. */
  readonly stem?: Stem

  /** The root of the formative. */
  readonly root: SlotIII

  /** The function of the formative. */
  readonly function?: Function

  /** The specification of the formative. */
  readonly specification?: Specification

  /** The context of the formative. */
  readonly context?: Context

  /** The Slot V affixes of the formative. */
  readonly slotVAffixes?: readonly Affix[]

  /** The Ca affix complex of the formative. */
  readonly ca?: PartialCA

  /** The Slot VII affixes of the formative. */
  readonly slotVIIAffixes?: readonly Affix[]

  /** The Vn slot of the formative. */
  readonly vn?: Valence | Aspect | Phase | Level | Effect
}

/** A nominal formative. */
export type NominalFormative = CoreFormative & {
  /** The type of the formative. */
  readonly type: "UNF/C"

  /** The concatenation type of the formative. */
  readonly concatenatenationType: ConcatenationType

  /** The case-scope of the formative. */
  readonly caseScope: CaseScope

  /** The case of the formative. */
  readonly case: Case
}

/**
 * A nominal formative, with all optional slots properly marked as optional.
 *
 * Note that the `type` and `root` properties are still required, and the `ca`
 * property is also partial. For these reasons, use `PartialFormative` instead
 * of `Partial<Formative>`, as the latter gives improper results.
 */
export type PartialNominalFormative = PartialCoreFormative & {
  /** The type of the formative. */
  readonly type: "UNF/C"

  /** The concatenation type of the formative. */
  readonly concatenatenationType?: ConcatenationType

  /** The case-scope of the formative. */
  readonly caseScope?: CaseScope

  /** The case of the formative. */
  readonly case?: Case
}

/** An unframed verbal formative. */
export type UnframedVerbalFormative = CoreFormative & {
  /** The type of the formative. */
  readonly type: "UNF/K"

  /** The mood of the formative. */
  readonly mood: Mood

  /** The illocution+validation of the formative. */
  readonly illocutionValidation: IllocutionOrValidation
}

/**
 * An unframed verbal formative, with all optional slots properly marked as
 * optional.
 *
 * Note that the `type` and `root` properties are still required, and the `ca`
 * property is also partial. For these reasons, use `PartialFormative` instead
 * of `Partial<Formative>`, as the latter gives improper results.
 */
export type PartialUnframedVerbalFormative = PartialCoreFormative & {
  /** The type of the formative. */
  readonly type: "UNF/K"

  /** The mood of the formative. */
  readonly mood?: Mood

  /** The illocution+validation of the formative. */
  readonly illocutionValidation?: IllocutionOrValidation
}

/** A framed verbal formative. */
export type FramedVerbalFormative = CoreFormative & {
  /** The type of the formative. */
  readonly type: "FRM"

  /** The case-scope of the formative. */
  readonly caseScope: CaseScope

  /** The case of the formative. */
  readonly case: Case
}

/**
 * A framed verbal formative, with all optional slots properly marked as
 * optional.
 *
 * Note that the `type` and `root` properties are still required, and the `ca`
 * property is also partial. For these reasons, use `PartialFormative` instead
 * of `Partial<Formative>`, as the latter gives improper results.
 */
export type PartialFramedVerbalFormative = PartialCoreFormative & {
  /** The type of the formative. */
  readonly type: "FRM"

  /** The case-scope of the formative. */
  readonly caseScope?: CaseScope

  /** The case of the formative. */
  readonly case?: Case
}

/** A formative. */
export type Formative =
  | NominalFormative
  | UnframedVerbalFormative
  | FramedVerbalFormative

/**
 * A formative, with all optional slots properly marked as optional.
 *
 * Note that the `type` and `root` properties are still required, and the `ca`
 * property is also partial. For these reasons, use `PartialFormative` instead
 * of `Partial<Formative>`, as the latter gives improper results.
 */
export type PartialFormative =
  | PartialNominalFormative
  | PartialUnframedVerbalFormative
  | PartialFramedVerbalFormative

/** An object mapping from formative types to their names. */
export const FORMATIVE_TYPE_TO_NAME_MAP = /* @__PURE__ */ deepFreeze({
  "UNF/C": "Nominal",
  "UNF/K": "Unframed Verbal",
  FRM: "Framed Verbal",
})

/**
 * Converts a formative into Ithkuil.
 * @param formative The formative to be converted.
 * @returns Romanized Ithkuilic text representing the formative.
 */
function completeFormativeToIthkuil(formative: Formative) {
  const slot3 =
    typeof formative.root == "string"
      ? formative.root
      : Array.isArray(formative.root)
      ? referrentListToPersonalReferenceRoot(formative.root)
      : formative.root.cs

  const slot4 = slotIVToIthkuil(formative, {
    slotIII: slot3,
    affixualFormativeDegree:
      typeof formative.root == "object" && !Array.isArray(formative.root)
        ? formative.root.degree
        : undefined,
  })

  const slot5 = slotVToIthkuil(
    { affixes: formative.slotVAffixes },
    { isAtEndOfWord: false, isSlotVIElided: false },
  ).withPreviousText(slot3 + slot4)

  const slot6 = slotVIToIthkuil(formative, {
    isSlotVFilled: formative.slotVAffixes.length > 0,
  })

  const slot7 = slotVIIToIthkuil({ affixes: formative.slotVIIAffixes })

  const slot1 = slotIToIthkuil({
    concatenationType:
      formative.type == "UNF/C" ? formative.concatenatenationType : "none",
    caShortcutType: "none",
  })

  const slot2 = slotIIToIthkuil(formative, {
    slotI: slot1,
    slotIII: formative.root,
    function: formative.function,
    doesSlotVHaveAtLeastTwoAffixes: formative.slotVAffixes.length >= 2,
  })

  // Nominal formatives
  if (formative.type == "UNF/C") {
    const slot8 = slotVIIIToIthkuil(
      {
        vn: formative.vn,
        cn: formative.caseScope,
      },
      {
        omitDefaultValence: true,
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

  // Unframed verbal formatives
  if (formative.type == "UNF/K") {
    const slot8 = slotVIIIToIthkuil(
      {
        vn: formative.vn,
        cn: formative.mood,
      },
      {
        omitDefaultValence: true,
      },
    ).withPreviousText(slot6 + slot7)

    const slot9 = WithWYAlternative.of(
      slotIXToIthkuil(formative.illocutionValidation, {
        elideIfPossible: slot6.length == 1 && !slot8,
        isPartOfConcatenatedFormative: false,
      }),
    ).withPreviousText(slot6 + slot7 + slot8)

    const word =
      slot1 + slot2 + slot3 + slot4 + slot5 + slot6 + slot7 + slot8 + slot9

    return applySlotXStress(word, "UNF/K")
  }

  // Framed verbal formatives
  if (formative.type == "FRM") {
    const slot8 = slotVIIIToIthkuil(
      {
        vn: formative.vn,
        cn: formative.caseScope,
      },
      {
        omitDefaultValence:
          countVowelForms(
            slot1 + slot2 + slot3 + slot4 + slot5 + slot6 + slot7,
          ) >= 2,
      },
    ).withPreviousText(slot6 + slot7)

    const slot9 = WithWYAlternative.of(
      slotIXToIthkuil(formative.case, {
        elideIfPossible:
          !slot8 &&
          countVowelForms(
            slot1 + slot2 + slot3 + slot4 + slot5 + slot6 + slot7 + slot8,
          ) >= 3,
        isPartOfConcatenatedFormative: false,
      }),
    ).withPreviousText(slot6 + slot7 + slot8)

    const word =
      slot1 + slot2 + slot3 + slot4 + slot5 + slot6 + slot7 + slot8 + slot9

    return applySlotXStress(word, "FRM")
  }

  throw new Error("Unknown formative type '" + (formative as any)?.type + "'.")
}

/**
 * Converts a formative into Ithkuil.
 * @param formative The formative to be converted.
 * @returns Romanized Ithkuilic text representing the formative.
 */
export function formativeToIthkuil(formative: PartialFormative): string {
  return completeFormativeToIthkuil(fillInDefaultFormativeSlots(formative))
}
