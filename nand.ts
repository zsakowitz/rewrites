let nand = (a: boolean, b: boolean) => !(a && b);
let not = (a: boolean) => nand(a, a);
let or = (a: boolean, b: boolean) => nand(not(a), not(b));
let and = (a: boolean, b: boolean) => not(nand(a, b));
let xor = (a: boolean, b: boolean) => and(or(a, b), nand(a, b));
let xnor = (a: boolean, b: boolean) => nand(or(a, b), nand(a, b));
let nor = (a: boolean, b: boolean) => and(not(a), not(b));
let imply = (a: boolean, b: boolean) => nand(a, not(b));
let nimply = (a: boolean, b: boolean) => and(a, not(b));

export {};
