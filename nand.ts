// All boolean logic gates implemented from a single NAND gate.

const nand = (a: boolean, b: boolean) => !(a && b)
const not = (a: boolean) => nand(a, a)
const or = (a: boolean, b: boolean) => nand(not(a), not(b))
const and = (a: boolean, b: boolean) => not(nand(a, b))
const xor = (a: boolean, b: boolean) => and(or(a, b), nand(a, b))
const xnor = (a: boolean, b: boolean) => nand(or(a, b), nand(a, b))
const nor = (a: boolean, b: boolean) => and(not(a), not(b))
const imply = (a: boolean, b: boolean) => nand(a, not(b))
const nimply = (a: boolean, b: boolean) => and(a, not(b))

export {}
