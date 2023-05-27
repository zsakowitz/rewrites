import { affixToIthkuil, type Affix } from "../../affix"
import { WithWYAlternative } from "../../with-wy-alternative"

export type SlotV = {
  readonly affixes: readonly Affix[]
}

export type SlotVMetadata = {
  readonly isSlotVIElided: boolean
  readonly isAtEndOfWord: boolean
}

export function slotVToIthkuil(
  slot: SlotV,
  metadata: SlotVMetadata,
): WithWYAlternative {
  if (slot.affixes.length == 0) {
    return WithWYAlternative.EMPTY
  }

  if (metadata.isSlotVIElided) {
    const affixes = slot.affixes.map((affix) =>
      affixToIthkuil(affix, { reversed: false }),
    )

    affixes[affixes.length - 1] = affixes[
      affixes.length - 1
    ]!.insertGlottalStop(metadata.isAtEndOfWord)

    return affixes.reduce((a, b) => a.add(b))
  } else {
    return slot.affixes
      .map((affix) => affixToIthkuil(affix, { reversed: true }))
      .reduce((a, b) => a.add(b))
  }
}
