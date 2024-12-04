import "../util.js"

function run(a) {
  const log = []
  let b = 0,
    c = 0,
    d = 0,
    i = 0

  // prettier-ignore
  {
  d = a
  c = 4
  do { b = 643
  do { d++
  b--
  } while (b)
  c--
  } while (c)
  a = d
  // noop
  b = a
  a = 0
  c = 2
  // noop
  if (!b) (i += 6)
  b--
  c--
  if (c) i += -4
  a++
  i += -7
  b = 2
  if (c) i += 2
  i += 4
  b--
  c--
  i += -4
  // noop
  log(b)
  if (a) i += -19
  i += -21
}

  const insts = [
    () => (d = a),
    () => (c = 4),
    () => (b = 643),
    () => d++,
    () => b--,
    () => b && (i += -2),
    () => c--,
    () => c && (i += -5),
    () => (a = d),
    () => 0 && (i += 0),
    () => (b = a),
    () => (a = 0),
    () => (c = 2),
    () => b && (i += 2),
    () => 1 && (i += 6),
    () => b--,
    () => c--,
    () => c && (i += -4),
    () => a++,
    () => 1 && (i += -7),
    () => (b = 2),
    () => c && (i += 2),
    () => 1 && (i += 4),
    () => b--,
    () => c--,
    () => 1 && (i += -4),
    () => 0 && (i += 0),
    () => log(b),
    () => a && (i += -19),
    () => 1 && (i += -21),
  ]

  for (let j = 0; j < 1000; j++) {
    const ib = i
    const inst = insts[i]
    if (!inst) break
    inst()
    if (i == ib) {
      i++
    }
  }

  return log
}

ri(2000000, 20000000)
  .map((x, i) => {
    const arr = run(x)
    if (arr.length != 0) {
      console.log(i, arr)
    }
    return [i, arr]
  })
  .forEach((x) => x)
