import { referentialToIthkuil } from "@zsnout/ithkuil"

const result = referentialToIthkuil({
  referents: ["1m:BEN"],
  specification: "CTE",
  affixes: [
    {
      type: 1,
      degree: 3,
      cs: "c",
    },
  ],
})

console.log(result)
