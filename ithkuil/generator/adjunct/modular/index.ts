import {
  ALL_ASPECTS,
  aspectToIthkuil,
  slotVIIIToIthkuil,
  vnToIthkuil,
  type Aspect,
  type CaseScope,
  type Effect,
  type Level,
  type Mood,
  type Phase,
  type Valence,
} from "../../formative"
import { has } from "../../helpers/has"
import { VOWEL_TO_STRESSED_VOWEL_MAP } from "../../helpers/stress"
import { WithWYAlternative } from "../../helpers/with-wy-alternative"
import { modularAdjunctScopeToIthkuil, type ModularAdjunctScope } from "./scope"
import { modularAdjunctTypeToIthkuil, type ModularAdjunctType } from "./type"

export * from "./scope"
export * from "./type"

export type ModularAdjunct =
  | {
      readonly type?: ModularAdjunctType
      readonly cn?: undefined
      readonly vn1: Aspect
      readonly vn2?: undefined
      readonly vn3?: undefined
      readonly scope?: undefined
    }
  | {
      readonly type?: ModularAdjunctType
      readonly cn: Mood | CaseScope
      readonly vn1: Valence | Phase | Level | Effect | Aspect
      readonly vn2?: Valence | Phase | Level | Effect | Aspect
      readonly vn3: Valence | Phase | Level | Effect
      readonly scope?: undefined
    }
  | {
      readonly type?: ModularAdjunctType
      readonly cn: Mood | CaseScope
      readonly vn1: Valence | Phase | Level | Effect | Aspect
      readonly vn2?: Valence | Phase | Level | Effect | Aspect
      readonly vn3?: undefined
      readonly scope: ModularAdjunctScope
    }

export function modularAdjunctToIthkuil(adjunct: ModularAdjunct): string {
  const type = modularAdjunctTypeToIthkuil(adjunct.type ?? "WHOLE")

  if (adjunct.cn == null) {
    const aspect = WithWYAlternative.of(
      aspectToIthkuil(adjunct.vn1),
    ).withPreviousText(type)

    return type + aspect
  }

  const vn1 = slotVIIIToIthkuil(
    { cn: adjunct.cn, vn: adjunct.vn1 },
    { omitDefaultValence: false },
  ).withPreviousText(type)

  const second = adjunct.vn2
    ? vnToIthkuil(adjunct.vn2, false) +
      (has(ALL_ASPECTS, adjunct.vn2) ? "n" : "ň")
    : WithWYAlternative.EMPTY

  const vn2 = WithWYAlternative.of(second).withPreviousText(type + vn1)

  const output = type + vn1 + vn2

  if (adjunct.vn3) {
    const vn3 = vnToIthkuil(adjunct.vn3, false)

    return WithWYAlternative.add(output, vn3)
  }

  return (
    output +
    VOWEL_TO_STRESSED_VOWEL_MAP[modularAdjunctScopeToIthkuil(adjunct.scope)]
  )
}
