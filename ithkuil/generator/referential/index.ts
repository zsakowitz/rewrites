import {
  suppletiveAdjunctTypeToIthkuil,
  type SuppletiveAdjunctType,
} from "../adjunct"
import { affixToIthkuil, type Affix } from "../affix"
import type { Essence, Perspective } from "../ca"
import { caseToIthkuil, type Case, type Specification } from "../formative"
import { countVowelForms } from "../helpers/stress"
import { WithWYAlternative } from "../helpers/with-wy-alternative"
import {
  isLegalConsonantForm,
  isLegalWordFinalConsonantForm,
} from "../phonotactics"
import { fillInDefaultReferentialSlots } from "./default"
import { applyReferentialEssence } from "./essence"
import {
  referentialPerspectiveToIthkuil,
  referentialPerspectiveToIthkuilAlt,
} from "./perspective"
import { referrentToIthkuil, type Referrent } from "./referrent"
import { referrentListToIthkuil, type ReferrentList } from "./referrent/list"
import { referentialSpecificationToIthkuil } from "./specification"

export * from "./default"
export * from "./essence"
export * from "./perspective"
export * from "./referrent"
export * from "./specification"

/**
 * The structure shared between all single-, dual-, and combination
 * referentials.
 */
export type ReferentialReferentialCore = {
  readonly referrents: ReferrentList
  readonly perspective: Perspective
  readonly type?: undefined
  readonly case: Case
  readonly case2?: Case
  readonly essence: Essence
}

/** The structure shared between all suppletive referentials. */
export type SuppletiveReferentialCore = {
  readonly referrents?: undefined
  readonly perspective?: undefined
  readonly type: SuppletiveAdjunctType
  readonly case: Case
  readonly case2?: Case
  readonly essence: Essence
}

/** The core structure of a referential. */
export type ReferentialCore =
  | ReferentialReferentialCore
  | SuppletiveReferentialCore

/**
 * The structure shared between all single-, dual-, and combination
 * referentials, with all optional slots properly marked optional.
 * Note that the `referrents` slot is still required.
 */
export type PartialReferentialReferentialCore = {
  readonly referrents: ReferrentList
  readonly perspective?: Perspective
  readonly type?: undefined
  readonly case?: Case
  readonly case2?: Case
  readonly essence?: Essence
}

/**
 * The core structure of all suppletive referentials, with all optional slots
 * properly marked optional. Note that the `type` slot is still required.
 */
export type PartialSuppletiveReferentialCore = {
  readonly referrents?: undefined
  readonly perspective?: undefined
  readonly type: SuppletiveAdjunctType
  readonly case?: Case
  readonly case2?: Case
  readonly essence?: Essence
}

/**
 * The core structure of a referrent, with optional slots properly marked
 * optional. Note that either the `referrents` slot or `type` slot must be
 * present in instances of this type.
 */
export type PartialReferentialCore =
  | PartialReferentialReferentialCore
  | PartialSuppletiveReferentialCore

/** A referential. */
export type Referential =
  | (ReferentialCore & {
      readonly referrent2?: undefined
      readonly perspective2?: undefined
      readonly specification?: undefined
      readonly affixes?: undefined
    })
  | (ReferentialCore & {
      readonly referrent2: Referrent
      readonly perspective2: Perspective
      readonly specification?: undefined
      readonly affixes?: undefined
    })
  | (ReferentialCore & {
      readonly referrent2?: undefined
      readonly perspective2?: undefined
      readonly specification: Specification
      readonly affixes: readonly Affix[]
    })

/** A referential, with optional slots properly marked optional. */
export type PartialReferential =
  | (PartialReferentialCore & {
      readonly referrent2?: undefined
      readonly perspective2?: undefined
      readonly specification?: undefined
      readonly affixes?: undefined
    })
  | (PartialReferentialCore & {
      readonly referrent2: Referrent
      readonly perspective2?: Perspective
      readonly specification?: undefined
      readonly affixes?: undefined
    })
  | (PartialReferentialCore & {
      readonly referrent2?: undefined
      readonly perspective2?: undefined
      readonly specification?: Specification
      readonly affixes?: readonly Affix[]
    })

/**
 * Converts a referential into Ithkuil.
 * @param referential The referential to convert.
 * @returns Romanized Ithkuilic text representing the referential.
 */
function completeReferentialToIthkuil(referential: Referential) {
  const slot1 = referential.referrents
    ? referrentListToIthkuil(referential.referrents, referential.perspective)
    : (referential.specification && referential.affixes ? "a" : "üo") +
      suppletiveAdjunctTypeToIthkuil(referential.type)

  const slot2 = WithWYAlternative.of(
    caseToIthkuil(referential.case, false, false),
  ).withPreviousText(slot1)

  if (referential.specification && referential.affixes) {
    const slot3 = referentialSpecificationToIthkuil(referential.specification)

    const slot4 = referential.affixes.length
      ? referential.affixes
          .map((affix) => affixToIthkuil(affix, { reversed: false }))
          .reduce((a, b) => a.add(b))
          .withPreviousText(slot1 + slot2 + slot3)
      : ""

    const slot5 = referential.case2
      ? referential.case2 == "THM"
        ? "üa"
        : caseToIthkuil(referential.case2, false, false)
      : referential.essence == "NRM" ||
        countVowelForms(slot1 + slot2 + slot3 + slot4) >= 2
      ? ""
      : "a"

    const word = slot1 + slot2 + slot3 + slot4 + slot5

    return applyReferentialEssence(word, referential.essence)
  }

  if (referential.case2 || referential.perspective2 || referential.referrent2) {
    const slot3 =
      "w" +
      WithWYAlternative.of(
        caseToIthkuil(referential.case2 || "THM", false, false),
      ).precededByW

    let slot4 = ""

    if (referential.referrent2) {
      const referrent = referrentToIthkuil(referential.referrent2, false)

      const perspective = referentialPerspectiveToIthkuil(
        referential.perspective2,
      )

      if (isLegalWordFinalConsonantForm(perspective + referrent)) {
        slot4 = perspective + referrent
      } else if (isLegalWordFinalConsonantForm(referrent + perspective)) {
        slot4 = referrent + perspective
      } else if (isLegalConsonantForm(perspective + referrent)) {
        slot4 = perspective + referrent + "ë"
      } else if (isLegalConsonantForm(referrent + perspective)) {
        slot4 = referrent + perspective + "ë"
      }

      const perspective2 = referentialPerspectiveToIthkuilAlt(
        referential.perspective2,
      )

      if (isLegalWordFinalConsonantForm(referrent + perspective2)) {
        slot4 = referrent + perspective2
      } else if (isLegalWordFinalConsonantForm(perspective2 + referrent)) {
        slot4 = perspective2 + referrent
      } else if (isLegalConsonantForm(referrent + perspective2)) {
        slot4 = referrent + perspective2 + "ë"
      } else {
        // The following may be phonotactically invalid.
        slot4 = perspective2 + referrent + "ë"
      }
    }

    return applyReferentialEssence(
      slot1 + slot2 + slot3 + slot4,
      referential.essence,
    )
  }

  return applyReferentialEssence(slot1 + slot2, referential.essence)
}

/**
 * Converts a referential into Ithkuil.
 * @param referential The referential to convert.
 * @returns Romanized Ithkuilic text representing the referential.
 */
export function referentialToIthkuil(referential: PartialReferential) {
  return completeReferentialToIthkuil(
    fillInDefaultReferentialSlots(referential),
  )
}
