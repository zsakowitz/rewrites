// Puts textareas into the DOM that can be used to test parser-5.peg.test.ts.

import * as Z from "./parser-5"
import { Grammar } from "./parser-5.peg.test"

Object.assign(window, { Z })

const entry = document.createElement("textarea")
const js = document.createElement("textarea")
const input = document.createElement("textarea")
const output = document.createElement("textarea")

function setStyle(style: CSSStyleDeclaration) {
  style.boxSizing = "border-box"
  style.height = "calc(50vh - 24px)"
  style.width = "calc(50vw - 24px)"
  style.resize = "none"
  style.backgroundColor = "#303030"
  style.borderRadius = "8px"
  style.outline = "none"
  style.color = "white"
  style.padding = "8px 12px"
}

setStyle(entry.style)
setStyle(js.style)
setStyle(input.style)
setStyle(output.style)

entry.style.marginBottom = "16px"
entry.style.marginRight = "16px"
input.style.marginBottom = "16px"
js.style.marginRight = "16px"

let grammar: Z.AnyParser | string

entry.oninput = () => {
  const result = Grammar.parse(entry.value)
  js.value = result.value

  if (!result.ok) {
    grammar = result.value
    return
  }

  try {
    grammar = (0, eval)(result.value)
  } catch (error) {
    grammar = String(error)
  }

  try {
    if (grammar instanceof Z.Parser) {
      output.value = JSON.stringify(
        grammar.parse(input.value).value,
        undefined,
        2,
      )
    } else {
      output.value = grammar
    }
  } catch (error) {
    output.value = String(error)
  }
}

input.oninput = () => {
  try {
    if (grammar instanceof Z.Parser) {
      output.value = JSON.stringify(
        grammar.parse(input.value).value,
        undefined,
        2,
      )
    } else {
      output.value = grammar
    }
  } catch (error) {
    output.value = String(error)
  }
}

document.head.remove()
document.body.remove()

document.documentElement.append(
  document.createElement("head"),
  document.createElement("body"),
)

document.documentElement.style.background = "#151515"

document.body.append(entry, input, js, output)
document.body.style.margin = "16px"
