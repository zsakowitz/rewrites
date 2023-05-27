import { deepFreeze } from "../../helpers/deep-freeze"

export type Specification = "BSC" | "CTE" | "CSV" | "OBJ"

export const ALL_SPECIFICATIONS: readonly Specification[] = deepFreeze([
  "BSC",
  "CTE",
  "CSV",
  "OBJ",
])

export const SPECIFICATION_TO_NAME_MAP = deepFreeze({
  BSC: "Basic",
  CTE: "Contential",
  CSV: "Constitutive",
  OBJ: "Objective",
})
