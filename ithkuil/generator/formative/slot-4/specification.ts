import { deepFreeze } from "../../helpers/deep-freeze"

export type Specification = "BSC" | "CTE" | "CSV" | "OBJ"

export const ALL_SPECIFICATIONS: readonly Specification[] =
  /* @__PURE__ */ deepFreeze(["BSC", "CTE", "CSV", "OBJ"])

export const SPECIFICATION_TO_NAME_MAP = /* @__PURE__ */ deepFreeze({
  BSC: "Basic",
  CTE: "Contential",
  CSV: "Constitutive",
  OBJ: "Objective",
})
