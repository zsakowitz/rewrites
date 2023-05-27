import { deepFreeze } from "../../../deep-freeze"
import {
  IA_UÄ,
  IE_UË,
  IO_ÜÄ,
  IÖ_ÜË,
  UA_IÄ,
  UE_IË,
  UO_ÖÄ,
  UÖ_ÖË,
  WithWYAlternative,
} from "../../with-wy-alternative"

export type Case =
  | "THM"
  | "INS"
  | "ABS"
  | "AFF"
  | "STM"
  | "EFF"
  | "ERG"
  | "DAT"
  | "IND"
  | "POS"
  | "PRP"
  | "GEN"
  | "ATT"
  | "PDC"
  | "ITP"
  | "OGN"
  | "IDP"
  | "PAR"
  | "APL"
  | "PUR"
  | "TRA"
  | "DFR"
  | "CRS"
  | "TSP"
  | "CMM"
  | "CMP"
  | "CSD"
  | "FUN"
  | "TFM"
  | "CLA"
  | "RSL"
  | "CSM"
  | "CON"
  | "AVR"
  | "CVS"
  | "SIT"
  | "PRN"
  | "DSP"
  | "COR"
  | "CPS"
  | "COM"
  | "UTL"
  | "PRD"
  | "RLT"
  | "ACT"
  | "ASI"
  | "ESS"
  | "TRM"
  | "SEL"
  | "CFM"
  | "DEP"
  | "VOC"
  | "LOC"
  | "ATD"
  | "ALL"
  | "ABL"
  | "ORI"
  | "IRL"
  | "INV"
  | "NAV"
  | "CNR"
  | "ASS"
  | "PER"
  | "PRO"
  | "PCV"
  | "PCR"
  | "ELP"
  | "PLM"

export const ALL_CASES: readonly Case[] = deepFreeze([
  "THM",
  "INS",
  "ABS",
  "AFF",
  "STM",
  "EFF",
  "ERG",
  "DAT",
  "IND",

  "POS",
  "PRP",
  "GEN",
  "ATT",
  "PDC",
  "ITP",
  "OGN",
  "IDP",
  "PAR",

  "APL",
  "PUR",
  "TRA",
  "DFR",
  "CRS",
  "TSP",
  "CMM",
  "CMP",
  "CSD",

  "FUN",
  "TFM",
  "CLA",
  "RSL",
  "CSM",
  "CON",
  "AVR",
  "CVS",
  "SIT",

  "PRN",
  "DSP",
  "COR",
  "CPS",
  "COM",
  "UTL",
  "PRD",
  "RLT",

  "ACT",
  "ASI",
  "ESS",
  "TRM",
  "SEL",
  "CFM",
  "DEP",
  "VOC",

  "LOC",
  "ATD",
  "ALL",
  "ABL",
  "ORI",
  "IRL",
  "INV",
  "NAV",

  "CNR",
  "ASS",
  "PER",
  "PRO",
  "PCV",
  "PCR",
  "ELP",
  "PLM",
])

export const CASE_TO_LETTER_MAP = deepFreeze({
  THM: "a",
  INS: "ä",
  ABS: "e",
  AFF: "i",
  STM: "ëi",
  EFF: "ö",
  ERG: "o",
  DAT: "ü",
  IND: "u",

  POS: "ai",
  PRP: "au",
  GEN: "ei",
  ATT: "eu",
  PDC: "ëu",
  ITP: "ou",
  OGN: "oi",
  IDP: "iu",
  PAR: "ui",

  APL: IA_UÄ,
  PUR: IE_UË,
  TRA: IO_ÜÄ,
  DFR: IÖ_ÜË,
  CRS: "eë",
  TSP: UÖ_ÖË,
  CMM: UO_ÖÄ,
  CMP: UE_IË,
  CSD: UA_IÄ,

  FUN: "ao",
  TFM: "aö",
  CLA: "eo",
  RSL: "eö",
  CSM: "oë",
  CON: "öe",
  AVR: "oe",
  CVS: "öa",
  SIT: "oa",

  PRN: "a'a",
  DSP: "ä'ä",
  COR: "e'e",
  CPS: "i'i",
  COM: "ë'i",
  UTL: "ö'ö",
  PRD: "o'o",
  RLT: "u'u",

  ACT: "a'i",
  ASI: "a'u",
  ESS: "e'i",
  TRM: "e'u",
  SEL: "ë'u",
  CFM: "o'u",
  DEP: "o'i",
  VOC: "u'i",

  LOC: "i'a",
  ATD: "i'e",
  ALL: "i'o",
  ABL: "i'ö",
  ORI: "e'ë",
  IRL: "u'ö",
  INV: "u'o",
  NAV: "u'a",

  CNR: "a'o",
  ASS: "a'ö",
  PER: "e'o",
  PRO: "e'ö",
  PCV: "o'ë",
  PCR: "ö'e",
  ELP: "o'e",
  PLM: "o'a",
})

export const CASE_TO_NAME_MAP = deepFreeze({
  THM: "Thematic",
  INS: "Instrumental",
  ABS: "Absolutive",
  AFF: "Affective",
  STM: "Stimulative",
  EFF: "Effectuative",
  ERG: "Ergative",
  DAT: "Dative",
  IND: "Inducive",

  POS: "Possessive",
  PRP: "Proprietive",
  GEN: "Genitive",
  ATT: "Attributive",
  PDC: "Productive",
  ITP: "Interpretative",
  OGN: "Originative",
  IDP: "Interdependent",
  PAR: "Partitive",

  APL: "Applicative",
  PUR: "Purposive",
  TRA: "Transmissive",
  DFR: "Deferential",
  CRS: "Contrastive",
  TSP: "Transpositive",
  CMM: "Commutative",
  CMP: "Comparative",
  CSD: "Considerative",

  FUN: "Functive",
  TFM: "Transformative",
  CLA: "Classificative",
  RSL: "Resultative",
  CSM: "Consumptive",
  CON: "Concessive",
  AVR: "Aversive",
  CVS: "Conversive",
  SIT: "Situative",

  PRN: "Pertinential",
  DSP: "Descriptive",
  COR: "Correlative",
  CPS: "Compositive",
  COM: "Comitative",
  UTL: "Utilitative",
  PRD: "Predicative",
  RLT: "Relative",

  ACT: "Activative",
  ASI: "Assimilative",
  ESS: "Essive",
  TRM: "Terminative",
  SEL: "Selective",
  CFM: "Conformative",
  DEP: "Dependent",
  VOC: "Vocative",

  LOC: "Locative",
  ATD: "Attendant",
  ALL: "Allative",
  ABL: "Ablative",
  ORI: "Orientative",
  IRL: "Interrelative",
  INV: "Intrative",
  NAV: "Navigative",

  CNR: "Concursive",
  ASS: "Assessive",
  PER: "Periodic",
  PRO: "Prolapsive",
  PCV: "Precursive",
  PCR: "Postcursive",
  ELP: "Elapsive",
  PLM: "Prolimitive",
})

export function caseToIthkuil(
  case_: Case,
  elideIfPossible: boolean,
): string | WithWYAlternative {
  if (elideIfPossible && case_ == "THM") {
    return ""
  }

  return CASE_TO_LETTER_MAP[case_]
}
