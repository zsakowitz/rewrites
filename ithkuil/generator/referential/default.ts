import type {
  PartialReferential,
  PartialReferentialReferentialCore,
  PartialSuppletiveReferentialCore,
  Referential,
  ReferentialReferentialCore,
  SuppletiveReferentialCore,
} from "."
import { deepFreeze } from "../helpers/deep-freeze"

export const DEFAULT_REFERENTIAL: ReferentialReferentialCore =
  /* @__PURE__ */ deepFreeze({
    referrents: ["1m:NEU"],
    perspective: "M",
    case: "THM",
    essence: "NRM",
  })

export const DEFAULT_SUPPLETIVE_REFERENTIAL: SuppletiveReferentialCore =
  /* @__PURE__ */ deepFreeze({
    type: "CAR",
    case: "THM",
    essence: "NRM",
  })

export function fillInDefaultReferentialSlots(
  referential: PartialReferential,
): Referential {
  if (referential.perspective2 || referential.referrent2) {
    if (
      referential.specification ||
      (referential.affixes && (referential as Referential).affixes!.length)
    ) {
      throw new Error(
        "A referential cannot specify a second referrent/perspective and a specification or affix at the same time.",
        { cause: referential },
      )
    }

    return referential.type
      ? {
          ...DEFAULT_SUPPLETIVE_REFERENTIAL,
          perspective2: "M",
          // @ts-ignore
          referrent2: "1m:NEU",
          ...referential,
        }
      : {
          ...DEFAULT_REFERENTIAL,
          perspective2: "M",
          // @ts-ignore
          referrent2: "1m:NEU",
          ...referential,
        }
  }

  if (
    referential.specification ||
    (referential.affixes && referential.affixes.length)
  ) {
    if (referential.perspective2 || referential.referrent2) {
      throw new Error(
        "A referential cannot specify a second referrent/perspective and a specification or affix at the same time.",
        { cause: referential },
      )
    }

    return referential.type
      ? {
          ...DEFAULT_SUPPLETIVE_REFERENTIAL,
          specification: "BSC",
          affixes: [],
          ...referential,
        }
      : {
          ...DEFAULT_REFERENTIAL,
          specification: "BSC",
          affixes: [],
          ...referential,
        }
  }

  return referential.type
    ? {
        ...DEFAULT_SUPPLETIVE_REFERENTIAL,
        ...(referential as PartialSuppletiveReferentialCore),
      }
    : {
        ...DEFAULT_REFERENTIAL,
        ...(referential as PartialReferentialReferentialCore),
      }
}
