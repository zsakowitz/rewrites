import { deepFreeze } from "../helpers/deep-freeze"

export type Extension = "DEL" | "PRX" | "ICP" | "ATV" | "GRA" | "DPL"

export const ALL_EXTENSIONS: readonly Extension[] = /* @__PURE__ */ deepFreeze([
  "DEL",
  "PRX",
  "ICP",
  "ATV",
  "GRA",
  "DPL",
])

export const EXTENSION_TO_NAME_MAP = /* @__PURE__ */ deepFreeze({
  DEL: "Delimitive",
  PRX: "Proximal",
  ICP: "Inceptive",
  ATV: "Attenuative",
  GRA: "Graduative",
  DPL: "Depletive",
})

export const EXTENSION_TO_ITHKUIL_MAP = /* @__PURE__ */ deepFreeze({
  DEL: ["", ""],
  PRX: ["t", "d"],
  ICP: ["k", "g"],
  ATV: ["p", "b"],
  GRA: ["g", "gz"],
  DPL: ["b", "bz"],
})

export function extensionToIthkuil(
  extension: Extension,
  isCAUniplex: boolean,
): string {
  return EXTENSION_TO_ITHKUIL_MAP[extension][+isCAUniplex as 0 | 1]
}
