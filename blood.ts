function fork(a, b) {
  return (
    (Math.random() < 0.5 ? a[0] : a[1]) + (Math.random() < 0.5 ? b[0] : b[1])
  )
}

function rand() {
  const a = [
    "ii",
    "Ai",
    "Bi",
    "AA",
    "BB",
    "AB",
    "AB",
    "AB",
    "AB",
    "AB",
    "AB",
    "AB",
    "AB",
    "AB",
    "AB",
    "AB",
    "AB",
    "AB",
  ]
  return a[Math.floor(Math.random() * a.length)]
}

function randN(n) {
  return Array(n).fill().map(rand)
}

function mix(n) {
  return Array.from({ length: Math.floor(n.length / 2) }, (_, i) =>
    fork(n[2 * i], n[2 * i + 1]),
  )
}

function shuffle(a) {
  const array = a.slice()
  let currentIndex = array.length

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--

    // And swap it with the current element.
    ;[array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ]
  }

  return array
}

function nextgen(a) {
  return mix(shuffle(a)).concat(mix(shuffle(a)))
}

function count(a) {
  const c = (x) => a.filter((y) => y == x).length
  return [
    c("Ai") + c("iA"),
    c("AA"),
    c("Bi") + c("iB"),
    c("BB"),
    c("ii"),
    c("AB") + c("BA"),
  ]
}

function go(n, gens) {
  let f = randN(n)
  const ret = []
  for (let i = 0; i < gens; i++) {
    const [a1, a2, b1, b2, o, ab] = count(f)
    ret.push(i + "\t" + [a1 + a2, b1 + b2, o, ab].map((x) => x / n).join("\t"))
    f = nextgen(f)
  }
  return ret.join("\n")
}

go(1e4, 1e4)
