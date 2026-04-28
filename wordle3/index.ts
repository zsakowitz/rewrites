import "../lib"
import { solutions } from "./data"
import {
    check,
    scoreAt,
    WORD_LENGTH,
    wordFromString,
    wordToString,
    type Score,
    type Word,
} from "./score"

// We use `Set` to refer to an inhabited (nonempty) array of words. They must not
// contain duplicates.
type Set = readonly Word[]

const SOLUTIONS: Set = solutions.map(wordFromString)

function partition(possible: Set, guess: Word): Map<Score, Set> {
    const partitions = new Map<Score, Word[]>()

    for (const solution of possible) {
        const score = check(solution, guess)
        if (partitions.has(score)) {
            partitions.get(score)!.push(solution)
        } else {
            partitions.set(score, [solution])
        }
    }

    return partitions
}

function partitionSorted(possible: Set, guess: Word): Map<Score, Set> {
    return new Map(
        Array.from(partition(possible, guess)).sort(
            (a, b) => a[1].length - b[1].length,
        ),
    )
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

const cv = document.createElement("canvas")
cv.style.imageRendering = "pixelated"
document.body.appendChild(cv)

const ctx = cv.getContext("2d", { alpha: false })!
const w = 2

function showPartitions(
    possible: Set,
    guess: Word,
    offset: number,
    height: number,
) {
    const partitions = partitionSorted(possible, guess)

    let y = 0

    for (const [score, words] of partitions) {
        const h = words.length * (height / possible.length)

        for (let i = 0; i < WORD_LENGTH; i++) {
            const x = offset + i * w
            ctx.fillStyle = ["#787C7E", "#C9B458", "#6AAA64"][
                scoreAt(score, i)
            ]!
            ctx.fillRect(x, y, w, h)
        }

        y += h
    }

    ctx.fillStyle = "black"
    ctx.fillText(
        "" + partitions.values().reduce((a, b) => a + b.length * b.length, 0),
        offset + (WORD_LENGTH / 2) * w,
        y + 8,
    )
}

function showPartitionsEach(sets: (readonly [possible: Set, guess: Word])[]) {
    cv.height = 800 + 80
    cv.width = w * (WORD_LENGTH + 1) * sets.length - w
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, cv.width, cv.height)
    ctx.font = "10px sans-serif"

    ctx.textAlign = "center"
    ctx.textBaseline = "top"

    for (let i = 0; i < sets.length; i++) {
        showPartitions(sets[i]![0], sets[i]![1], w * (WORD_LENGTH + 1) * i, 800)
    }
}

function best(possible: Set): Word {
    return possible.minBy((guess) =>
        partition(possible, guess)
            .v()
            .map((x) => x.length)
            .sumsq(),
    )
}

const partitions = partitionSorted(SOLUTIONS, wordFromString("crane"))

showPartitionsEach(
    SOLUTIONS.mapc((guess) => [SOLUTIONS, guess]).sortBy((k) =>
        partition(SOLUTIONS, k[1])
            .v()
            .map((x) => x.length)
            .sumsq(),
    ),
)

// console.time()
// console.log(
//     SOLUTIONS.mapc((guess) => [
//         wordToString(guess),
//         partition(SOLUTIONS, guess)
//             .v()
//             .map((x) => x.length)
//             .sumsq(),
//     ])
//         .sortBy((k) => k[1])
//         .map((x) => x.join(" ")),
// )
// console.timeEnd()
