import { deepFreeze } from "../../../deep-freeze"
import type { CAShortcutType } from "./ca-shortcut-type"
import type { ConcatenationType } from "./concatenation-type"

export * from "./ca-shortcut-type"
export * from "./concatenation-type"

export type SlotI = {
  readonly concatenationType?: ConcatenationType
  readonly caShortcutType?: CAShortcutType
}

export const SLOT_I_MAP = deepFreeze({
  undefined: {
    undefined: "",
    w: "w",
    y: "y",
  },
  1: {
    undefined: "h",
    w: "hl",
    y: "hm",
  },
  2: {
    undefined: "hw",
    w: "hr",
    y: "hn",
  },
})

export function slotIToIthkuil(slot: SlotI): string {
  return SLOT_I_MAP[`${slot.concatenationType}`][`${slot.caShortcutType}`]
}
