import { WithWYAlternative } from "../../helpers/with-wy-alternative"
import { ALL_ASPECTS, aspectToIthkuil, type Aspect } from "./aspect"
import { caseScopeToIthkuil, type CaseScope } from "./case-scope"
import { ALL_EFFECTS, effectToIthkuil, type Effect } from "./effect"
import { ALL_LEVELS, levelToIthkuil, type Level } from "./level"
import { ALL_MOODS, moodToIthkuil, type Mood } from "./mood"
import { ALL_PHASES, phaseToIthkuil, type Phase } from "./phase"
import { ALL_VALENCES, valenceToIthkuil, type Valence } from "./valence"

export * from "./aspect"
export * from "./case-scope"
export * from "./effect"
export * from "./level"
export * from "./mood"
export * from "./phase"
export * from "./valence"

export type SlotVIII = {
  vn: Valence | Phase | Effect | Level | Aspect
  cn: Mood | CaseScope
}

export type SlotVIIIMetadata = {
  allowOmittingDefaultValence: boolean
}

export function slotVIIIToIthkuil(slot: SlotVIII, metadata: SlotVIIIMetadata) {
  const vn: string | WithWYAlternative = ALL_VALENCES.includes(slot.vn)
    ? valenceToIthkuil(slot.vn, metadata.allowOmittingDefaultValence)
    : ALL_PHASES.includes(slot.vn)
    ? phaseToIthkuil(slot.vn)
    : ALL_EFFECTS.includes(slot.vn)
    ? effectToIthkuil(slot.vn)
    : ALL_LEVELS.includes(slot.vn)
    ? levelToIthkuil(slot.vn)
    : aspectToIthkuil(slot.vn)

  const whatDoesSlot8Contain =
    vn == "" ? "empty" : ALL_ASPECTS.includes(slot.vn) ? "aspect" : "non-aspect"

  const cn: string = ALL_MOODS.includes(slot.cn)
    ? moodToIthkuil(slot.cn, whatDoesSlot8Contain)
    : caseScopeToIthkuil(slot.cn, whatDoesSlot8Contain)

  if (vn == "" && cn == "h") {
    return WithWYAlternative.EMPTY
  }

  if (typeof vn == "string") {
    return WithWYAlternative.of(vn + cn)
  } else {
    return vn.add(cn)
  }
}
