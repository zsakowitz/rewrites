import { Num } from "."

function reduceDominated(self: Num) {
  const { lhs, rhs } = self
  let changed = false

  outer: for (let i = 0; i < lhs.length; i++) {
    inner: for (let j = 0; j < lhs.length; j++) {
      if (i == j) continue
      const A = lhs[i]!
      const B = lhs[j]!
      if (B.ge(A)) {
        lhs.splice(i, 1)
        changed = true
        i--
        continue outer
      }
      if (A.ge(B)) {
        lhs.splice(j, 1)
        changed = true
        j--
        continue inner
      }
    }
  }

  outer: for (let i = 0; i < rhs.length; i++) {
    inner: for (let j = 0; j < rhs.length; j++) {
      if (i == j) continue
      const A = lhs[i]!
      const B = rhs[j]!
      if (B.le(A)) {
        rhs.splice(i, 1)
        changed = true
        i--
        continue outer
      }
      if (A.le(B)) {
        rhs.splice(j, 1)
        changed = true
        j--
        continue inner
      }
    }
  }

  return changed
}

function reduceReversible(self: Num) {
  const { lhs, rhs } = self
  let changed = false

  outer: for (let i = 0; i < lhs.length; i++) {
    const A = lhs[i]!

    for (let j = 0; j < A.rhs.length; j++) {
      const B = A.rhs[j]!

      if (self.ge(B)) {
        lhs.splice(i, 1, ...B.lhs)
        changed = true
        i--
        continue outer
      }
    }
  }

  outer: for (let i = 0; i < rhs.length; i++) {
    const A = rhs[i]!

    for (let j = 0; j < A.lhs.length; j++) {
      const B = A.lhs[j]!

      if (self.le(B)) {
        rhs.splice(i, 1, ...B.rhs)
        changed = true
        i--
        continue outer
      }
    }
  }

  return changed
}

export function reduce(self: Num) {
  while (true) {
    if (!(reduceDominated(self) || reduceReversible(self))) {
      break
    }
  }
}
