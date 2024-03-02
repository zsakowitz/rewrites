export function probs(text: string) {
  const counts: Record<string, Record<string, number>> = {}

  for (let index = 0; index < text.length - 1; index++) {
    const object = (counts[text[index]!] ??= {})
    object[text[index + 1]!] = (object[text[index + 1]!] || 0) + 1
  }

  return Object.fromEntries(
    Object.entries(counts).map(([key, value]) => {
      const total = Object.values(value).reduce((a, b) => a + b, 0)
      return [
        key,
        Object.fromEntries(
          Object.entries(value).map(([key, value]) => [key, value / total]),
        ),
      ] as const
    }),
  )
}

export function xor(a: string, b: string) {
  return a
    .split("")
    .map((a, i) => +a ^ +b[i]!)
    .join("")
}

export function rotodromes(words: readonly string[], n: number) {
  return words
    .filter((x) => x.length >= n)
    .map((word) =>
      word
        .split("")
        .map((_, index) => word[(index + n) % word.length])
        .join(""),
    )
    .filter((x) => words.includes(x))
}
