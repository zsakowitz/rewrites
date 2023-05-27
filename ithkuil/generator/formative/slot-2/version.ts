import { deepFreeze } from "../../helpers/deep-freeze"

export type Version = "PRC" | "CPT"

export const ALL_VERSIONS: readonly Version[] = deepFreeze(["PRC", "CPT"])

export const VERSION_TO_NAME_MAP = deepFreeze({
  PRC: "Processual",
  CPT: "Completive",
})
