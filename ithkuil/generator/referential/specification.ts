import type { Specification } from "../formative"
import { deepFreeze } from "../helpers/deep-freeze"

export const REFERENTIAL_SPECIFICATION_TO_ITHKUIL_MAP =
  /* @__PURE__ */ deepFreeze({
    BSC: "x",
    CTE: "xt",
    CSV: "xp",
    OBJ: "xx",
  })

export function referentialSpecificationToIthkuil(
  specification: Specification,
): string {
  return REFERENTIAL_SPECIFICATION_TO_ITHKUIL_MAP[specification]
}
