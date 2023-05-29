import type { AffixDegree } from "../../affix"
import type { ReferrentList } from "../../referential"

export type SlotIII =
  | string
  | ReferrentList
  | {
      readonly degree: AffixDegree
      readonly cs: string
    }
