import { has } from "../../helpers/has"
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

export type VN = Valence | Phase | Effect | Level | Aspect

export type CN = Mood | CaseScope

export type SlotVIII = {
  vn: VN
  cn: CN
}

export type SlotVIIIMetadata = {
  omitDefaultValence: boolean
}

export function vnToIthkuil(vn: VN, omitDefaultValence: boolean) {
  if (omitDefaultValence && vn == "MNO") {
    return ""
  }

  return has(ALL_VALENCES, vn)
    ? valenceToIthkuil(vn, omitDefaultValence)
    : has(ALL_PHASES, vn)
    ? phaseToIthkuil(vn)
    : has(ALL_EFFECTS, vn)
    ? effectToIthkuil(vn)
    : has(ALL_LEVELS, vn)
    ? levelToIthkuil(vn)
    : aspectToIthkuil(vn)
}

export function cnToIthkuil(
  cn: CN,
  whatDoesSlot8Contain: "empty" | "aspect" | "non-aspect",
) {
  return has(ALL_MOODS, cn)
    ? moodToIthkuil(cn, whatDoesSlot8Contain)
    : caseScopeToIthkuil(cn, whatDoesSlot8Contain)
}

export function slotVIIIToIthkuil(slot: SlotVIII, metadata: SlotVIIIMetadata) {
  const vn = vnToIthkuil(slot.vn, metadata.omitDefaultValence)

  const whatDoesSlot8Contain =
    vn == "" ? "empty" : has(ALL_ASPECTS, slot.vn) ? "aspect" : "non-aspect"

  const cn = cnToIthkuil(slot.cn, whatDoesSlot8Contain)

  if (vn == "" && cn == "h") {
    return WithWYAlternative.EMPTY
  }

  if (typeof vn == "string") {
    return WithWYAlternative.of(vn + cn)
  } else {
    return vn.add(cn)
  }
}
