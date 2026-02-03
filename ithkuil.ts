import { formativeToIthkuil } from "@zsnout/ithkuil/generate"

const result = formativeToIthkuil({
    type: "UNF/C",
    shortcut: "VIII",
    root: "rr",
    slotVIIAffixes: [{ cs: "t", type: 1, degree: 4 }],
    caseScope: "CCQ",
})

console.log(result)
