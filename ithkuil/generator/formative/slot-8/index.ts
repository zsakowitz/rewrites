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

/**
 * Categories able to be placed in a Vn slot, such as Valence, Phase, Effect,
 * Level, and Aspect.
 */
export type VN = Valence | Phase | Effect | Level | Aspect

/** Categories able to be placed in a Cn slot, such as Mood and Case-Scope. */
export type CN = Mood | CaseScope

/** Information directly pertaining to Slot VIII. */
export type SlotVIII = {
  /** The Vn slot: a Valence, Phase, Effect, Level, or Aspect. */
  readonly vn: VN

  /** The Cn slot: a Mood or Case-Scope. */
  readonly cn: CN
}

/** Additional information relevant to Slot VIII. */
export type SlotVIIIMetadata = {
  /** Whether default MNO valence should be omitted. */
  readonly omitDefaultValence: boolean
}

/**
 * Converts a Vn form into Ithkuil.
 * @param vn The Vn form to be converted.
 * @param omitDefaultValence Whether default MNO valence should be omitted.
 * @returns Romanized Ithkuilic text representing the Vn form.
 */
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

/**
 * Converts a Cn form into Ithkuil.
 * @param cn The Cn form to be converted.
 * @param vnType The contents of Slot 8. Use "aspect" when Slot 8
 * contains an aspect, "non-aspect" when it contains a non-aspect, and "empty"
 * when Slot 8 has been elided due to the use of MNO valence.
 * @returns Romanized Ithkuilic text representing the Cn form.
 */
export function cnToIthkuil(cn: CN, vnType: "empty" | "aspect" | "non-aspect") {
  return has(ALL_MOODS, cn)
    ? moodToIthkuil(cn, vnType)
    : caseScopeToIthkuil(cn, vnType)
}

/**
 * Converts Slot VIII into Ithkuil
 * @param slot The Vn and Cn forms of the formative.
 * @param metadata Additional information relevant to Slot VIII.
 * @returns A `WithWYAlternative` containing romanized Ithkuilic text
 * representing Slot VIII.
 */
export function slotVIIIToIthkuil(slot: SlotVIII, metadata: SlotVIIIMetadata) {
  const vn = vnToIthkuil(slot.vn, metadata.omitDefaultValence)

  const vnType =
    vn == "" ? "empty" : has(ALL_ASPECTS, slot.vn) ? "aspect" : "non-aspect"

  const cn = cnToIthkuil(slot.cn, vnType)

  if (vn == "" && cn == "h") {
    return WithWYAlternative.EMPTY
  }

  if (typeof vn == "string") {
    return WithWYAlternative.of(vn + cn)
  } else {
    return vn.add(cn)
  }
}
