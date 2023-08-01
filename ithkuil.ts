import { formativeToIthkuil } from "@zsnout/ithkuil/generate"

const result = formativeToIthkuil({
  root: "l",
  type: "UNF/C",
  stem: 0,
  context: "RPS",
  slotVAffixes: [
    {
      cs: "sm",
      degree: 7,
      type: 1,
    },
    {
      cs: "rļ",
      degree: 3,
      type: 1,
    },
    {
      cs: "řg",
      degree: 4,
      type: 1,
    },
  ],
  ca: {
    configuration: "MSS",
    extension: "PRX",
    perspective: "G",
  },
  slotVIIAffixes: [
    {
      cs: "rt",
      degree: 2,
      type: 1,
    },
    {
      cs: "cč",
      degree: 7,
      type: 1,
    },
  ],
})

console.log(result)
