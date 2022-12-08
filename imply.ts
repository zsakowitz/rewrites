// All boolean operations implemented from a single IMPLY gate.

let imply = (a: boolean, b: boolean) => !(a && !b)
let not = (a: boolean) => imply(a, false)

export {}
