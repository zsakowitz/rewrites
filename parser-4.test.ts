import * as Z from "./parser-4";

const Expression: Z.Parser<number> = Z.deferred(() =>
  Z.any(Level1, Parenthesized)
);

const Number = Z.regex(/^\d+(?:\.+\d+)?(?:e[+-]?\d+)?/).map((value) =>
  parseFloat(value[0])
);

const Parenthesized = Z.sequence(
  Z.text("("),
  Z.OptionalWhitespace,
  Expression,
  Z.OptionalWhitespace,
  Z.text(")")
).key(2);

const Atom = Z.any(Number, Parenthesized);

const Multiplication = Z.sequence(Z.text("*"), Z.OptionalWhitespace, Atom);

const Division = Z.sequence(Z.text("/"), Z.OptionalWhitespace, Atom);

const Level2 = Z.sequence(
  Number,
  Z.OptionalWhitespace,
  Z.sepBy(Z.any(Multiplication, Division), Z.OptionalWhitespace)
).map(([number, , mappers]) =>
  mappers.reduce((a, [type, , b]) => (type == "*" ? a * b : a / b), number)
);

const Addition = Z.sequence(Z.text("+"), Z.OptionalWhitespace, Level2);

const Subtraction = Z.sequence(Z.text("-"), Z.OptionalWhitespace, Level2);

const Level1 = Z.sequence(
  Number,
  Z.OptionalWhitespace,
  Z.sepBy(Z.any(Addition, Subtraction), Z.OptionalWhitespace)
).map(([number, , mappers]) =>
  mappers.reduce((a, [type, , b]) => (type == "+" ? a + b : a - b), number)
);
