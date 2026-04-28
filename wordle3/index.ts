import { init } from "../parsers/parser-3"
import { shuffle } from "../shuffle"
import { solutions } from "./data"
import {
    check,
    WORD_LENGTH,
    wordFromString,
    wordToString,
    type Word,
} from "./score"

function pick(words: Set, max: number): Set {
    return shuffle(words).slice(0, max)
}

// We use `Set` to refer to an inhabited (nonempty) array of words. They must not
// contain duplicates.
type Set = readonly Word[]

// A strategy picks the next word to guess given a list of possible solutions.
//
// Instead of providing strategies with a list of past scores and past guesses,
// we just provide the list of remaining possibilities. No reasonable strategy
// relies on the actual list of guesses, so this is sufficient.
type Strategy = (possible: Set) => Word

const SOLUTIONS: Set = shuffle(solutions).map(wordFromString)

const PARTITIONS = Array<number>(4 ** WORD_LENGTH).fill(0)

function variance(x: number[]): number {
    const avg = x.reduce((a, b) => a + b, 0) / x.length
    return x.reduce((a, b) => a + (b - avg) * (b - avg), 0) / x.length
}

// Let `P` be a set and `G` be a word. Partition `P` by the score when each word
// is checked against the guess `G`. This function returns the variance
// of the sizes of the partitions.
function varPartitionSize(possible: Set, guess: Word): number {
    PARTITIONS.fill(0)

    for (let i = 0; i < possible.length; i++) {
        const solution = possible[i]!
        const score = check(solution, guess)
        PARTITIONS[score] ??= 0
        PARTITIONS[score]!++
    }

    return variance(PARTITIONS.filter((x) => x != 0))
}

// Statistic which counts how many guesses it takes to get every word. If a
// strategy takes more than `max` guesses, it is replaced with `Infinity`.
function statGuesses(possible: Set, strat: Strategy, max = 6) {
    const initial = Date.now()

    for (let i = 0; i < possible.length; i++) {
        const answer = possible[i]!

        let remaining = possible
        let rounds = 0

        while (remaining.length > 1 && rounds < max) {
            const guess = strat(remaining)
            const score = check(answer, guess)

            remaining = remaining.filter(
                (solution) => check(solution, guess) === score,
            )

            rounds++
        }

        if (rounds > max) {
            rounds = Infinity
        }

        console.log(
            `${wordToString(answer)}: ${rounds}, // ${Date.now() - initial} est. ${Math.round(((Date.now() - initial) * ((possible.length - i) / i)) / 1000)}`,
        )
    }
}

// Strategy which minimizes the variance of the partition sizes.
//
// Takes `O(|possible|²)` time.
function stratMinimizeVarPartitionSize(possible: Set): Word {
    let min = varPartitionSize(possible, possible[0]!)
    let ret = possible[0]!

    for (let i = 1; i < possible.length; i++) {
        const guess = possible[i]!
        const size = varPartitionSize(possible, guess)
        if (size < min) {
            min = size
            ret = guess
        }
    }

    return ret
}

console.time()
statGuesses(SOLUTIONS, stratMinimizeVarPartitionSize)
console.timeEnd()
