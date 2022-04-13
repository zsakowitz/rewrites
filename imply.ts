let imply = (a: boolean, b: boolean) => !(a && !b);
let not = (a: boolean) => imply(a, false);
