import { deepFreeze } from "../../helpers/deep-freeze"

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

export const ALL_ILLOCUTIONS: readonly Illocution[] =
  /* @__PURE__ */ deepFreeze([
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

export const ILLOCUTION_TO_NAME_MAP = /* @__PURE__ */ deepFreeze({
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