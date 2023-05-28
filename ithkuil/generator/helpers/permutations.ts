// https://stackoverflow.com/a/37580979/17763661
export function allPermutationsOf<T>(array: readonly [T, ...T[]]): [T, ...T[]][]
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
