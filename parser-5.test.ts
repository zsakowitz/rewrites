import * as Z from "./parser-5"

function indent(text: string) {
  return text.split("\n").join("\n  ")
}

const Identifier = Z.regex(/^[A-Za-z0-9_-]+/).map((value) => "$" + value[0])

const Whitespace = Z.regex(/^\s+/).void()

const OptionalWhitespace = Whitespace.optional()

const CommaWithWhitespace = Z.regex(/^\s*,\s*/).void()

const BarWithWhitespace = Z.regex(/^\s+\|\s+/).void()

const Literal = Z.seq(Z.text('"'), Z.regex(/^[^"\n\r]+/), Z.text('"')).map(
  (value) => `Z.text(${JSON.stringify(value[1][0])})`
)

const ReferenceWithArgs: Z.Parser<string> = Z.seq(
  Identifier,
  OptionalWhitespace,
  Z.text("<"),
  OptionalWhitespace,
  Z.sepBy1(
    Z.lazy(() => Sequence),
    CommaWithWhitespace
  ),
  OptionalWhitespace,
  Z.text(">")
).map((value) => `${value[0]}(${value[4].join(", ")})`)

const Lookahead: Z.Parser<string> = Z.seq(
  Z.text("&"),
  OptionalWhitespace,
  Z.lazy(() => Atom)
).map((value) => `Z.lookahead(\n  ${indent(value[2])}\n)`)

const Not: Z.Parser<string> = Z.seq(
  Z.text("!"),
  OptionalWhitespace,
  Z.lazy(() => Atom)
).map((value) => `Z.not(\n  ${indent(value[2])}\n)`)

const Parenthesized: Z.Parser<string> = Z.seq(
  Z.text("("),
  OptionalWhitespace,
  Z.lazy(() => Sequence),
  OptionalWhitespace,
  Z.text(")")
).map((value) => value[2])

const CharacterClass: Z.Parser<string> = Z.seq(
  Z.text("["),
  Z.regex(/^[^\n\r\]]+/),
  Z.text("]")
).map((e) => `Z.regex(new RegExp(${JSON.stringify("[" + e[1][0] + "]")}))`)

const Atom = Z.seq(
  Z.any(
    Literal,
    ReferenceWithArgs,
    Identifier,
    Lookahead,
    Not,
    Parenthesized,
    CharacterClass
  ),
  Z.optional(
    Z.seq(OptionalWhitespace, Z.any(Z.text("?"), Z.text("*"), Z.text("+"))).map(
      (value) => value[1]
    )
  )
).map(([value, quantifier]) => {
  if (quantifier == "?") {
    return `Z.optional(\n  ${indent(value)}\n)`
  }

  if (quantifier == "*") {
    return `Z.many(\n  ${indent(value)}\n)`
  }

  if (quantifier == "+") {
    return `Z.many1(\n  ${indent(value)}\n)`
  }

  return value
})

const Sequence = Z.sepBy1(Atom, Whitespace).map((value) => {
  if (value.length == 1) {
    return value[0]
  } else {
    return `Z.seq(\n  ${indent(value.join(",\n"))}\n)`
  }
})

const Choice = Z.sepBy1(Sequence, BarWithWhitespace).map((value) => {
  if (value.length == 1) {
    return value[0]
  } else {
    return `Z.any(\n  ${indent(value.join(",\n"))}\n)`
  }
})

const Assignment = Z.seq(
  Identifier,
  OptionalWhitespace,
  Z.optional(
    Z.seq(
      Z.text("<"),
      OptionalWhitespace,
      Z.sepBy1(
        Z.lazy(() => Sequence),
        CommaWithWhitespace
      ),
      OptionalWhitespace,
      Z.text(">"),
      OptionalWhitespace
    ).map((value) => value[2])
  ),
  Z.text("="),
  OptionalWhitespace,
  Choice,
  OptionalWhitespace,
  Z.text(";")
).map((value) => {
  const name = value[0]
  const args = value[2]
  const expr = value[5]

  if (args) {
    return (
      `const ${name}\n  ` +
      indent(
        `(${args.join(", ")}) =>\n  ` +
          indent(`Z.lazy(() =>\n  ${indent(expr)}\n)`)
      )
    )
  }

  return `const ${name} =\n  ` + indent(`Z.lazy(() =>\n  ${indent(expr)}\n)`)
})

const EOF = Z.not(Z.char)

const Grammar = Z.seq(
  OptionalWhitespace,
  Z.many(Assignment),
  OptionalWhitespace,
  Sequence,
  OptionalWhitespace,
  EOF
).map((value) => `${value[1].join("\n\n")}\n\n${value[3]}`)
