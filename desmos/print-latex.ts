// Prints an expression as LaTeX.

import { Expression } from "./expression-parser"
import {
  BUILT_INS,
  BUILT_INS_WITH_COMPLEX_ALTERNATIVES,
  IMPLICIT_FUNCTION_BUILT_INS,
  SINGLE_CHARACTER_VARIABLES,
} from "./types"

const enum Precedence {
  Atom = 10,
  Exponentiation = 9,
  ImpliedMultiplication = 8,
  Multiplication = 7,
  Addition = 6,
  Range = 5,
  Conditional = 4,
  Action = 3,
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

function isAllowedInImplicitCall(node: Expression): boolean {
  if (node.complex) {
    return false
  }

  return (
    node.type == "number" ||
    node.type == "variable" ||
    node.type == "/" ||
    (node.type == "^" &&
      (node.left.type == "number" || node.left.type == "variable")) ||
    (node.type == "*" &&
      isAllowedInImplicitCall(node.left) &&
      isAllowedInImplicitCall(node.right))
  )
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
        return {
          output: "\\operatorname{" + node.name + "}",
          precedence: Precedence.Atom,
        }
      }

      const name = node.name.replace(
        SINGLE_CHARACTER_VARIABLES,
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

    case "range":
      return {
        output:
          parenthesize(node.start, Precedence.Range) +
          "..." +
          parenthesize(node.end, Precedence.Range),
        precedence: Precedence.Range,
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
      if (
        node.complex &&
        BUILT_INS_WITH_COMPLEX_ALTERNATIVES.includes(node.name.name)
      ) {
        return {
          output:
            "c_{" +
            node.name.name +
            "}\\left(" +
            node.args.map(printLaTeX).join(",") +
            "\\right)",
          precedence: Precedence.Atom,
        }
      }

      if (node.args.length == 1) {
        if (
          IMPLICIT_FUNCTION_BUILT_INS.includes(node.name.name) &&
          isAllowedInImplicitCall(node.args[0]!)
        ) {
          return {
            output: printLaTeX(node.name) + " " + printLaTeX(node.args[0]!),
            precedence: Precedence.Addition,
          }
        }
      }

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

    case "*": {
      if (node.complex) {
        return {
          output: `c_{mult}\\left(${printLaTeX(node.left)}, ${printLaTeX(
            node.right,
          )}\\right)`,
          precedence: Precedence.Atom,
        }
      }

      if (
        node.left.type == "number" ||
        node.left.type == "variable" ||
        partialPrint(node.left).precedence ==
          Precedence.ImpliedMultiplication ||
        partialPrint(node.left).precedence == Precedence.Exponentiation
      ) {
        return {
          output: printLaTeX(node.left) + " " + parenthesize(node.right),
          precedence: Precedence.ImpliedMultiplication,
        }
      }

      return {
        output:
          parenthesize(node.left, Precedence.Addition) +
          " \\cdot " +
          parenthesize(node.right),
        precedence: Precedence.Multiplication,
      }
    }

    case "+":
    case "-":
      return {
        output:
          parenthesize(node.left, Precedence.Range) +
          node.type +
          parenthesize(node.right, Precedence.Addition),
        precedence: Precedence.Addition,
      }

    case "<":
    case ">":
    case "<=":
    case ">=":
    case "=":
      return {
        output:
          parenthesize(node.left, Precedence.Action) +
          (node.type == "<="
            ? "\\le"
            : node.type == ">="
            ? "\\ge"
            : node.type) +
          parenthesize(node.right, Precedence.Action),
        precedence: Precedence.Conditional,
      }

    case "list":
      return {
        output:
          "\\left[" + node.elements.map(printLaTeX).join(",") + "\\right]",
        precedence: Precedence.Atom,
      }

    case "square_root":
      if (node.complex) {
        return {
          output: "c_{sqrt}\\left(" + printLaTeX(node.arg) + "\\right)",
          precedence: Precedence.Atom,
        }
      }

      return {
        output: "\\sqrt{" + printLaTeX(node.arg) + "}",
        precedence: Precedence.Atom,
      }

    case "nth_root":
      if (node.complex) {
        return {
          output:
            "c_{root}\\left(" +
            printLaTeX(node.root) +
            "," +
            printLaTeX(node.arg) +
            "\\right)",
          precedence: Precedence.Atom,
        }
      }

      return {
        output:
          "\\sqrt[" + printLaTeX(node.root) + "]{" + printLaTeX(node.arg) + "}",
        precedence: Precedence.Atom,
      }

    case "arbitrary_log":
      if (node.complex) {
        return {
          output:
            "c_{arbitraryLog}\\left(" +
            printLaTeX(node.base) +
            "," +
            printLaTeX(node.arg) +
            "\\right)",
          precedence: Precedence.Atom,
        }
      }

      return {
        output:
          "\\log_{" +
          printLaTeX(node.base) +
          "}" +
          (isAllowedInImplicitCall(node.arg)
            ? printLaTeX(node.arg)
            : parenthesize(node.arg, Precedence.Atom)),
        precedence: Precedence.Atom,
      }
  }
}

export function printLaTeX(node: Expression): string {
  return partialPrint(node).output
}
