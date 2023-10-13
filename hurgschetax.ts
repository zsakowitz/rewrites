// https://stackoverflow.com/a/37580979/17763661

/**
 * Calculates all possible permutations of an input array.
 * @param array The array to calculate permutations of.
 * @returns An array containing all possible permutations of the input array.
 */
export function allPermutationsOf<T>(array: readonly [T, ...T[]]): [T, ...T[]][]

/**
 * Calculates all possible permutations of an input array.
 * @param array The array to calculate permutations of.
 * @returns An array containing all possible permutations of the input array.
 */
export function allPermutationsOf<T>(array: readonly T[]): T[][]

export function allPermutationsOf<T>(array: readonly T[]): T[][] {
  const permutation = array.slice()

  const length = permutation.length
  const result = [permutation.slice()]
  const c = new Array(length).fill(0)
  let i = 1
  let k, p

  while (i < length) {
    if (c[i] < i) {
      k = i % 2 && c[i]
      p = permutation[i]!
      permutation[i] = permutation[k]!
      permutation[k] = p
      ++c[i]
      i = 1
      result.push(permutation.slice())
    } else {
      c[i] = 0
      ++i
    }
  }

  return result
}

export function attempt(words: string[]): string {
  // 1. Turn the list of words into a list of the characters used.
  const letters = words
    .join("")
    .split("")
    .filter((x, i, a) => a.indexOf(x) == i)
    .sort()

  // 2. Find every possible combination of letters. Then, for each one...
  guessPermutation: for (const guess of allPermutationsOf(letters)) {
    // 2a. Check each word against the proposed alphabet by...
    checkWord: for (const word of words) {
      // 2ai. Walk through the alphabet and match each character of the alphabet
      //    to a character in the word we're checking against.
      let charIndex = 0

      character: for (const char of guess) {
        // 2ai1. If we looked through this entire word, check the next word.
        if (charIndex >= word.length) {
          continue checkWord
        }
        // 2ai2. If a character from the alphabet matches a letter in the word,
        //    check the next character.
        if (char == word[charIndex]) {
          charIndex++
          continue character
        }
      }
      // 2aii. If we looked through this entire word, check the next word.
      if (charIndex >= word.length) {
        continue checkWord
      }
      // 2aiii. If we're in the middle of the word, we failed. Check the next
      //      possible alphabet.
      continue guessPermutation
    }

    // 2b. If we got here, it means we checked every word and they all work.
    //    Return this alphabet.
    return guess.join("")
  }

  // 3. We failed to find an alphabet, so throw an error.
  throw new Error("Inconsistent input.")
}
