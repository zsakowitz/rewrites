import { shuffle } from "../shuffle"
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

function bestGuessFor(possible: Set): [guess: Word, maxDepth: number] {
    if (possible.length == 1) {
        return [possible[0]!, 0]
    }

    let minGuess = possible[0]!
    let minMaxDepth = Infinity

    for (const guess of possible) {
        let maxDepth = 0

        for (const solution of possible) {
            const score = check(solution, guess)
            const remaining = possible.filter((x) => check(x, guess) == score)

            // redundant guess; don't check it
            if (remaining.length == possible.length) continue

            const depth = 1 + Math.max(bestGuessFor(remaining)[1])
            if (depth > maxDepth) maxDepth = depth
            if (maxDepth >= minMaxDepth) break
        }

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

let ret = ""
for (let i = 0; i < 200; i++) {
    const now = performance.now()
    strat(shuffle(SOLUTIONS).slice(0, i))
    ret += `(${i},${performance.now() - now}),`
}

console.write(ret.slice(0, -1))
