import { all, answers } from "./wordle2.data"

export type Arr<T> = readonly [T, T, T, T, T]
export type ArrMut<T> = [T, T, T, T, T]

export type Word = Arr<string>
export type Mark = 0 | 1 | 2
export type Marks = number

export type WordList = readonly Word[]

const markCache = new Map<Word, Map<Word, Marks>>()

export function marks(correctRaw: Word, guessedRaw: Word): Marks {
  let cache = markCache.get(correctRaw)
  if (cache?.has(guessedRaw)) {
    return cache.get(guessedRaw)!
  } else if (!cache) {
    cache = new Map()
    markCache.set(correctRaw, cache)
  }

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

  const value = score.reduceRight<number>((a, b) => 3 * a + b, 0)
  cache.set(guessedRaw, value)
  return value
}

export namespace marks {
  export function expand(marks: Marks): ArrMut<Mark> {
    return [
      marks % 3,
      (marks = Math.floor(marks / 3)) % 3,
      (marks = Math.floor(marks / 3)) % 3,
      (marks = Math.floor(marks / 3)) % 3,
      (marks = Math.floor(marks / 3)) % 3,
    ] as any
  }

  export function write(marks: Marks): string {
    return expand(marks)
      .map((x) => (x == 0 ? "❌" : x == 1 ? "⚠️" : "✅"))
      .join("")
  }
}

export function play(possible: WordList, correct: Word): Word {
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
  correct: Word,
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

// export function tryEach(possible: WordList) {
//   return new Map(possible.map((word) => [word, ]))
// }

// export function go(
//   possible: WordList,
//   correct: Word,
//   attempts: number,
// ): number[] {
//   if (possible.length == 0) {
//     throw new Error("Invalid state reached.")
//   }
//
//   if (possible.length == 1) {
//     return [0]
//   }
//
//   const ret: number[] = []
//
//   for (const guess of possible) {
//     const next = filter(correct, guess, possible)
//     ret.push(...go(next, correct, attempts - 1))
//   }
//
//   return ret
// }
//
// export function filter(correctRaw: Word, guessedRaw: Word, list: WordList) {
//   const marks = score(correctRaw, guessedRaw)
//   return list.filter((x) => score(correctRaw, x) == marks)
// }

export { all, answers }
