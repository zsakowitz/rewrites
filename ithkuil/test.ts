import { strictEqual } from "assert"
import {
  affixualAdjunctToIthkuil,
  formativeToIthkuil,
  modularAdjunctToIthkuil,
  referentialToIthkuil,
} from "./generator"

const result = formativeToIthkuil({
  type: "UNF/C",
  root: "c",
  specification: "CTE",
  vn: "PCL",
  slotVAffixes: [
    { type: 2, degree: 6, cs: "p" },
    { type: 3, degree: 3, cs: "kl" },
  ],
  slotVIIAffixes: [
    {
      type: "ca",
      ca: { configuration: "MSS" },
    },
  ],
  concatenatenationType: 2,
  case: "TSP",
  caseScope: "CCS",
})

strictEqual(result, "hwa'cäpoukliollüötëuhrwöë")

const result2 = formativeToIthkuil({
  type: "FRM",
  root: "c",
  version: "CPT",
  vn: "3:DET",
  ca: {
    affiliation: "COA",
    configuration: "DPX",
    extension: "PRX",
    perspective: "A",
    essence: "NRM",
  },
})

strictEqual(result2, "äcarstyúoha")

const result3 = referentialToIthkuil({
  referrents: ["2p:BEN"],
  specification: "CSV",
  essence: "RPV",
  case: "IDP",
  case2: "INV",
  affixes: [
    { type: 2, degree: 7, cs: "k" },
    { type: "ca", ca: { configuration: "MSS" } },
  ],
})

strictEqual(result3, "tiuxpoiküötu'ó")

const result4 = formativeToIthkuil({
  root: "l",
  type: "UNF/C",
  slotVIIAffixes: [
    { type: "ref", referrent: "1m:BEN", case: "ERG", perspective: "G" },
  ],
})

strictEqual(result4, "laloerļ")

const result5 = affixualAdjunctToIthkuil({
  affixes: [
    {
      type: 1,
      degree: 1,
      cs: "c",
    },
    {
      type: 1,
      degree: 3,
      cs: "c",
    },
  ],
  appliesToConcatenatedStemOnly: true,
})

strictEqual(result5, "cahecái")

const result6 = modularAdjunctToIthkuil({
  vn1: "RTR",
  cn: "CCQ",
  scope: "ADJACENT",
})

strictEqual(result6, "ahmwó")

const result7 = modularAdjunctToIthkuil({
  cn: "CCQ",
  vn1: "2:BEN",
  vn2: "DUP",
  vn3: "MNO",
})

strictEqual(result7, "iehmöňa")

const result8 = modularAdjunctToIthkuil({
  cn: "CCQ",
  vn1: "2:BEN",
  vn2: "DUP",
  scope: "CASE/MOOD",
})

strictEqual(result8, "iehmöňé")