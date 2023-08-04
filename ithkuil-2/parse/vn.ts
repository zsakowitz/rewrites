import {
  ALL_ASPECTS,
  ALL_EFFECTS,
  ALL_LEVELS,
  ALL_PHASES,
  ALL_VALENCES,
  type Aspect,
  type NonAspectualVN,
} from "@zsnout/ithkuil/generate"
import type { VowelForm } from "../vowel-form.js"

const NON_ASPECTUAL_VNS = [
  ,
  ALL_VALENCES,
  ALL_PHASES,
  ALL_EFFECTS,
  ALL_LEVELS,
] as const

export function parseNonAspectualVn(vn: VowelForm): NonAspectualVN {
  if (vn.degree == 0) {
    throw new Error("Invalid Vn form: '" + vn + "'.")
  }

  return NON_ASPECTUAL_VNS[vn.sequence][vn.degree - 1]!
}

export function parseAspect(vn: VowelForm): Aspect {
  if (vn.degree == 0) {
    throw new Error("Invalid Vn form: '" + vn + "'.")
  }

  return ALL_ASPECTS[(vn.sequence - 1) * 9 + (vn.degree - 1)]!
}
