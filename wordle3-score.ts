// 30-bit number where each 6 bits are one letter

// a letter is 00..=25
export type Word = number & { __type: "word" }

const LETTER_FILTER = 0x3f
const LETTER_WIDTH = 6 // bit-width of a single letter
const WORD_LENGTH = 5
const LOWERCASE_A = 97

export function asWord(word: string): Word {
    let ret = 0

    ret |= (word.charCodeAt(0) - LOWERCASE_A) << (LETTER_WIDTH * 0)
    ret |= (word.charCodeAt(1) - LOWERCASE_A) << (LETTER_WIDTH * 1)
    ret |= (word.charCodeAt(2) - LOWERCASE_A) << (LETTER_WIDTH * 2)
    ret |= (word.charCodeAt(3) - LOWERCASE_A) << (LETTER_WIDTH * 3)
    ret |= (word.charCodeAt(4) - LOWERCASE_A) << (LETTER_WIDTH * 4)

    return ret as Word
}

// Expects `0 <= index < WORD_LENGTH`.
// Returns `0 <= value <= LETTER_FILTER`.
export function letterAt(word: Word, index: number): number {
    return (word >> (LETTER_WIDTH * index)) & LETTER_FILTER
}

// 10-bit number where each 2 bits are a score (00 grey, 01 yellow, 02 green)
export type Score = number & { __type: "score" }

const SCORE_FILTER = 0x3
const SCORE_WIDTH = 2 // bit-width of a single score-letter
const SCORE_YELLOW = 0b01
const SCORE_GREEN = 0b10

export function check(solution: Word, guess: Word): Score {
    let usedGuess = 0 // 5-bit word; a bit is set once its corresponding letter in the guess is used
    let usedWord = 0 // 5-bit word; a bit is set once its corresponding letter in the word is matched

    let score = 0

    // filter green letters first
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (letterAt(solution, i) == letterAt(guess, i)) {
            score |= SCORE_GREEN << (SCORE_WIDTH * i)
            usedGuess |= 1 << i
            usedWord |= 1 << i
        }
    }

    // find yellow letters
    for (let g = 0; g < WORD_LENGTH; g++) {
        // if this guess letter was already used for a green, skip it
        if (usedGuess & (1 << g)) {
            continue
        }

        for (let s = 0; s < WORD_LENGTH; s++) {
            if (usedWord & (1 << s)) {
                continue
            }

            if (letterAt(solution, s) == letterAt(guess, g)) {
                score |= SCORE_YELLOW << (SCORE_WIDTH * g)
                usedGuess |= 1 << g
                usedWord |= 1 << s
            }
        }
    }

    return score as Score
}

export function scoreToString(score: Score): string {
    let ret = ""

    for (let i = 0; i < WORD_LENGTH; i++) {
        ret += (score >> (SCORE_WIDTH * i)) & SCORE_FILTER
    }

    return ret
}

// Assumes the given string is a WORD_LENGTH-length string whose characters are only `0`, `1`, and `2`.
export function scoreFromString(score: string): Score {
    return parseInt(score, 4) as Score
}

// tests gathered by me playing various rounds;
// not foolproof, but should prevent basic programming errors

const tests = `
    eerie verve 02202
    eerie eerie 22222
    eerie prune 01002
    eerie store 00012
    eerie score 00012
    eerie rears 12000
    eerie eaten 20010
`

const failed = tests
    .split("\n")
    .map((x) => x.trim())
    .filter((x) => x)
    .map((x) => {
        const [solution, guess, expected] = x.split(" ")
        const actual = scoreToString(check(asWord(solution!), asWord(guess!)))
        if (expected != actual) {
            console.log("❌ " + x + " (returned " + actual + ")")
        }
        return expected != actual
    })
    .some((x) => x)

if (failed) {
    throw new Error("tests failed")
}
