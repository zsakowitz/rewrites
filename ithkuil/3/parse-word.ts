import {
    SpecialConsonantForm,
    StandardConsonantForm,
    VowelForm,
    type LetterForm,
} from "./forms.js"
import {
    preTransform,
    type Stress,
    type TransformedWord,
} from "./pre-parse-word.js"
import { tokenizeFormative } from "./tokenize/formative.js"

export class ParsedWord {
    static of(word: string): ParsedWord {
        return ParsedWord.fromNormalized(preTransform(word))
    }

    static fromNormalized({
        source,
        normalized,
        word,
        stress,
    }: TransformedWord) {
        return new ParsedWord(
            source,
            normalized,
            word,
            stress,
            (word.match(/[aeiouäëöü']+|[^aeiouäëöü']+/g) || []).map(
                (source) => {
                    if ("aeiouäëöü'".includes(source[0]!)) {
                        return VowelForm.of(source)
                    } else if ("wyh".includes(source[0]!)) {
                        return new SpecialConsonantForm(source)
                    } else {
                        return new StandardConsonantForm(source)
                    }
                },
            ),
        )
    }

    constructor(
        readonly source: string,
        readonly normalized: string,
        readonly word: string,
        readonly stress: Stress,
        readonly tokens: LetterForm[],
    ) {
        Object.freeze(this)
    }

    toFormativeSlots() {
        return tokenizeFormative(this)
    }
}
