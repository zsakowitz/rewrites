import {
  ALL_ASPECTS,
  ALL_EFFECTS,
  ALL_LEVELS,
  ALL_PHASES,
  ALL_VALENCES,
  type Aspect,
  type CaseScope,
  type Mood,
  type NonAspectualVN,
} from "@zsnout/ithkuil/generate"
import type { VowelForm } from "../forms.js"
import { freeze } from "../freeze.js"

const CN_TO_CASE_SCOPE = freeze({
  h: "CCN",
  hl: "CCA",
  hr: "CCS",
  hm: "CCQ",
  hn: "CCP",
  hň: "CCV",
})

const CN_TO_ASPECTUAL_CASE_SCOPE = freeze({
  w: "CCN",
  y: "CCN",
  hw: "CCA",
  hrw: "CCS",
  hmw: "CCQ",
  hnw: "CCP",
  hňw: "CCV",
})

export function parseCaseScope(
  cn: string,
): [caseScope: CaseScope, isAspectual: boolean] {
  if (cn in CN_TO_CASE_SCOPE) {
    return [CN_TO_CASE_SCOPE[cn as keyof typeof CN_TO_CASE_SCOPE], false]
  }

  if (cn in CN_TO_ASPECTUAL_CASE_SCOPE) {
    return [
      CN_TO_ASPECTUAL_CASE_SCOPE[cn as keyof typeof CN_TO_ASPECTUAL_CASE_SCOPE],
      true,
    ]
  }

  throw new Error("Invalid Cn: '" + cn + "'.")
}

const CN_TO_MOOD = freeze({
  h: "FAC",
  hl: "SUB",
  hr: "ASM",
  hm: "SPC",
  hn: "COU",
  hň: "HYP",
})

const CN_TO_ASPECTUAL_MOOD = freeze({
  w: "FAC",
  y: "FAC",
  hw: "SUB",
  hrw: "ASM",
  hmw: "SPC",
  hnw: "COU",
  hňw: "HYP",
})

export function parseMood(cn: string): [mood: Mood, isAspectual: boolean] {
  if (cn in CN_TO_MOOD) {
    return [CN_TO_MOOD[cn as keyof typeof CN_TO_MOOD], false]
  }

  if (cn in CN_TO_ASPECTUAL_MOOD) {
    return [CN_TO_ASPECTUAL_MOOD[cn as keyof typeof CN_TO_ASPECTUAL_MOOD], true]
  }

  throw new Error("Invalid Cn: '" + cn + "'.")
}

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

  return NON_ASPECTUAL_VNS[vn.sequence][vn.degree]!
}

export function parseAspect(vn: VowelForm): Aspect {
  if (vn.degree == 0) {
    throw new Error("Invalid Vn form: '" + vn + "'.")
  }

  return ALL_ASPECTS[(vn.sequence - 1) * 9 + (vn.degree - 1)]!
}
