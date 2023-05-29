import { deepFreeze } from "../../helpers/deep-freeze"

export type Version = "PRC" | "CPT"

export const ALL_VERSIONS: readonly Version[] = /* @__PURE__ */ deepFreeze([
  "PRC",
  "CPT",
])

export const VERSION_TO_NAME_MAP = /* @__PURE__ */ deepFreeze({
  PRC: "Processual",
  CPT: "Completive",
})
