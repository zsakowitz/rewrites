import { strictEqual } from "assert"
import { formativeToIthkuil } from "./generator/index"

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
      type: "CA",
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

console.log(result2)
