import { WithWYAlternative } from "@zsnout/ithkuil/generate"

function insertGlottalStopIntoText(text: string, isAtEndOfWord: boolean) {
    if (isAtEndOfWord) {
        if (text.length == 1) {
            return text + "'" + text
        }

        if (text.length == 2) {
            return text[0] + "'" + text[1]
        }
    } else if (
        text.length == 1
        || text == "ai"
        || text == "au"
        || text == "ei"
        || text == "eu"
        || text == "ëi"
        || text == "ëu"
        || text == "oi"
        || text == "ou"
        || text == "iu"
        || text == "ui"
    ) {
        return text + "'"
    } else if (text.length == 2) {
        return text[0] + "'" + text[1]
    }

    throw new Error("Invalid vowel form '" + text + "'.")
}

export function insertGlottalStop(text: string, isAtEndOfWord: boolean): string

export function insertGlottalStop(
    text: WithWYAlternative,
    isAtEndOfWord: boolean,
): WithWYAlternative

export function insertGlottalStop(
    text: string | WithWYAlternative,
    isAtEndOfWord: boolean,
): string | WithWYAlternative

export function insertGlottalStop(
    text: string | WithWYAlternative,
    isAtEndOfWord: boolean,
): string | WithWYAlternative {
    if (typeof text == "string") {
        return insertGlottalStopIntoText(text, isAtEndOfWord)
    }

    return new WithWYAlternative(
        insertGlottalStopIntoText(text.defaultValue, isAtEndOfWord),
        insertGlottalStopIntoText(text.valueAfterW, isAtEndOfWord),
        insertGlottalStopIntoText(text.valueAfterY, isAtEndOfWord),
    )
}
