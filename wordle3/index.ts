// We write our problem in terms of dependent type theory.
//
// Let `Word` be the type of words.
//
// Let `Score` be the type of scores.
//
// Let `S : List Word` be the list of all possible words.
//
// Let `check : (guess : Word) -> (answer : Word) -> Score` return the score
// when the first word is a guess and the second word is the correct option.
//
// Let `filter : (possible : List Word) -> (guess : Word) -> (answer : Word)
// -> List Word` return the largest subset of `possible` where

import "../lib"
import { solutions } from "./data"
import {
    check,
    wordFromString,
    wordToString,
    type Score,
    type Word,
} from "./score"

// We use `Set` to refer to an inhabited (nonempty) array of words. They must not
// contain duplicates.
type Set = readonly Word[]

const SOLUTIONS: Set = solutions.map(wordFromString)

function test(guess1: Word): Word[] | null {
    const works = SOLUTIONS.map((answer) => {
        const score1 = check(answer, guess1)
        const works1 = SOLUTIONS.filter((word) => check(word, guess1) == score1)

        return works1.find((guess2) => {
            const score2 = check(answer, guess2)

            let total = 0
            for (let i = 0; i < works1.length; i++) {
                if (check(works1[i]!, guess2) == score2) {
                    total++
                    if (total == 2) return false
                }
            }

            return true
        })
    })

    if (!works.every((x) => x != null)) {
        return null
    }

    return works
}

function findGuess2(guess1: Word, score1: Score): Word | null {
    const possible = SOLUTIONS.filter(
        (answer) => check(answer, guess1) == score1,
    )

    return (
        possible.find((guess2) =>
            possible.every((answer) => {
                const score2 = check(answer, guess2)

                let total = 0
                for (const answer of possible) {
                    if (check(answer, guess2) == score2) {
                        total++
                        if (total == 2) return false
                    }
                }

                return true
            }),
        ) ?? null
    )
}

const now = Date.now()

SOLUTIONS.forEach((guess1, i) => {
    const scores = new Set(SOLUTIONS.map((answer) => check(answer, guess1)))
    const works = scores.values().every((score1) => findGuess2(guess1, score1))

    console.log(
        `${wordToString(guess1)} ${works ? "Y" : "N"} ${
            ((Date.now() - now) / (i + 1)) * (SOLUTIONS.length - (i + 1))
        }`,
    )
})
