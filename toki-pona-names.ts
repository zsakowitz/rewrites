// Generates random toki pona-style names.

import { randomItem } from "./random-item.js"

const VOWELS = "aeiou"
const CONSONANTS = "jklmnpstw"
const CONSONANTS_WITHOUT_MN = "jklpstw"
const MAYBE_N = ["", "", "", "n"] as const

export function createRandomTokiPonaName(
    minSyllables: number,
    maxSyllables: number,
) {
    const syllableCount = Math.floor(
        Math.random() * (maxSyllables - minSyllables) + minSyllables,
    )

    let name = ""

    if (Math.random() < 0.5) {
        name += randomItem(VOWELS)
    }

    for (let i = 0; i < syllableCount; i++) {
        let output

        if (name.endsWith("n")) {
            output =
                randomItem(CONSONANTS_WITHOUT_MN)
                + randomItem(VOWELS)
                + randomItem(MAYBE_N)
        } else {
            output =
                randomItem(CONSONANTS)
                + randomItem(VOWELS)
                + randomItem(MAYBE_N)
        }

        if (
            output.includes("ji")
            || output.includes("ti")
            || output.includes("wo")
            || output.includes("wu")
        ) {
            i--
            continue
        }

        name += output
    }

    return name
}

export function generateMany(
    count: number,
    minSyllables: number,
    maxSyllables: number,
) {
    return Array.from({ length: count }, () =>
        createRandomTokiPonaName(minSyllables, maxSyllables),
    )
}
