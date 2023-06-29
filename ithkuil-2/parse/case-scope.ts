import type { CaseScope } from "@zsnout/ithkuil"
import { freezeNullPrototype } from "../null-proto-frozen"

const CN_TO_CASE_SCOPE = freezeNullPrototype({
  h: "CCN",
  hl: "CCA",
  hr: "CCS",
  hm: "CCQ",
  hn: "CCP",
  hň: "CCV",
})

const CN_TO_ASPECTUAL_CASE_SCOPE = freezeNullPrototype({
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
