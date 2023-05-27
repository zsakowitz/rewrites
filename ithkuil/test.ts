import * as Ithkuil from "./generator/formative"

const result = Ithkuil.formativeToIthkuil({
  type: "UNF/C",
  root: "d",
  slotVAffixes: [{ type: 2, degree: 3, cs: "k" }],
})

console.log(result)
