import { deepFreeze } from "../helpers/deep-freeze"

export type Perspective = "M" | "G" | "N" | "A"

export const ALL_PERSPECTIVES: readonly Perspective[] =
  /* @__PURE__ */ deepFreeze(["M", "G", "N", "A"])

export const PERSPECTIVE_TO_NAME_MAP = /* @__PURE__ */ deepFreeze({
  M: "Monadic",
  G: "Agglomerative",
  N: "Nomic",
  A: "Abstract",
})
