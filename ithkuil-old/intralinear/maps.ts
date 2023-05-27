import type { Affiliation, Essence, Extension, Specification } from "../types"

export const affiliationMap: Record<Affiliation, string> = {
  consolidative: "",
  associative: "ASO",
  coalescent: "COA",
  variative: "VAR",
}

export const extensionMap: Record<Extension, string> = {
  delimitive: "",
  proximal: "PRX",
  inceptive: "ICP",
  attenuative: "ATV",
  graduative: "GRA",
  depletive: "DPL",
}

export const nonEmptyAffiliationMap: Record<Affiliation, string> = {
  consolidative: "CSL",
  associative: "ASO",
  coalescent: "COA",
  variative: "VAR",
}

export const nonEmptyExtensionMap: Record<Extension, string> = {
  delimitive: "DEL",
  proximal: "PRX",
  inceptive: "ICP",
  attenuative: "ATV",
  graduative: "GRA",
  depletive: "DPL",
}

export const specificationMap: Record<Specification, string> = {
  basic: "",
  contential: "CTE",
  constitutive: "CSV",
  objective: "OBJ",
}

export const nonEmptySpecificationMap: Record<Specification, string> = {
  basic: "",
  contential: "CTE",
  constitutive: "CSV",
  objective: "OBJ",
}

export const essenceMap: Record<Essence, string> = {
  normal: "",
  representative: "RPV",
}

export const nonEmptyEssenceMap: Record<Essence, string> = {
  normal: "NRM",
  representative: "RPV",
}
