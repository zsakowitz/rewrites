import type { AffixDegree } from "../../affix"
import type { ReferrentList } from "../../referential"

/** Slot III. */
export type SlotIII =
  | string
  | ReferrentList
  | {
      /** The degree of the affix. */
      readonly degree: AffixDegree

      /** The consonantal form of the affix. */
      readonly cs: string
    }
