import { deepFreeze } from "../../../deep-freeze"

export type Illocution =
  | "ASR"
  | "DIR"
  | "DEC"
  | "IRG"
  | "VRF"
  | "ADM"
  | "POT"
  | "HOR"
  | "CNJ"

export const ALL_ILLOCUTIONS: readonly Illocution[] = deepFreeze([
  "ASR",
  "DIR",
  "DEC",
  "IRG",
  "VRF",
  "ADM",
  "POT",
  "HOR",
  "CNJ",
])

export const ILLOCUTION_TO_NAME_MAP = deepFreeze({
  ASR: "Assertive",
  DIR: "Directive",
  DEC: "Declarative",
  IRG: "Interrogative",
  VRF: "Verificative",
  ADM: "Admonitive",
  POT: "Potentiative",
  HOR: "Hortative",
  CNJ: "Conjectural",
})
