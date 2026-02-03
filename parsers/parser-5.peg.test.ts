// Parsers PEG-style grammars into a parser-5 style grammar.

import * as Z from "./parser-5.js"

function indent(text: string) {
    return text.split("\n").join("\n  ")
}

const Identifier = Z.regex(/^[A-Za-z0-9_-]+/).map((value) => "$" + value[0])

const Whitespace = Z.regex(/^\s+/).void()

const OptionalWhitespace = Whitespace.optional()

const CommaWithWhitespace = Z.regex(/^\s*,\s*/).void()

const BarWithWhitespace = Z.regex(/^\s+\|\s+/).void()

const Literal = Z.seq(Z.text('"'), Z.regex(/^[^"\n\r]+/), Z.text('"')).map(
    (value) => `Z.text(${JSON.stringify(value[1]![0])})`,
)

const ReferenceWithArgs: Z.Parser<string> = Z.seq(
    Identifier,
    OptionalWhitespace,
    Z.text("<"),
    OptionalWhitespace,
    Z.sepBy1(
        Z.lazy(() => Sequence),
        CommaWithWhitespace,
    ),
    OptionalWhitespace,
    Z.text(">"),
).map((value) => `${value[0]}(${value[4]!.join(", ")})`)

const Lookahead: Z.Parser<string> = Z.seq(
    Z.text("&"),
    OptionalWhitespace,
    Z.lazy(() => Atom),
).map((value) => `Z.lookahead(\n  ${indent(value[2])}\n)`)

const Not: Z.Parser<string> = Z.seq(
    Z.text("!"),
    OptionalWhitespace,
    Z.lazy(() => Atom),
).map((value) => `Z.not(\n  ${indent(value[2])}\n)`)

const Parenthesized: Z.Parser<string> = Z.seq(
    Z.text("("),
    OptionalWhitespace,
    Z.lazy(() => Choice),
    OptionalWhitespace,
    Z.text(")"),
).map((value) => value[2])

const CharacterClass: Z.Parser<string> = Z.seq(
    Z.text("["),
    Z.regex(/^[^\n\r\]]+/),
    Z.text("]"),
).map(
    (e) =>
        `Z.regex(new RegExp(${JSON.stringify(
            "^[" + e[1]![0] + "]",
        )})).map(result => result[0])`,
)

const Js: Z.Parser<string> = Z.many(
    Z.any(
        Z.regex(/^[^{}]+/).map((value) => value[0]),
        Z.seq(
            Z.text("{"),
            Z.many(Z.lazy(() => Js)).map((value) => value.join("")),
            Z.text("}"),
        ).map((value) => value.join("")),
    ),
).map((value) => value.join(""))

const Atom = Z.seq(
    Z.optional(
        Z.seq(
            Z.regex(/^\$[A-Za-z_]![A-Za-z0-9_]*/),
            OptionalWhitespace,
            Z.text(":"),
            OptionalWhitespace,
        ).map((value) => value[0]![0]),
    ),
    Z.any(
        Literal,
        ReferenceWithArgs,
        Identifier,
        Lookahead,
        Not,
        Parenthesized,
        CharacterClass,
    ),
    Z.optional(
        Z.seq(
            OptionalWhitespace,
            Z.any(Z.text("?"), Z.text("*"), Z.text("+")),
        ).map((value) => value[1]),
    ),
    Z.optional(
        Z.seq(
            OptionalWhitespace,
            Z.text(":"),
            OptionalWhitespace,
            Z.text("{"),
            Js,
            Z.text("}"),
        ).map((value) => value[4]),
    ),
).map(([label, value, quantifier, js]) => {
    if (quantifier == "?") {
        value = `Z.optional(\n  ${indent(value)}\n)`
    } else if (quantifier == "*") {
        value = `Z.many(\n  ${indent(value)}\n)`
    } else if (quantifier == "+") {
        value = `Z.many1(\n  ${indent(value)}\n)`
    }

    if (label) {
        value = `${value}\n  .map(value => globalThis.${label} = value)`
    }

    if (js) {
        if (js.includes("\n")) {
            value = `${value}\n  .map(value =>\n  (\n  ${indent(indent(js))}\n  )\n)`
        } else {
            value = `${value}\n  .map(value => (${js}))`
        }
    }

    return value
})

const Sequence = Z.seq(
    Z.sepBy1(Atom, Whitespace),
    Z.optional(
        Z.seq(Whitespace, Z.text("{"), Js, Z.text("}")).map(
            (value) => value[2],
        ),
    ),
).map(([items, js]) => {
    let value =
        items.length == 1 ?
            items[0]
        :   `Z.seq(\n  ${indent(items.join(",\n"))}\n)`

    if (js) {
        if (js.includes("\n")) {
            value = `${value}\n  .map(value =>\n  (\n  ${indent(indent(js))}\n  )\n)`
        } else {
            value = `${value}\n  .map(value => (${js}))`
        }
    }

    return value
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
                CommaWithWhitespace,
            ),
            OptionalWhitespace,
            Z.text(">"),
            OptionalWhitespace,
        ).map((value) => value[2]),
    ),
    Z.text("="),
    OptionalWhitespace,
    Choice,
    OptionalWhitespace,
    Z.text(";"),
).map((value) => {
    const name = value[0]
    const args = value[2]
    const expr = value[5]

    if (args) {
        return (
            `const ${name} =\n  `
            + indent(
                `(${args.join(", ")}) =>\n  `
                    + indent(`Z.lazy(() =>\n  ${indent(expr)}\n)`),
            )
        )
    }

    return `const ${name} =\n  ` + indent(`Z.lazy(() =>\n  ${indent(expr)}\n)`)
})

