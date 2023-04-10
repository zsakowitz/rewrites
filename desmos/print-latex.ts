import { Expression } from "./expression-parser"
import { BUILT_INS, RESERVED_NAMES_REGEX } from "./types"

const enum Precedence {
  Atom = 10,
  Exponentiation = 7,
  Multiplication = 4,
  Addition = 1,
}

type PartialPrint = {
  output: string
  precedence: Precedence
}

function parenthesize(
  expr: Expression,
  minimumPrecedence: Precedence = Precedence.Multiplication,
) {
  const node = partialPrint(expr)

  return node.precedence <= minimumPrecedence
    ? "\\left(" + node.output + "\\right)"
    : node.output
}

function curlyBracketize(text: string) {
  if (text.length == 1) {
    return text
  }

  return "{" + text + "}"
}

function partialPrint(node: Expression): PartialPrint {
  switch (node.type) {
    case "number":
      return {
        output: "" + node.value,
        precedence: Precedence.Atom,
      }

    case "variable": {
      if (node.name.length == 0) {
        throw new Error("'name' expressions cannot be empty.")
      }

      if (BUILT_INS.includes(node.name)) {
        return { output: node.name, precedence: Precedence.Atom }
      }

      const name = node.name.replace(
        RESERVED_NAMES_REGEX,
        (match) => "\\" + match + "_",
      )

      if (name.includes("_")) {
        const [beginning, end] = name.split("_") as [string, string]

        return {
          output: end ? beginning + "_" + curlyBracketize(end) : beginning,
          precedence: Precedence.Atom,
        }
      }

      return {
        output:
          name.length == 1
            ? name
            : name[0] + "_" + curlyBracketize(name.slice(1)),
        precedence: Precedence.Atom,
      }
    }

    case "prefix":
      return {
        output: node.operator + parenthesize(node.arg),
        precedence: Precedence.Addition,
      }

    case "sum":
    case "prod":
      return {
        output: `\\${node.type}_{${printLaTeX(node.name)}=${printLaTeX(
          node.start,
        )}}^${curlyBracketize(printLaTeX(node.end))} ${parenthesize(
          node.expr,
        )}`,
        precedence: Precedence.Atom,
      }

    case "point":
      return {
        output:
          "\\left(" +
          printLaTeX(node.x) +
          "," +
          printLaTeX(node.y) +
          "\\right)",
        precedence: Precedence.Atom,
      }

    case "function_call":
      return {
        output:
          printLaTeX(node.name) +
          "\\left(" +
          node.args.map(printLaTeX).join(",") +
          "\\right)",
        precedence: Precedence.Atom,
      }

    case "member_call":
      return {
        output:
          parenthesize(node.target) +
          "." +
          node.property.name +
          "\\left(" +
          node.args.map(printLaTeX).join(",") +
          "\\right)",
        precedence: Precedence.Atom,
      }

    case "property_access":
      return {
        output: parenthesize(node.target) + "." + node.property.name,
        precedence: Precedence.Atom,
      }

    case "indexed_access":
      return {
        output:
          parenthesize(node.target) +
          "\\left[" +
          printLaTeX(node.index) +
          "\\right]",
        precedence: Precedence.Atom,
      }

    case "^":
      if (node.complex) {
        return {
          output: `c_{pow}\\left(${printLaTeX(node.left)}, ${printLaTeX(
            node.right,
          )}\\right)`,
          precedence: Precedence.Atom,
        }
      }

      return {
        output:
          parenthesize(node.left, Precedence.Exponentiation) +
          "^" +
          curlyBracketize(printLaTeX(node.right)),
        precedence: Precedence.Exponentiation,
      }

    case "/":
      if (node.complex) {
        return {
          output: `c_{div}\\left(${printLaTeX(node.left)}, ${printLaTeX(
            node.right,
          )}\\right)`,
          precedence: Precedence.Atom,
        }
      }

      return {
        output:
          "\\frac{" +
          printLaTeX(node.left) +
          "}{" +
          printLaTeX(node.right) +
          "}",
        precedence: Precedence.Atom,
      }

    case "*":
      if (node.complex) {
        return {
          output: `c_{mult}\\left(${printLaTeX(node.left)}, ${printLaTeX(
            node.right,
          )}\\right)`,
          precedence: Precedence.Atom,
        }
      }

      return {
        output:
          parenthesize(node.left, Precedence.Addition) +
          " \\cdot " +
          parenthesize(node.right),
        precedence: Precedence.Multiplication,
      }

    case "+":
    case "-":
      return {
        output:
          printLaTeX(node.left) +
          node.type +
          parenthesize(node.right, Precedence.Addition),
        precedence: Precedence.Addition,
      }

    case "list":
      return {
        output:
          "\\left[" + node.elements.map(printLaTeX).join(",") + "\\right]",
        precedence: Precedence.Atom,
      }
  }
}

export function printLaTeX(node: Expression): string {
  return partialPrint(node).output
}
