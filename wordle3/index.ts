import { shuffle } from "../shuffle"
import { solutions } from "./data"
import { check, wordFromString, wordToString, type Word } from "./score"

// We use `Set` to refer to an inhabited (nonempty) array of words. They must not
// contain duplicates.
type Set = readonly Word[]

const SOLUTIONS: Set = shuffle(solutions).map(wordFromString)

// Uses `strat` to determine how many guesses the strategy takes for each
// possible answer. Logs each answer as its result is computed, so that you
// can see progress in real-time. Also outputs the estimated time to completion,
// in seconds, for each line.
function logGuessesPerWord(possible: Set, max = 6) {
    const start = Date.now()
    const firstGuess = strat(possible)
    console.log(
        `/* decided ${JSON.stringify(wordToString(firstGuess))} as first guess (${Date.now() - start}ms) */`,
    )

    const initial = Date.now()

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
            ((Date.now() - initial) * ((possible.length - i) / Math.max(1, i)))
                / 1000,
        )
            .toString()
            .padStart(4, "0")

        console.log(
            `/* ${estLeft} */ ${wordToString(answer)}: ${JSON.stringify(guesses.join(" "))},`,
        )
    }
}

function bestGuessFor(possible: Set): [guess: Word, maxDepth: number] {
    if (possible.length == 1) {
        return [possible[0]!, 0]
    }

    let minGuess = possible[0]!
    let minMaxDepth = Infinity

    for (const guess of possible) {
        const maxDepth = possible
            .map((solution): number => {
                const score = check(solution, guess)
                const remaining = possible.filter(
                    (x) => check(x, guess) == score,
                )
                if (remaining.length == possible.length) {
                    return 0
                }
                return 1 + bestGuessFor(remaining)[1]
            })
            .reduce((a, b) => Math.max(a, b), 0)

        if (maxDepth < minMaxDepth) {
            minGuess = guess
            minMaxDepth = maxDepth
        }
    }

    return [minGuess, minMaxDepth]
}

function strat(possible: Set): Word {
    return bestGuessFor(possible)[0]
}

// while (true) {
// const n = Math.random() * 120 + 10 + ""
// console.time(n)
// logGuessesPerWord(SOLUTIONS.slice(0, +n))
// console.timeEnd(n)
// }

// (20,12),(50,370),(70,3090),(70,2190),(70,1067),(100,18340),(100,13110),(100,13390),(20,7),(20,7),(20,7),(50,239),(50,118),(120,36240),(125,32140),(95,19630),(118,87700),(66,1159),(25,4),(55,253),(67,1299),(13,0),(38,32),(60,499),(13,0),(92,21160),(123,139180),(56,329),(80,13640),(73,2880),(15,0),(97,28060),(122,119040),(29,10)

console.time()
logGuessesPerWord(SOLUTIONS.slice(0, 30))
console.timeEnd()
