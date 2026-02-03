// Everything is strings of characters to avoid Unicode weirdness.

// To check for matches, we need to draft an algorithm for scoring.
//
// An initial easy check is "do we have all green letters correct". If any
// greens are incorrect, then the word doesn't match. Simple.
//
// The harder check is "do we have the right letters". For this one, we
// remember our scoring patterns:
// - "none" means "exactly 0"
// - "green" means "at least 1"
// - "yellow" means "at least 1"
// - "yellow none" means "exactly 1"
//
// To make this more algorithmic, we can remember these easy patterns:
// - if we see a yellow or green letter, we must have it somewhere
// - if we see a grey letter, it places a cap on how many letters we have
//
// One yellow means we have at least one of that letter, and one yellow and
// a none means we have exactly one. Simple.

export type ScoreMark = "partial" | "correct" | undefined

export class Score {
    static of(correct: Word, guess: Word): Score {
        const cc = correct.word.slice() as (string | undefined)[]
        const ogc = guess.word.slice()
        const gc = ogc.slice() as (string | undefined)[]

        if (cc.length != gc.length) {
            throw new Error("Both words must be the same length.")
        }

        const marks: ScoreMark[] = Array.from({ length: gc.length })

        for (let i = 0; i < gc.length; i++) {
            // This will never run `undefined == undefined` since the undefined values
            // only appear after the `for` loop is run to completion.
            if (gc[i] == cc[i]) {
                marks[i] = "correct"

                // Stops characters in the solution from being used twice
                cc[i] = undefined

                // Stops correctly guessed characters from being marked as partials
                gc[i] = undefined
            }
        }

        for (let i = 0; i < gc.length; i++) {
            const guess = gc[i]

            // Filter out values which we already marked as correct
            if (guess == null) continue

            const ccIndex = cc.indexOf(guess)
            if (ccIndex == -1) continue

            marks[i] = "partial"

            // Stops characters in the solution from being used twice
            cc[i] = undefined
        }

        return new Score(marks, guess)
    }

    readonly hits: { readonly [char: string]: number }
    readonly misses: { readonly [char: string]: true }

    constructor(
        readonly marks: readonly ScoreMark[],
        readonly guess: Word,
    ) {
        if (marks.length != guess.word.length) {
            throw new Error("`marks` and `guess` arrays must have same length.")
        }

        Object.freeze(marks)
        Object.freeze(guess)

        const hits: Record<string, number> = (this.hits = Object.create(null))
        const misses: Record<string, true> = (this.misses = Object.create(null))

        for (let i = 0; i < guess.word.length; i++) {
            const mark = marks[i]!
            const char = guess.word[i]!

            // If grey, note that we missed it. This means we have an exact value.
            if (mark == null) {
                misses[char] = true
            }

            // Otherwise, note that we hit it.
            else if (char in hits) {
                hits[char]++
            } else {
                hits[char] = 1
            }
        }

        Object.freeze(hits)
        Object.freeze(misses)
        Object.freeze(this)
    }
}

export class Word {
    static of(word: string): Word {
        return new Word(Array.from(word))
    }

    readonly chars: { readonly [char: string]: number }

    constructor(readonly word: readonly string[]) {
        Object.freeze(word)

        const chars: Record<string, number> = (this.chars = Object.create(null))
        for (let i = 0; i < word.length; i++) {
            const char = word[i]!

            if (char in chars) {
                chars[char]++
            } else {
                chars[char] = 1
            }
        }

        Object.freeze(chars)
        Object.freeze(this)
    }

    matches(score: Score): boolean {
        for (let i = 0; i < score.guess.word.length; i++) {
            if (
                score.marks[i] == "correct"
                && this.word[i] !== score.guess.word[i]
            ) {
                return false
            }
        }

        const { hits, misses } = score
        const { chars } = this

        for (const key in hits) {
            if ((chars[key] || 0) < hits[key]!) {
                return false
            }
        }

        for (const key in misses) {
            if ((chars[key] || 0) != (hits[key] || 0)) {
                return false
            }
        }

        return true
    }

