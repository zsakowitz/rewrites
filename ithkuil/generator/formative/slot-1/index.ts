import { deepFreeze } from "../../helpers/deep-freeze"
import type { CAShortcutType } from "./ca-shortcut-type"
import type { ConcatenationType } from "./concatenation-type"

export * from "./ca-shortcut-type"
export * from "./concatenation-type"

export type SlotI = {
  readonly concatenationType: ConcatenationType
  readonly caShortcutType: CAShortcutType
}

export const SLOT_I_MAP = deepFreeze({
  none: {
    none: "",
    w: "w",
    y: "y",
  },
  1: {
    none: "h",
    w: "hl",
    y: "hm",
  },
  2: {
    none: "hw",
    w: "hr",
    y: "hn",
  },
})

export function slotIToIthkuil(slot: SlotI): string {
  return SLOT_I_MAP[`${slot.concatenationType}`][`${slot.caShortcutType}`]
}
