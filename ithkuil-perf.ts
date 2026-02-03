import {
    ALL_AFFILIATIONS,
    ALL_AFFIX_DEGREES,
    ALL_ASPECTS,
    ALL_CASE_SCOPES,
    ALL_CASES,
    ALL_CONFIGURATIONS,
    ALL_CONTEXTS,
    ALL_EFFECTS,
    ALL_ESSENCES,
    ALL_EXTENSIONS,
    ALL_FUNCTIONS,
    ALL_ILLOCUTION_OR_VALIDATIONS,
    ALL_LEVELS,
    ALL_MOODS,
    ALL_PERSPECTIVES,
    ALL_PHASES,
    ALL_REFERENTS,
    ALL_SPECIFICATIONS,
    ALL_STEMS,
    ALL_VALENCES,
    ALL_VERSIONS,
    formativeToIthkuil,
    type Affix,
    type SlotIII,
    ALL_AFFIX_TYPES,
    type PartialCA,
} from "@zsnout/ithkuil/generate"
import { randomItem } from "./random-item.js"
import { readFileSync } from "fs"
import { parseFormative } from "@zsnout/ithkuil/parse/index.js"

export function generate() {
    function cs(): string {
        let output = randomItem("bcčdḑfgjklmnňprřsštţvxz")

        while (Math.random() < 0.5) {
            output += randomItem(
                "bcčdḑfghjklļmnňprřsštţvxz".replace(output.at(-1)!, ""),
            )
        }

        return output
    }

    function referent() {
        return randomItem(ALL_REFERENTS)!
    }

    function root(): SlotIII {
        if (Math.random() < 0.25) {
            return { cs: cs(), degree: randomItem(ALL_AFFIX_DEGREES)! }
        }

        if (Math.random() < 0.33) {
            return [referent()]
        }

        if (Math.random() < 0.5) {
            return Math.floor(Math.random() * 10000)
        }

        return cs()
    }

    function ca(): PartialCA {
        return {
            affiliation: randomItem(ALL_AFFILIATIONS),
            configuration: randomItem(ALL_CONFIGURATIONS),
            extension: randomItem(ALL_EXTENSIONS),
            perspective: randomItem(ALL_PERSPECTIVES),
            essence: randomItem(ALL_ESSENCES),
        }
    }

    function affix(): Affix {
        if (Math.random() < 0.2) {
            return { case: randomItem(ALL_CASES)! }
        }

        if (Math.random() < 0.25) {
            return {
                case: randomItem(ALL_CASES)!,
                isInverse: randomItem([true, false]),
                type: randomItem(ALL_AFFIX_TYPES)!,
            }
        }

        if (Math.random() < 0.33) {
            return { ca: ca() }
        }

        return {
            cs: cs(),
            degree: randomItem(ALL_AFFIX_DEGREES)!,
            type: randomItem([1, 2])!,
        }
    }

    function affixes(): Affix[] {
        const output: Affix[] = []

        while (Math.random() < 0.25) {
            output.push(affix())
        }

        return output
    }

    return formativeToIthkuil({
        root: root(),
        type: randomItem(["UNF/C", "UNF/K", "FRM"]),
        concatenationType: randomItem([1, 2, "none"]),
        caseScope: randomItem(ALL_CASE_SCOPES),
        mood: randomItem(ALL_MOODS),
        case: randomItem(ALL_CASES),
        illocutionValidation: randomItem(ALL_ILLOCUTION_OR_VALIDATIONS),
        specification: randomItem(ALL_SPECIFICATIONS),
        function: randomItem(ALL_FUNCTIONS),
        context: randomItem(ALL_CONTEXTS),
        version: randomItem(ALL_VERSIONS),
        stem: randomItem(ALL_STEMS),
        ca: ca(),
        slotVAffixes: affixes(),
        slotVIIAffixes: affixes(),
        vn: randomItem([
            ...ALL_VALENCES,
            ...ALL_PHASES,
            ...ALL_EFFECTS,
            ...ALL_LEVELS,
            ...ALL_ASPECTS,
        ]),
    })
}

export async function genMany(count: number) {
    const data = Array.from({ length: count }, generate).join("\n")
    const fs = await import("fs")
    return fs.writeFileSync("./input.txt", data)
}

const input = readFileSync("./input.txt", "utf8")
const start = Date.now()
input.split("\n").map((x) => {
    try {
        const result = parseFormative(x)
        if (!result) {
            throw new Error()
        }
    } catch (value) {
        throw new Error(x + ": " + String(value))
    }
})
const end = Date.now()
console.log(end - start)