    equals(other: Word): boolean {
        return (
            this.word.length == other.word.length
            && this.word.every((a, i) => other.word[i] === a)
        )
    }

    toString() {
        return this.word.join("")
    }
}

export class WordList {
    constructor(readonly words: readonly Word[]) {}

    includes(word: Word) {
        return this.words.some((a) => a.equals(word))
    }

    matchesWord(guess: Word) {
        return new WordList(
            this.words.filter((word) => word.matches(Score.of(word, guess))),
        )
    }

    matchesScore(score: Score) {
        return new WordList(
            this.words.filter((x) => {
                const my = Score.of(x, score.guess)
                return my.marks.join(",") == score.marks.join(",")
            }),
        )
    }

    toString() {
        return this.words.join(", ")
    }

    filter(
        predicate: (word: Word, index: number, array: WordList) => unknown,
    ): WordList {
        const p = (word: Word, index: number) => predicate(word, index, this)
        return new WordList(this.words.filter(p))
    }

    best() {
        return this.words
            .map((guess) => {
                const filtered = this.matchesWord(guess)
                return [guess, filtered.words.length] as const
            })
            .reduce((a, b) => (a[1] <= b[1] ? a : b))
    }

    bestSingleLayerGuesses() {
        return this.words
            .map((guess) => {
                const filtered = this.matchesWord(guess)
                return [
                    guess,
                    filtered.words.length,
                    filtered.toString(),
                ] as const
            })
            .sort(([, a], [, b]) => a - b)
    }

    best2() {
        return this.words
            .flatMap((guess1) => {
                const f1 = this.matchesWord(guess1)
                return f1.words.map((guess2) => {
                    const f2 = f1.matchesWord(guess2)
                    return {
                        guess1,
                        guess2,
                        size: f2.words.length,
                        words: f2.toString(),
                    }
                })
            })
            .reduce((a, b) => (a.size <= b.size ? a : b))
    }

    bestSecondLayerGuesses() {
        return this.words
            .flatMap((guess1) => {
                const f1 = this.matchesWord(guess1)
                return f1.words.map((guess2) => {
                    const f2 = f1.matchesWord(guess2)
                    return {
                        guess1,
                        guess2,
                        size: f2.words.length,
                        words: f2.toString(),
                    }
                })
            })
            .sort((a, b) => a.size - b.size)
    }

    best4() {
        return this.words
            .flatMap((guess1) => {
                const f1 = this.matchesWord(guess1)
                return f1.words
                    .filter((guess2) => guess2 >= guess1)
                    .map((guess2) => {
                        const f2 = f1.matchesWord(guess2)
                        return {
                            guess1,
                            guess2,
                            f2,
                            size: f2.words.length,
                        }
                    })
            })
            .sort((a, b) => a.size - b.size)
            .slice(0, 100)
            .flatMap(({ guess1, guess2, f2 }) => {
                return f2.words
                    .filter((guess3) => guess3 >= guess2)
                    .map((guess3) => {
                        const f3 = f2.matchesWord(guess3)
                        return {
                            guess1,
                            guess2,
                            guess3,
                            size: f3.words.length,
                            f3,
                        }
                    })
            })
            .sort((a, b) => a.size - b.size)
            .slice(0, 100)
            .flatMap(({ guess1, guess2, guess3, f3 }) => {
                return f3.words
                    .filter((guess4) => guess4 >= guess3)
                    .map((guess4) => {
                        const f4 = f3.matchesWord(guess4)
                        return {
                            guess1,
                            guess2,
                            guess3,
                            guess4,
                            size: f4.words.length,
                        }
                    })
            })
            .reduce((a, b) => (a.size < b.size ? a : b))
    }

