// Utility function that shuffles an array.

export function shuffle<T>(array: readonly T[]): T[] {
  const output = array.slice()
  let currentIndex = output.length
  let randomIndex, temp

  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--

    temp = output[currentIndex]!
    output[currentIndex] = output[randomIndex]!
    output[randomIndex] = temp
  }

  return output
}
