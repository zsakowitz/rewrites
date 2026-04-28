import { solutions } from "./data"
import { check, wordFromString, wordToString, type Word } from "./score"

// We use `Set` to refer to an inhabited (nonempty) array of words. They must not
// contain duplicates.
type Set = readonly Word[]

const SOLUTIONS: Set = solutions.map(wordFromString)

// Uses `strat` to determine how many guesses the strategy takes for each
// possible answer. Logs each answer as its result is computed, so that you
// can see progress in real-time. Also outputs the estimated time to completion,
// in seconds, for each line.
function logGuessesPerWord(possible: Set, max = 6) {
    const start = performance.now()
    const firstGuess = strat(possible)
    console.log(
        `/* decided ${JSON.stringify(wordToString(firstGuess))} as first guess (${performance.now() - start}ms) */`,
    )

    const initial = performance.now()

    for (let i = 0; i < possible.length; i++) {
        const answer = possible[i]!

        let remaining = possible.filter(
            (x) => check(x, firstGuess) == check(answer, firstGuess),
        )
        const guesses: string[] = [wordToString(firstGuess)]

        while (remaining.length > 1 && guesses.length < max) {
            const guess = strat(remaining)
            guesses.push(wordToString(guess))
            const score = check(answer, guess)

            remaining = remaining.filter(
                (solution) => check(solution, guess) === score,
            )
        }

        if (remaining.length > 1) {
            guesses.push("...")
        }

        const estLeft = Math.round(
            ((performance.now() - initial)
                * ((possible.length - i) / Math.max(1, i)))
                / 1000,
        )
            .toString()
            .padStart(4, "0")

        console.log(
            `/* ${estLeft} */ ${wordToString(answer)}: ${JSON.stringify(guesses.join(" "))},`,
        )
    }
}

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
