import { deepFreeze } from "../../helpers/deep-freeze"

export type Validation =
  | "OBS"
  | "REC"
  | "PUP"
  | "RPR"
  | "USP"
  | "IMA"
  | "CVN"
  | "ITU"
  | "INF"

export const ALL_VALIDATIONS: readonly Validation[] =
  /* @__PURE__ */ deepFreeze([
    "OBS",
    "REC",
    "PUP",
    "RPR",
    "USP",
    "IMA",
    "CVN",
    "ITU",
    "INF",
  ])

export const VALIDATION_TO_NAME_MAP = /* @__PURE__ */ deepFreeze({
  OBS: "Observational",
  REC: "Recollective",
  PUP: "Purportive",
  RPR: "Reportive",
  USP: "Unspecified",
  IMA: "Imaginary",
  CVN: "Conventional",
  ITU: "Intuitive",
  INF: "Inferential",
})
