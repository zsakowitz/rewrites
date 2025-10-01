export function* limitSeq(x0: number, x1: number, first: number) {
  let base = 1
  for (let i = 0; i < 100; i++) {
    yield x0 + (x1 - x0) * base
    base *= 1 - first
  }
}

export function* diffSeq(x0: number, x1: number, first: number) {
  let last = x1
  let base = 1
  for (let i = 0; i < 1000; i++) {
    base *= 1 - first
    yield last - (x0 + (x1 - x0) * base)
    last = x0 + (x1 - x0) * base
  }
}