const EOF = Z.not(Z.char)

export const Grammar = Z.seq(
    OptionalWhitespace,
    Z.sepBy(Assignment, Whitespace),
    OptionalWhitespace,
    Sequence,
    OptionalWhitespace,
    EOF,
).map((value) => `${value[1]!.join("\n\n")}\n\n${value[3]}`)

/**
 * A description of this grammar:
 *
 * There are seven "atoms", and each has an associated value.
 *
 * Atom Name Example Value
 *
 * - literals "Hello world" "Hello world"
 * - character classes [\w] the matched character
 * - lookahead &atom value of `atom`
 * - negative lookahead !atom `undefined`
 * - reference spaces value of the referenced token
 * - reference with args sepBy<ident, spaces> value of the referenced token
 * - parenthesized ([\w] [\d]) value of the inner token
 *
 * Each atom may be marked with a quantifier. A quantifier modifies the value of
 * whatever it encloses.
 *
 * Quantifier Name Symbol Example Value
 *
 * - optional ? [\s]? the matched expression or `undefined`
 * - zero or more * ident* an array of values
 * - one or more + "hello"+ an array of values
 *
 * Each atom can have a label before it. A label must begin with $.
 *
 * $name:[\w]+ $number:([123456789]![\d]*)
 *
 * Labels can be used in a JavaScript expressions. JS expressions are surrounded
 * in curly braces and can use nearby labels.
 *
 * $name:[\w]+:{ $name.join("")) } $age:[\d]*:{ Number($age.join("")) }
 *
 * A sequence can be formed by separating atoms with whitespace. A sequence has
 * the value of the values of its elements, in order.
 *
 * "Hello" [\s]+ "world"
 *
 * $person:([\w]+ ", " [\d]+):{{ name: $person[0]!.join(""), age:
 * Number($person[1]!.join("")) }} This syntax with double curly braces isn't
 * special; it's just an object.
 *
 * While it is possible to use standard JS expressions with a list, a shorter
 * form is available. Simply add curly braces at the end of your sequence.
 *
 * $name:[\w]+ ", " $age:[\d]+ {{ name: $name.join(""), age:
 * Number($age.join("")) }} This syntax with double curly braces isn't special;
 * it's just an object.
 *
 * A choice can be formed by separating sequences with `|`. A choice has the
 * value of the first matched result.
 *
 * "Hello" [\s]+ "world" | "Goodbye" [\s]+ "world"
 *
 * Choices can be used in parenthesized expressions.
 *
 * ("Hello" | "Goodbye") [\s]+ "world"
 *
 * To create a grammar rule, write an identifier, "=", an expression, and ";".
 *
 * name = $letters:[A-Za-z]+:{ letters.join("") }; space = [\s]+:{ undefined };
 *
 * Grammar rules can take arguments in the form of an angle-bracketed list.
 *
 * sepBy<rule, separator> = rule (separator rule)*
 *
 * To use a grammar rule, type its name. If it takes arguments, write those in
 * an angle-bracketed list.
 *
 * sepBy<name, space>
 *
 * To create a grammar, start by writing all your rules down. Then, finish off
 * the source with an expression.
 *
 * Note that your grammar does not need to be aligned like in this example. The
 * alignment is for purely decorative reasons. Likewise, the extra newline
 * before the final rule is not required.
 *
 * name = [A-Za-z]+ ; age = [\d]+ ; space = " "+ ; person = $name:name space
 * $age:age {{ name: $name, age: $age }} ; sepBy<a, b> = $head:a $tail:(b
 * $value:a { $value })* { [$head]!.concat($tail) } ; newline = space? [\n]
 * space? ;
 *
 * sepBy<person, newline>
 */
