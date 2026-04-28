import { shuffle } from "./shuffle"
import { solutions } from "./wordle3-data"
import {
    check,
    WORD_LENGTH,
    wordFromString,
    wordToString,
    type Word,
} from "./wordle3-score"

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

// Let `P` be a set and `G` be a word. Partition `P` by the score when each word
// is checked against the guess `G`. Then the "partition size" is defined to be
// the size of the largest partition.
//
// Intuitively, the partition size answers, "how many words COULD be left in the
// worst-case scenario after a given guess?"
//
// For instance, if some guess gives a score of `00100` for 45 words, a score of
// `21000` for 23 words, and no other scores, then this function returns `45`.
//
// Takes `O(|possible|)` time.
function maxPartitionSize(possible: Set, guess: Word): number {
    PARTITIONS.fill(0)
    let maxSize = 0

    for (let i = 0; i < possible.length; i++) {
        const solution = possible[i]!
        const score = check(solution, guess)
        PARTITIONS[score] ??= 0
        const partitionSize = ++PARTITIONS[score]!
        if (partitionSize > maxSize) maxSize = partitionSize
    }

    return maxSize
}

// Strategy which minimizes the resulting partition size.
//
// Takes `O(|possible|²)` time.
function stratMinimizePartitionSize(possible: Set): Word {
    let min = maxPartitionSize(possible, possible[0]!)
    let ret = possible[0]!

    for (let i = 1; i < possible.length; i++) {
        const guess = possible[i]!
        const size = maxPartitionSize(possible, guess)
        if (size < min) {
            min = size
            ret = guess
        }
    }

    return ret
}

// Statistic which counts how many guesses it takes to get every word. If a
// strategy takes more than `max` guesses, it is replaced with `Infinity`.
function statGuesses(possible: Set, strat: Strategy, max = 6): number[] {
    const ret: number[] = []

    for (const answer of possible) {
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

        ret.push(rounds)
    }

    return ret
}

console.time()
const guesses = statGuesses(SOLUTIONS, stratMinimizePartitionSize)
console.timeEnd()

console.log(
    Object.fromEntries(guesses.map((x, i) => [wordToString(SOLUTIONS[i]!), x])),
)
