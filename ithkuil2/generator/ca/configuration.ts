import { deepFreeze } from "../../deep-freeze"

export type Configuration =
  | "UPX"
  | "DPX"
  | "MSS"
  | "MSC"
  | "MSF"
  | "MDS"
  | "MDC"
  | "MDF"
  | "MFS"
  | "MFC"
  | "MFF"
  | "DSS"
  | "DSC"
  | "DSF"
  | "DDS"
  | "DDC"
  | "DDF"
  | "DFS"
  | "DFC"
  | "DFF"

export const ALL_CONFIGURATIONS: readonly Configuration[] = deepFreeze([
  "UPX",
  "DPX",
  "MSS",
  "MSC",
  "MSF",
  "MDS",
  "MDC",
  "MDF",
  "MFS",
  "MFC",
  "MFF",
  "DSS",
  "DSC",
  "DSF",
  "DDS",
  "DDC",
  "DDF",
  "DFS",
  "DFC",
  "DFF",
])

export const CONFIGURATION_TO_LETTER_MAP = deepFreeze({
  UPX: "",
  DPX: "s",

  DSS: "c",
  DSC: "ks",
  DSF: "ps",

  DDS: "ţs",
  DDC: "fs",
  DDF: "š",

  DFS: "č",
  DFC: "kš",
  DFF: "pš",

  MSS: "t",
  MSC: "k",
  MSF: "p",

  MDS: "ţ",
  MDC: "f",
  MDF: "ç",

  MFS: "z",
  MFC: "ž",
  MFF: "ẓ",
} as const)

export function configurationToIthkuil(configuration: Configuration): string {
  return CONFIGURATION_TO_LETTER_MAP[configuration]
}
