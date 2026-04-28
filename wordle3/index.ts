import { solutions } from "./data"
import { check, wordFromString, type Word } from "./score"

// We use `Set` to refer to an inhabited (nonempty) array of words. They must not
// contain duplicates.
type Set = readonly Word[]

const SOLUTIONS: Set = solutions.map(wordFromString)

function partition(possible: Set, guess: Word): Record<number, Set> {
    const partitions: Record<number, Word[]> = Object.create(null)

    for (const solution of possible) {
        ;(partitions[check(solution, guess)] ??= []).push(solution)
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
