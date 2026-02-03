import { all, answers } from "./wordle2.data"

export type Arr<T> = readonly [T, T, T, T, T]
export type ArrMut<T> = [T, T, T, T, T]

export type Word = Arr<string>
export type Mark = 0 | 1 | 2
export type Marks = number

export type WordList = readonly number[]

const marks = (() => {
    function marks(correctRaw: Word, guessedRaw: Word): Marks {
        const correct: ArrMut<string | null> = correctRaw.slice() as any
        const guessed: ArrMut<string | null> = guessedRaw.slice() as any
        const score: ArrMut<Mark> = [0, 0, 0, 0, 0]

        for (let i = 0; i < 5; i++) {
            if (correct[i] == guessed[i]) {
                score[i] = 2
                guessed[i] = null
                correct[i] = null
            }
        }

        for (let i = 0; i < 5; i++) {
            const c = guessed[i]
            if (c == null) continue

            const j = correct.indexOf(c)
            if (j == -1) continue

            correct[j] = null
            score[i] = 1
        }

        return score.reduceRight<number>((a, b) => 3 * a + b, 0)
    }

    const map: Marks[] = []
    for (const [i, correct] of answers.entries()) {
        for (const [j, guess] of answers.entries()) {
            map[answers.length * i + j] = marks(correct, guess)
        }
    }

    return (correct: number, guessed: number) =>
        map[answers.length * correct + guessed]
})()

export function play(possible: WordList, correct: number): number {
    return possible
        .map((guess) => {
            const score = marks(correct, guess)
            const words = possible.filter((word) => marks(word, guess) == score)
            return [guess, words.length] as const
        })
        .reduce((a, b) => (a[1] < b[1] ? a : b))[0]
}

export function length(
    possible: WordList,
    correct: number,
    guess = play(possible, correct),
): number {
    if (possible.length == 1) {
        return 1
    }
    const score = marks(correct, guess)
    const words = possible.filter((word) => marks(word, guess) == score)
    return 1 + length(words, correct)
}

export function findBest(possible: WordList) {
    console.time("default")
    return possible
        .map((guess, i) => {
            console.timeLog("default", i)
            return [
                guess,
                possible
                    .map((correct) => length(possible, correct, guess))
                    .reduce((a, b) => (a > b ? a : b)),
            ] as const
        })
        .reduce((a, b) => (a[1] < b[1] ? a : b))[0]
}

export { all, answers }
