import { deepFreeze } from "../../helpers/deep-freeze"

export type Context = "EXS" | "FNC" | "RPS" | "AMG"

export const ALL_CONTEXTS: readonly Context[] = deepFreeze([
  "EXS",
  "FNC",
  "RPS",
  "AMG",
])

export const CONTEXT_TO_NAME_MAP = deepFreeze({
  EXS: "Existential",
  FNC: "Functional",
  RPS: "Representational",
  AMG: "Amalgamative",
})
