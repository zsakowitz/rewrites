import * as Ithkuil from "./generator/formative"

const result = Ithkuil.formativeToIthkuil({
  type: "NOM",
  root: "l",
  function: "DYN",
  ca: {
    affiliation: "VAR",
    configuration: "DPX",
    extension: "ICP",
    perspective: "N",
    essence: "RPV",
  },
  vn: "ITC",
  caseScope: "CCS",
  case: "DAT",
  context: "RPS",
})

console.log(result)
