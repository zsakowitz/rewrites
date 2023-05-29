import { caseToIthkuil, type Case } from "../../formative"
import { WithWYAlternative } from "../../helpers/with-wy-alternative"
import {
  suppletiveAdjunctTypeToIthkuil,
  type SuppletiveAdjunctType,
} from "./type"

export * from "./type"

export type SuppletiveAdjunct = {
  readonly type: SuppletiveAdjunctType
  readonly case: Case
}

export function suppletiveAdjunctToIthkuil(adjunct: SuppletiveAdjunct): string {
  const type = suppletiveAdjunctTypeToIthkuil(adjunct.type)

  return WithWYAlternative.add(type, caseToIthkuil(adjunct.case, false, false))
}