    bestThirdLayerGuesses() {
        return this.words
            .flatMap((guess1) => {
                const f1 = this.matchesWord(guess1)
                return f1.words
                    .filter((guess2) => guess2 >= guess1)
                    .map((guess2) => {
                        const f2 = f1.matchesWord(guess2)
                        return {
                            guess1,
                            guess2,
                            f2,
                            size: f2.words.length,
                            words: f2.toString(),
                        }
                    })
            })
            .sort((a, b) => a.size - b.size)
            .flatMap(({ guess1, guess2, f2 }) => {
                return f2.words
                    .filter((guess3) => guess3 >= guess2)
                    .map((guess3) => {
                        const f3 = f2.matchesWord(guess3)
                        return {
                            guess1: guess1.toString(),
                            guess2: guess2.toString(),
                            guess3: guess3.toString(),
                            size: f3.words.length,
                            words: f3.toString(),
                        }
                    })
            })
            .sort((a, b) => a.size - b.size)
    }

    simulateAll(initial: Word) {
        let allOk = true
        const all: [string, number][] = []

        for (const correct of this.words) {
            const { attempts, log, ok } = simulate(correct, this, initial)
            all.push([correct.toString(), attempts])

            if (ok) {
                console.groupCollapsed(
                    `Guessed "${correct}" in ${attempts} tries.`,
                )
                for (const phrase of log) {
                    console.log(phrase)
                }
                console.groupEnd()
            } else {
                allOk = false
                console.groupCollapsed(`Failed to guess "${correct}".`)
                for (const phrase of log) {
                    console.log(phrase)
                }
                console.groupEnd()
            }
        }

        return {
            word: initial.toString(),
            max: all.reduce((a, b) => (a > b[1] ? a : b[1]), -Infinity),
            avg: +(all.reduce((a, [, b]) => a + b, 0) / all.length).toPrecision(
                5,
            ),
            ok: allOk,
            data: all,
        }
    }

    simulateAllWithAllInitials() {
        const { log, group, groupEnd } = console
        console.log = () => {}
        console.group = log
        console.groupEnd = () => {}
        const data = this.words
            .map((word) => this.simulateAll(word))
            .sort((a, b) => a.avg - b.avg)
        Object.assign(console, { log, group, groupEnd })
        return data
    }

    tsv() {
        const data = this.simulateAllWithAllInitials()
        return data.map(
            (initial) =>
                initial.word + "\t" + initial.data.map((x) => x[1]).join("\t"),
        )
    }
}

export const all = new WordList(
    "anpa ante awen esun insa jaki jelo kala kama kasi kili kule kute lape laso lawa leko lete lili lipu loje luka lupa mama mani meli meso mije moku moli musi mute nasa nena nimi noka olin open pali pana pini pipi poka poki pona sama seli selo seme sewi sike sina soko sona suli suno supa suwi taso tawa telo toki tomo unpa walo waso wawa weka wile"
        .split(" ")
        .map((word) => Word.of(word)),
)

export function simulate(correct: Word, list: WordList, initial: Word) {
    if (!list.includes(correct)) {
        throw new Error("Correct word is not in allowed word list.")
    }

    if (!list.includes(initial)) {
        throw new Error("Initial guess is not in allowed word list.")
    }

    let i: Word | undefined = initial

    const log: string[] = []
    let attempts = 0

    log.push(`Starting with ${list.words.length} words...`)

    while (list.words.length > 1) {
        const guess =
            i
            || (() => {
                const b = list.best4()
                return (
                    [
                        [b.guess1, list.matchesWord(b.guess1)],
                        [b.guess2, list.matchesWord(b.guess2)],
                        [b.guess3, list.matchesWord(b.guess3)],
                        [b.guess4, list.matchesWord(b.guess4)],
                    ] as const
                ).reduce((a, b) =>
                    a[1].words.length < b[1].words.length ? a : b,
                )[0]
            })()
        i = undefined
        const score = Score.of(correct, guess)
        list = list.matchesScore(score)
        log.push(`Guessed "${guess}". ${list.words.length} words left.`)
        attempts += 1
    }

    if (list.words.length == 0) {
        log.push("Word list is empty.")
        return { log, ok: false, attempts }
    }

    const final = list.words[0]!

    if (!final.equals(correct)) {
        log.push(
            `"${final}" is the only remaining option, but it is incorrect.`,
        )
        return { log, ok: false, attempts }
    }

    log.push(`"${final}" is the only remaining option.`)
    log.push("Done.")
    return { log, ok: true, attempts }
}
