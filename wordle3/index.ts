import "../lib"
import { solutions } from "./data"
import { check, wordFromString, type Score, type Word } from "./score"

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
