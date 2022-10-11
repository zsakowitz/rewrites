// The test script for parser.ts. #parser #test

import {
  any,
  char,
  deferred,
  many,
  Number as Number2,
  OptionalWhitespace,
  Parser,
  regex,
  Result,
  sepBy,
  sequence,
  text,
} from "./parser.js";

function indent(text: string) {
  return text.split("\n").join("\n  ");
}

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
    Division,
    Not,
    Apply,
    Function,
    Condition,
    Undefined,
    Array,
    Object,
    Await,
    Yield,
    String
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
).map(([, , left, , right]) => `((${left}, ${right}))`);

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

const Not = sequence(text("!"), OptionalWhitespace, Expression)
  .key(2)
  .map((data) => `(!${data})`);

const Apply = sequence(
  text("("),
  OptionalWhitespace,
  Expression,
  OptionalWhitespace,
  sepBy(Expression, OptionalWhitespace),
  OptionalWhitespace,
  text(")")
).map(([, , target, , args]) => `(${target}(${args.join(", ")}))`);

const Function = sequence(
  text("\\"),
  OptionalWhitespace,
  regex(/^~\s*@|@\s*~|@|~|/, (data) => ({
    async: data.includes("@"),
    generator: data.includes("~"),
  })),
  OptionalWhitespace,
  text("("),
  OptionalWhitespace,
  sepBy(Expression, OptionalWhitespace),
  OptionalWhitespace,
  text(")"),
  OptionalWhitespace,
  Expression
).map(
  ([, , { async, generator }, , , , params, , , , value]) =>
    `(${async ? "async " : ""}function${generator ? "*" : ""} (${params
      .map((e) => (e.startsWith("(") && e.endsWith(")") ? e.slice(1, -1) : e))
      .join(", ")}) {
  return ${indent(value)};
}.bind(this))`
);

const Condition = sequence(
  text("?"),
  OptionalWhitespace,
  Expression,
  OptionalWhitespace,
  Expression,
  OptionalWhitespace,
  Expression
).map(
  ([, , condition, , left, , right]) => `(${condition} ? ${left} : ${right})`
);

const Undefined = text("x", "undefined");

const Array = sequence(
  text("["),
  OptionalWhitespace,
  sepBy(Expression, OptionalWhitespace),
  OptionalWhitespace,
  text("]")
).map(([, , data]) => `[\n  ${indent(data.join(",\n"))}\n]`);

const Object = sequence(
  text("{"),
  OptionalWhitespace,
  sepBy(
    sequence(ExpressionOrProperty, OptionalWhitespace, Expression),
    OptionalWhitespace
  ),
  OptionalWhitespace,
  text("}")
).map(
  ([, , props]) =>
    `{\n  ${indent(
      props
        .map(
          ([key, , value]) =>
            `${key.isProp ? key.data : `[${key.data}]`}: ${
              value.startsWith("(") && value.endsWith(")")
                ? value.slice(1, -1)
                : value
            }`
        )
        .join(",\n")
    )}\n}`
);

const Await = sequence(text("@"), OptionalWhitespace, Expression).map(
  ([, , data]) => `(await ${data})`
);

const Yield = sequence(text("~"), OptionalWhitespace, Expression).map(
  ([, , data]) => `(yield ${data})`
);

const Character = char((char) =>
  char == "$" || char == '"'
    ? `\\${char}`
    : char == "\n"
    ? "\\n"
    : char == "\r"
    ? "\\r"
    : char
).except(any(text("\\"), text('"')));

const EscapedCharacter = any(text("\\\\", "\\\\"), text('\\"', '\\"'));

const Interpolation = sequence(
  text("\\"),
  OptionalWhitespace,
  text("{"),
  OptionalWhitespace,
  Expression,
  OptionalWhitespace,
  text("}")
).map(([, , , , data]) => `\${${data}}`);

const String = sequence(
  text('"'),
  many(any(Character, EscapedCharacter, Interpolation)),
  text('"')
).map(([, data]) => `\`${data.join("")}\``);

function compile(text: string) {
  return Expression.parse(Result.of(text)).data;
}

function evaluate(text: string) {
  return (0, eval)(compile(text));
}
