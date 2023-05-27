import { deepFreeze } from "../../../deep-freeze"
import {
  IA_UÄ,
  IE_UË,
  IO_ÜÄ,
  IÖ_ÜË,
  UA_IÄ,
  UE_IË,
  UO_ÖÄ,
  UÖ_ÖË,
} from "../../with-wy-alternative"
import type { Stem } from "./stem"
import type { Version } from "./version"

export * from "./stem"
export * from "./version"

export type SlotII = {
  stem: Stem
  version: Version
}

export type SlotIIMetadata = {
  isSlotIFilled: boolean
  affixShortcut?: "NEG/4" | "DCD/4" | "DCD/5"
}

export const SLOT_II_MAP = deepFreeze({
  undefined: [
    ["o", "ö"],
    ["a", "ä"],
    ["e", "i"],
    ["u", "ü"],
  ],
  "NEG/4": [
    ["oi", "ou"],
    ["ai", "au"],
    ["ei", "eu"],
    ["ui", "iu"],
  ],
  "DCD/4": [
    [UO_ÖÄ, UÖ_ÖË],
    [IA_UÄ, IE_UË],
    [IO_ÜÄ, IÖ_ÜË],
    [UA_IÄ, UE_IË],
  ],
  "DCD/5": [
    ["oe", "öe"],
    ["ao", "aö"],
    ["eo", "eö"],
    ["oa", "öa"],
  ],
})

export function slotIIToIthkuil(slot: SlotII, metadata: SlotIIMetadata) {
  const main =
    SLOT_II_MAP[`${metadata.affixShortcut}`][slot.stem][
      +(slot.version == "CPT")
    ]

  if (metadata.isSlotIFilled && main == "a") {
    return ""
  }

  return main
}
