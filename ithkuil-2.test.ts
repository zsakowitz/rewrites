import { formativeToIthkuil, type Formative } from "@zsnout/ithkuil/generate"

const formative: Formative = {
    type: "FRM",
    shortcut: false,
    version: "PRC",
    stem: 0,
    root: "ř",
    function: "DYN",
    specification: "OBJ",
    context: "EXS",
    slotVAffixes: [],
    ca: {
        affiliation: "CSL",
        configuration: "UPX",
        extension: "ATV",
        perspective: "G",
        essence: "NRM",
    },
    slotVIIAffixes: [],
    vn: "MNO",
    caseScope: "CCN",
    case: "THM",
}

const result = formativeToIthkuil(formative)

console.log(result)
