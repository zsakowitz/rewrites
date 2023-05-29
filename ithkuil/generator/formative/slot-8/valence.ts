import { deepFreeze } from "../../helpers/deep-freeze"

export type Valence =
  | "MNO"
  | "PRL"
  | "CRO"
  | "RCP"
  | "CPL"
  | "DUP"
  | "DEM"
  | "CNG"
  | "PTI"

export const ALL_VALENCES: readonly Valence[] = [
  "MNO",
  "PRL",
  "CRO",
  "RCP",
  "CPL",
  "DUP",
  "DEM",
  "CNG",
  "PTI",
]

export const VALENCE_TO_ITHKUIL_MAP = /* @__PURE__ */ deepFreeze({
  MNO: "a",
  PRL: "ä",
  CRO: "e",
  RCP: "i",
  CPL: "ëi",
  DUP: "ö",
  DEM: "o",
  CNG: "ü",
  PTI: "u",
} satisfies Record<Valence, string>)

export const VALENCE_TO_NAME_MAP = /* @__PURE__ */ deepFreeze({
  MNO: "Monoactive",
  PRL: "Parallel",
  CRO: "Corollary",
  RCP: "Reciprocal",
  CPL: "Complementary",
  DUP: "Duplicative",
  DEM: "Demonstrative",
  CNG: "Contingent",
  PTI: "Participatory",
} satisfies Record<Valence, string>)

export function valenceToIthkuil(
  valence: Valence,
  allowOmittingDefaultValence: boolean,
): string {
  const value = VALENCE_TO_ITHKUIL_MAP[valence]

  if (allowOmittingDefaultValence && value == "a") {
    return ""
  }

  return value
}
