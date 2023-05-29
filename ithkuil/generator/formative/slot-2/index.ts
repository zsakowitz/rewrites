import { deepFreeze } from "../../helpers/deep-freeze"
import { insertGlottalStop } from "../../helpers/insert-glottal-stop"
import {
  IA_UÄ,
  IE_UË,
  IO_ÜÄ,
  IÖ_ÜË,
  UA_IÄ,
  UE_IË,
  UO_ÖÄ,
  UÖ_ÖË,
  WithWYAlternative,
} from "../../helpers/with-wy-alternative"
import type { SlotIII } from "../slot-3"
import type { Stem } from "./stem"
import type { Version } from "./version"

export * from "./stem"
export * from "./version"

export type SlotII = {
  readonly stem: Stem
  readonly version: Version
}

export type SlotIIMetadata = {
  readonly slotI: string
  readonly slotIII: SlotIII
  readonly affixShortcut?: "NEG/4" | "DCD/4" | "DCD/5"
  readonly doesSlotVHaveAtLeastTwoAffixes: boolean
}

export const SLOT_II_MAP = /* @__PURE__ */ deepFreeze({
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

export function slotIIToIthkuil(
  slot: SlotII,
  metadata: SlotIIMetadata,
): string {
  if (Array.isArray(metadata.slotIII)) {
    return slot.version == "CPT" ? "ea" : "ae"
  }

  let value: string | WithWYAlternative =
    SLOT_II_MAP[`${metadata.affixShortcut}`][slot.stem][
      +(slot.version == "CPT") as 0 | 1
    ]

  if (
    metadata.slotIII.replace(/(.)\1/g, "$1").length <= 2 &&
    metadata.slotI == "" &&
    value == "a"
  ) {
    if (metadata.doesSlotVHaveAtLeastTwoAffixes) {
      return "a'"
    } else {
      return ""
    }
  }

  if (typeof value != "string") {
    value = value.withPreviousText(metadata.slotI)
  }

  if (metadata.doesSlotVHaveAtLeastTwoAffixes) {
    value = insertGlottalStop(value, false)
  }

  return value
}
