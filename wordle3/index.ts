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

function min1(possible: Set): readonly [Word, number] {
    return possible
        .map(
            (guess) =>
                [
                    guess,
                    sqsum(partition(possible, guess).map((x) => x.length)),
                ] as const,
        )
        .reduce((a, b) => (a[1] < b[1] ? a : b))
}

function min2(possible: Set): readonly [Word, number] {
    return possible
        .map(
            (guess) =>
                [
                    guess,
                    partition(possible, guess)
                        .map((p) => min1(p))
                        .reduce((a, b) => (a[1] > b[1] ? a : b))[1],
                ] as const,
        )
        .reduce((a, b) => (a[1] < b[1] ? a : b))
}

function strat(possible: Set): Word {
    return min2(possible)[0]
}

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
    const sorted = guesses.toSorted((a, b) => a - b)

    const avg = guesses.reduce((a, b) => a + b, 0) / guesses.length
    const max = guesses.reduce((a, b) => Math.max(a, b), 0)

    console.log({
        avg,
        p25: sorted[Math.floor(sorted.length / 4)],
        p50: sorted[Math.floor(sorted.length / 2)],
        p75: sorted[Math.floor(sorted.length * 0.75)],
        max,
        tooLong: guesses
            .map((x, i) => [x, i] as const)
            .filter((x) => x[0] == 99)
            .map((x) => wordToString(possible[x[1]]!)),
    })
}

// const parts = partition(SOLUTIONS, strat(SOLUTIONS))
//
// console.log(parts.map((x) => x.length).sort((a, b) => a - b))

console.time()
console.log(strat(SOLUTIONS))
console.timeEnd()
