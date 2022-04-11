let nand = (a: boolean, b: boolean) => !(a && b);
let not = (a: boolean) => nand(a, a);
let or = (a: boolean, b: boolean) => nand(nand(a, a), nand(b, b));
let and = (a: boolean, b: boolean) => not(nand(a, b));
let xor = (a: boolean, b: boolean) => and(or(a, b), nand(a, b));
let xnor = (a: boolean, b: boolean) => nand(or(a, b), nand(a, b));
