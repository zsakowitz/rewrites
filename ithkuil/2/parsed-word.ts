import { ConsonantForm } from "./consonant-form.js"
import { VowelForm } from "./vowel-form.js"

export type Stress =
    | "antepenultimate"
    | "penultimate"
    | "ultimate"
    | "unmarked"
    | "monosyllabic"
    | "zerosyllabic"

export class ParsedWord {
    constructor(
        readonly tokens: readonly (VowelForm | ConsonantForm)[],
        readonly stress: Stress,
    ) {
        Object.freeze(this.tokens)
        Object.freeze(this)
    }

    toString() {
        let output = ""

        for (let index = 0; index < this.tokens.length; index++) {
            const token = this.tokens[index]!

            if (token instanceof ConsonantForm) {
                output += token.toString()
            } else {
                const value = token.toString(index == this.toString.length - 1)

                if (typeof value == "string") {
                    output += value
                } else {
                    output += value.withPreviousText(output)
                }
            }
        }
    }
}
