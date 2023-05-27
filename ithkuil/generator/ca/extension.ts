import { deepFreeze } from "../../deep-freeze"

export type Extension = "DEL" | "PRX" | "ICP" | "ATV" | "GRA" | "DPL"

export const ALL_EXTENSIONS: readonly Extension[] = deepFreeze([
  "DEL",
  "PRX",
  "ICP",
  "ATV",
  "GRA",
  "DPL",
])

export const EXTENSION_TO_NAME_MAP = deepFreeze({
  DEL: "Delimitive",
  PRX: "Proximal",
  ICP: "Inceptive",
  ATV: "Attenuative",
  GRA: "Graduative",
  DPL: "Depletive",
})

export const EXTENSION_TO_LETTER_MAP = deepFreeze({
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
  return EXTENSION_TO_LETTER_MAP[extension][+isCAUniplex as 0 | 1]
}
