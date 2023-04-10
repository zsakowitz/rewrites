import { expression } from "./expression-parser"

function indent(text: string) {
  return text.replace(/\n/g, "\n  ")
}

function printArray(value: readonly unknown[]) {
  return printAST(value)
}

function printASTKey([key, value]: [string, unknown]) {
  if (value === void 0) {
    return ""
  }

  return (
    "\n  " +
    key +
    ":" +
    (Array.isArray(value)
      ? printArray(value)
      : typeof value == "object" && value
      ? "\n    " + indent(indent(printAST(value)))
      : "\n    " + value)
  )
}

export function printAST(node: {}): string {
  if (typeof node != "object") {
    return String(node)
  }

  return `${
    "type" in node
      ? String(node.type)[0]?.toUpperCase() + String(node.type).slice(1)
      : node.constructor.name
  }${Object.entries<unknown>(node as {})
    .filter(([key]) => key != "type")
    .map(printASTKey)
    .join("")}`
}
