// The test script for parser.ts. #parser #test

import {
  any,
  deferred,
  Number as Number2,
  OptionalWhitespace,
  Parser,
  regex,
  sequence,
  text,
} from "./parser";

const Expression: Parser<string> = deferred(() =>
  any<string[]>(
    Member,
    StatementList,
    Assignment,
    Variable,
    True,
    False,
    Number,
    Addition,
    Subtraction,
    Multiplication,
    Division
  )
);

const Word = regex(/^[A-Za-z]+/, (match) => match);

const Property = sequence(text("'"), OptionalWhitespace, Word).key(2);

const ExpressionOrProperty = any<{ isProp: boolean; data: string }[]>(
  Expression.map((data) => ({ isProp: false, data })),
  Property.map((data) => ({ isProp: true, data }))
);

const Member = sequence(
  text("."),
  OptionalWhitespace,
  Expression,
  OptionalWhitespace,
  ExpressionOrProperty
).map(([, , target, , index]) => {
  if (index.isProp) return `${target}.${index.data}`;
  return `${target}[${index.data}]`;
});

const StatementList = sequence(
  text(","),
  OptionalWhitespace,
  Expression,
  OptionalWhitespace,
  Expression
).map(([, , left, , right]) => `(${left}, ${right})`);

const Assignment = sequence(
  text("="),
  OptionalWhitespace,
  Expression,
  OptionalWhitespace,
  Expression
).map(([, , left, , right]) => `(${left} = ${right})`);

const Variable = sequence(text("$"), OptionalWhitespace, Word).key(2);

const True = text("^", "true");
const False = text("v", "false");

const Number = sequence(text("#"), OptionalWhitespace, Number2).key(2);

const Addition = sequence(
  text("+"),
  OptionalWhitespace,
  Expression,
  OptionalWhitespace,
  Expression
).map(([, , left, , right]) => `(${left} + ${right})`);

const Subtraction = sequence(
  text("-"),
  OptionalWhitespace,
  Expression,
  OptionalWhitespace,
  Expression
).map(([, , left, , right]) => `(${left} - ${right})`);

const Multiplication = sequence(
  text("*"),
  OptionalWhitespace,
  Expression,
  OptionalWhitespace,
  Expression
).map(([, , left, , right]) => `(${left} * ${right})`);

const Division = sequence(
  text("/"),
  OptionalWhitespace,
  Expression,
  OptionalWhitespace,
  Expression
).map(([, , left, , right]) => `(${left} / ${right})`);
