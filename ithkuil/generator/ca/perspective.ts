import { deepFreeze } from "../../deep-freeze"

export type Perspective = "M" | "G" | "N" | "A"

export const ALL_PERSPECTIVES: readonly Perspective[] = deepFreeze([
  "M",
  "G",
  "N",
  "A",
])

export const PERSPECTIVE_TO_NAME_MAP = deepFreeze({
  M: "Monadic",
  G: "Agglomerative",
  N: "Nomic",
  A: "Abstract",
})
