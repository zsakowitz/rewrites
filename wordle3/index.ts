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
import { check, wordFromString, wordToString, type Word } from "./score"

// We use `Set` to refer to an inhabited (nonempty) array of words. They must not
// contain duplicates.
type Set = readonly Word[]

const SOLUTIONS: Set = solutions.map(wordFromString)

const now = Date.now()

SOLUTIONS.forEach((guess1, i) => {
    const works = SOLUTIONS.every((answer) => {
        const score1 = check(answer, guess1)
        const works1 = SOLUTIONS.filter((word) => check(word, guess1) == score1)
        return (
            works1.some((guess2) => {
                const score2 = check(answer, guess2)
                return (
                    works1.filter((word) => check(word, guess2) == score2)
                        .length <= 1
                )
            })
            || SOLUTIONS.some((guess2) => {
                if (works1.includes(guess2)) return false
                const score2 = check(answer, guess2)
                return (
                    works1.filter((word) => check(word, guess2) == score2)
                        .length <= 1
                )
            })
        )
    })

    const elapsed = Date.now() - now
    console.log(
        `${wordToString(guess1)} ${works ? "Y" : "N"} ${elapsed} ${(elapsed / (i + 1)) * (SOLUTIONS.length - (i + 1))}`,
    )
})
