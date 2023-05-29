import { caseToIthkuil, type Case } from "../../formative"
import { WithWYAlternative } from "../../helpers/with-wy-alternative"
import {
  suppletiveAdjunctTypeToIthkuil,
  type SuppletiveAdjunctType,
} from "./type"

export * from "./type"

/** A suppletive adjunct. */
export type SuppletiveAdjunct = {
  /** The type of the adjunct. */
  readonly type: SuppletiveAdjunctType

  /** The case of the adjunct. */
  readonly case: Case
}

/**
 * Converts a suppletive adjunct into Ithkuil.
 * @param adjunct The adjunct to be converted.
 * @returns Romanized Ithkuilic text representing the adjunct.
 */
export function suppletiveAdjunctToIthkuil(adjunct: SuppletiveAdjunct) {
  const type = suppletiveAdjunctTypeToIthkuil(adjunct.type)

  return WithWYAlternative.add(type, caseToIthkuil(adjunct.case, false, false))
}
