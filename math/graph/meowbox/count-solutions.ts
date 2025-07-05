export function countByEvenOdd(rows: Uint8Array[], size: number) {
  let total = 0

  if (rows.length >= 1) {
    for (let i = 0; i < rows.length; i++) {
      total += ways(rows[i]!)
    }
  }

  if (rows.length >= 2) {
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        total -= ways(add(rows[i]!, rows[j]!))
      }
    }
  }

  if (rows.length >= 3) {
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        for (let k = j + 1; k < rows.length; k++) {
          total += ways(add(add(rows[i]!, rows[j]!), rows[k]!))
        }
      }
    }
  }

  if (rows.length >= 4) {
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        for (let k = j + 1; k < rows.length; k++) {
          for (let l = k + 1; l < rows.length; l++) {
            total -= ways(add(add(add(rows[i]!, rows[j]!), rows[k]!), rows[l]!))
          }
        }
      }
    }
  }

  if (rows.length >= 5) {
    throw new Error("Too many rows.")
  }

  return total

  function count(row: Uint8Array) {
    let total = 0
    for (let i = 0; i < size; i++) {
      total += row[i]!
    }
    return total
  }

  function choose(n: number, k: number) {
    let top = 1
    let btm = 1

    for (let i = 0; i < k; i++) {
      top *= n - i
      btm *= i + 1
    }

    return top / btm
  }

  /** How many ways can a row sum to 1? */
  function ways(row: Uint8Array) {
    const ones = count(row)
    let total = 0

    for (let i = 1; i <= ones; i += 2) {
      total += choose(ones, i)
    }

    return total
  }

  function add(a: Uint8Array, b: Uint8Array) {
    const ret = a.slice()
    for (let i = 0; i < size; i++) {
      ret[i]! ^= b[i]!
    }
    return ret
  }
}

countByEvenOdd([], 6)
