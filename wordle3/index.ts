import { solutions } from "./data"
import { check, wordFromString, wordToString, type Word } from "./score"

// We use `Set` to refer to an inhabited (nonempty) array of words. They must not
// contain duplicates.
type Set = readonly Word[]

const SOLUTIONS: Set = solutions.map(wordFromString)

function partition(possible: Set, guess: Word): Set[] {
    const partitions: Record<number, Word[]> = Object.create(null)

    for (const solution of possible) {
        ;(partitions[check(solution, guess)] ??= []).push(solution)
    }

    return Object.values(partitions)
}

function sqsum(x: number[]): number {
    return x.reduce((a, b) => a + b * b, 0)
}

function min1(possible: Set): Word {
    return possible
        .map(
            (guess) =>
                [
                    guess,
                    sqsum(partition(possible, guess).map((x) => x.length)),
                ] as const,
        )
        .reduce((a, b) => (a[1] < b[1] ? a : b))[0]
}

function strat(possible: Set): Word {
    return min1(possible)
}

const sols = SOLUTIONS.map(
    (guess) =>
        [
            guess,
            sqsum(partition(SOLUTIONS, guess).map((x) => x.length)),
        ] as const,
).sort((a, b) => a[1] - b[1] || +(b[0] < a[0]))

const min = sols[0]![1]
const max = sols[sols.length - 1]![1] + 1

sols.forEach((x) =>
    console.log(
        wordToString(x[0])
            + " "
            + (Math.floor(((x[1] - min) / (max - min)) * 10000) / 100)
                .toFixed(2)
                .padStart(5, "0"),
    ),
)

function filter(possible: Set, answer: Word, guess: Word): Set {
    const ret: Word[] = []
    const score = check(answer, guess)

    for (let i = 0; i < possible.length; i++) {
        const el = possible[i]!
        if (check(el, guess) === score) {
            ret.push(el)
        }
    }

    return ret
}

const MAX_GUESSES = 6

function guessesPerWord(possible: Set, initialGuess: Word): number[] {
    return possible.map((answer): number => {
        let rounds = 1
        let remaining = filter(possible, answer, initialGuess)

        while (remaining.length > 1 && rounds < MAX_GUESSES) {
            remaining = filter(remaining, answer, strat(remaining))
            rounds++
        }

        if (remaining.length > 1) {
            return 99
        }

        return rounds
    })
}

function logStats(possible: Set, initialGuess: Word) {
    const guesses = guessesPerWord(possible, initialGuess)
    guesses.sort((a, b) => a - b)

    const avg = guesses.reduce((a, b) => a + b, 0) / guesses.length
    const max = guesses.reduce((a, b) => Math.max(a, b), 0)
    const med = guesses[Math.floor(guesses.length / 2)]

    console.log({ avg, max, med })
}
