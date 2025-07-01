class Eq {
  constructor(readonly lhs: Set<string> = new Set(), public rhs: 0 | 1 = 0) {}

  addFrom(other: Eq) {
    for (const lhs of other.lhs) {
      if (this.lhs.has(lhs)) {
        this.lhs.delete(lhs)
      } else {
        this.lhs.add(lhs)
      }
    }

    this.rhs = this.rhs == other.rhs ? 0 : 1
  }

  plainRhs() {
    return this.lhs.size ? null : this.rhs
  }

  multi() {
    return this.lhs.size >= 2
  }
}

class Sys {
  readonly eqs: Eq[] = []
  public unsolvable = false

  add(lhs: string, rhs: 0 | 1) {
    this.eqs.push(new Eq(new Set(lhs.split("")), rhs))
  }

  isDone() {
    let isEverythingOnlyOneVariable = true
    for (let i = 0; i < this.eqs.length; i++) {
      const pr = this.eqs[i]!.plainRhs()
      if (pr === 0) {
        this.eqs.splice(i, 1)
        i--
        continue
      }
      if (pr === 1) {
        this.unsolvable = true
        return true
      }
      if (this.eqs[i]!.lhs.size != 1) {
        isEverythingOnlyOneVariable = false
      }
    }
    return isEverythingOnlyOneVariable
  }
}

const s = new Sys()
s.add("xy", 1)
s.add("xyz", 1)
s.add("yz", 0)
