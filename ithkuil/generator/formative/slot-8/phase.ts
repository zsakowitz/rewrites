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

export const ALL_PHASES: readonly Phase[] = deepFreeze([
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

export const PHASE_TO_LETTER_MAP = deepFreeze({
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

export const PHASE_TO_NAME_MAP = deepFreeze({
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
  return PHASE_TO_LETTER_MAP[phase]
}
