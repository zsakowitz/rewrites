import type {
  PartialReferential,
  PartialReferentialCore,
  Referential,
  ReferentialCore,
} from "."
import { deepFreeze } from "../helpers/deep-freeze"

export const DEFAULT_REFERENTIAL: ReferentialCore = deepFreeze({
  referrents: ["1m:NEU"],
  perspective: "M",
  case: "THM",
  essence: "NRM",
})

export function fillInDefaultReferentialSlots(
  referential: PartialReferential,
): Referential {
  if (referential.perspective2 || referential.referrent2) {
    if (referential.specification || referential.affixes) {
      throw new Error(
        "A referential cannot specify a second referrent/perspective and a specification or affix at the same time.",
        { cause: referential },
      )
    }

    return {
      ...DEFAULT_REFERENTIAL,
      perspective2: "M",
      // @ts-ignore
      referrent2: "1m:NEU",
      ...referential,
    }
  }

  if (referential.specification || referential.affixes) {
    if (referential.perspective2 || referential.referrent2) {
      throw new Error(
        "A referential cannot specify a second referrent/perspective and a specification or affix at the same time.",
        { cause: referential },
      )
    }

    return {
      ...DEFAULT_REFERENTIAL,
      specification: "BSC",
      affixes: [],
      ...referential,
    }
  }

  return {
    ...DEFAULT_REFERENTIAL,
    ...(referential as PartialReferentialCore),
  }
}
