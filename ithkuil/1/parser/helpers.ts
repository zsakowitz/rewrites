import * as Z from "../../parsers/parser-5.js"
import type { Essence } from "../types.js"

export type SyllabicStressType =
    | "consonants-only"
    | "monosyllabic"
    | "ultimate"
    | "penultimate"
    | "antepenultimate"
    | "preantepenultimate"
    | "unmarked"

const stressedSyllable = /[áéíóúâêôû]/i

export const stressedVowelToUnstressedMap = {
    á: "a",
    é: "e",
    í: "i",
    ó: "o",
    ú: "u",
    â: "ä",
    ê: "ë",
    ô: "ö",
    û: "ü",
}

export class SyllabicStress {
    static of(word: string) {
        const vowelPacks = word.match(/[aeiouäëöüáéíóúâêôû]+/gi)

        if (!vowelPacks) {
            return new SyllabicStress("consonants-only")
        }

        if (vowelPacks.length == 1) {
            return new SyllabicStress("monosyllabic")
        }

        const stressMarkers = vowelPacks.map((pack) =>
            stressedSyllable.test(pack),
        )

        if (stressMarkers.at(-1)) {
            return new SyllabicStress("ultimate")
        }

        if (stressMarkers.at(-2)) {
            return new SyllabicStress("penultimate")
        }

        if (stressMarkers.at(-3)) {
            return new SyllabicStress("antepenultimate")
        }

        if (stressMarkers.at(-4)) {
            return new SyllabicStress("preantepenultimate")
        }

        return new SyllabicStress("unmarked")
    }

    constructor(readonly stress: SyllabicStressType) {}

    asReferentialEssence(): Essence {
        if (this.stress == "consonants-only") {
            throw new Error("A referential cannot have only consonants.")
        }

        if (this.stress == "ultimate") {
            return "representative"
        }

        return "normal"
    }
}

export function preTransform(word: string) {
    word = word.replace(/[‘’]/gi, "'")

    word = word.toLowerCase()

    if (word.startsWith("'") && word[1]?.match(/[aeiouäëöüáéíóúâêôû]/i)) {
        word = word.slice(1)
    }

    const stress = SyllabicStress.of(word)

    word = word.replace(
        /[áéíóúâêôû]/gi,
        (vowel) =>
            stressedVowelToUnstressedMap[
                vowel as keyof typeof stressedVowelToUnstressedMap
            ],
    )

    return { word, stress }
}

export const Word = Z.regex(/^\p{L}+/iu)

export const NormalizedWordWithStress = Word.map((word) =>
    preTransform(word[0]),
)

export function normalized<T>(parser: Z.Parser<T>) {
    const ParserWithEndMarker = Z.seq(parser, Z.EndOfSource).map(
        (value) => value[0],
    )

    return NormalizedWordWithStress.map(({ word, stress }) => ({
        word,
        stress,
        value: Z.unwrap(ParserWithEndMarker.parse(word)),
    }))
}
