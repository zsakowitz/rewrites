// Places textareas into a browser that allow for writing and running lambda
// calculus code.

import * as L from "./lambda-js.js"

const code = document.createElement("textarea")
code.placeholder = "zero = \\f \\x x;\nsucc = \\n \\f \\x f (n f x);\nsucc zero"
code.style.marginBottom = "8px"

const output = document.createElement("textarea")
output.readOnly = true

function style(style: CSSStyleDeclaration) {
    style.width = "100%"
    style.height = "calc(50vh - 12px)"
}

style(code.style)
style(output.style)

document.body.append(code, output)

code.addEventListener("input", () => {
    try {
        const parsed = L.parse(code.value)
        const fn = (0, eval)(parsed.toJS())

        const value = L.getValue(fn)
        const text = L.valueToString(value)
        output.value = text
    } catch (error) {
        output.value = error instanceof Error ? error.message : String(error)
    }
})
