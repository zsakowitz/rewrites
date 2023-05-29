import { deepFreeze } from "../../helpers/deep-freeze"

export type Phase =
  | "PUN"
  | "ITR"
  | "REP"
  | "ITM"
  | "RCT"
  | "FRE"
  | "FRG"
  | "VAC"
  | "FLC"

export const ALL_PHASES: readonly Phase[] = /* @__PURE__ */ deepFreeze([
  "PUN",
  "ITR",
  "REP",
  "ITM",
  "RCT",
  "FRE",
  "FRG",
  "VAC",
  "FLC",
])

export const PHASE_TO_ITHKUIL_MAP = /* @__PURE__ */ deepFreeze({
  PUN: "ai",
  ITR: "au",
  REP: "ei",
  ITM: "eu",
  RCT: "ëu",
  FRE: "ou",
  FRG: "oi",
  VAC: "iu",
  FLC: "ui",
})

export const PHASE_TO_NAME_MAP = /* @__PURE__ */ deepFreeze({
  PUN: "Punctual",
  ITR: "Iterative",
  REP: "Repetitive",
  ITM: "Intermittent",
  RCT: "Recurrent",
  FRE: "Frequentative",
  FRG: "Fragmentative",
  VAC: "Vacillitative",
  FLC: "Fluctuative",
})

export function phaseToIthkuil(phase: Phase) {
  return PHASE_TO_ITHKUIL_MAP[phase]
}
