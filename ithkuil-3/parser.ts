import type { LetterForm } from "./forms.js"
import type { ParsedWord } from "./parse-word.js"

type Constructor<T> = abstract new (...args: any[]) => T

export class TokenParser {
    /**
     * This is always equal to the index of the element that would be grabbed by
     * `takeLeft`.
     */
    leftIndex = 0

    /**
     * This is always equal to one after the index of the element that would be
     * grabbed by `takeRight`.
     */
    rightIndex: number

    constructor(readonly tokens: readonly LetterForm[]) {
        this.rightIndex = this.tokens.length
    }

    takeLeft<T>(type: Constructor<T>): T {
        if (this.leftIndex < this.rightIndex) {
            const token = this.tokens[this.leftIndex]

            if (token instanceof type) {
                this.leftIndex++
                return token
            }
        }

        throw new Error("Could not find token of type " + type + ".")
    }

    takeRight<T>(type: Constructor<T>): T {
        if (this.leftIndex < this.rightIndex) {
            const token = this.tokens[this.rightIndex - 1]

            if (token instanceof type) {
                this.rightIndex--
                return token
            }
        }

        throw new Error("Could not find token of type " + type + ".")
    }

    optional<T>(fn: () => T, defaultValue?: undefined): T | undefined
    optional<T, U>(fn: () => T, defaultValue: U): T | U
    optional<T, U = undefined>(
        fn: () => T,
        defaultValue: U = undefined!,
    ): T | U {
        const { leftIndex, rightIndex } = this

        try {
            return fn()
        } catch {
            this.leftIndex = leftIndex
            this.rightIndex = rightIndex
        }

        return defaultValue
    }

    unmatchedTokens(): LetterForm[] {
        return this.tokens.slice(this.leftIndex, this.rightIndex)
    }
}

export function makeParser<T>(fn: (word: ParsedWord, state: TokenParser) => T) {
    return (word: ParsedWord): T => {
        return fn(word, new TokenParser(word.tokens))
    }
}
