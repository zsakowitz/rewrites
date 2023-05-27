import { affixToIthkuil, type Affix } from "../../affix"
import { WithWYAlternative } from "../../with-wy-alternative"

export type SlotVII = {
  readonly affixes: readonly Affix[]
}

export function slotVIIToIthkuil(slot: SlotVII): WithWYAlternative {
  if (slot.affixes.length == 0) {
    return WithWYAlternative.EMPTY
  }

  return slot.affixes
    .map((affix) => affixToIthkuil(affix, { reversed: false }))
    .reduce((a, b) => a.add(b))
}
