import { referentialToIthkuil } from "ithkuil"

const result = referentialToIthkuil({
  referrents: ["1m:BEN"],
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
