// Places textareas into a browser that allow for writing and running lambda
// calculus code. This automatically injects the S, K, and I functions, and
// compiles to a lambda calculus expression rather than a number, pair, or
// other representation.

import * as L from "./lambda-js"

function run() {
  try {
    let parsed = L.parse(code.value)

    let output =
      (isCompact() ? parsed.toCompactString() : parsed.toString()) + "\n"

    const next = parsed.ski()

    if (next.toString() != parsed.toString()) {
      if (willShowSteps()) {
        const nextOutput = isCompact()
          ? next.toCompactString()
          : next.toString()

        if (nextOutput.length > 40) {
          output += nextOutput + "\n\n"
        } else {
          output += nextOutput + "\n"
        }
      }

      parsed = next
    }

    for (let i = 0; i < iterCount(); i++) {
      const next = parsed.eval()

      if (next.toString() == parsed.toString()) {
        break
      }

      if (willShowSteps()) {
        const nextOutput = isCompact()
          ? next.toCompactString()
          : next.toString()

        if (nextOutput.length > 40) {
          output += nextOutput + "\n\n"
        } else {
          output += nextOutput + "\n"
        }
      }

      parsed = next
    }

    if (willShowSteps()) {
      outputEl.value = output
      return
    }

    if (isCompact()) {
      outputEl.value = parsed.toCompactString()
    } else {
      outputEl.value = parsed.toString()
    }
  } catch (error) {
    outputEl.value = error instanceof Error ? error.message : String(error)
  }
}

function createControl<T>({
  label,
  type,
  value,
  get,
  set,
}: {
  label: string
  type: "checkbox" | "number" | "text"
  value: T
  get: (field: HTMLInputElement) => T
  set: (field: HTMLInputElement, value: T) => void
}): [HTMLLabelElement, () => T] {
  const labelEl = document.createElement("label")
  labelEl.textContent = label

  const fieldEl = document.createElement("input")
  fieldEl.type = type
  set(fieldEl, value)
  fieldEl.addEventListener("input", () => {
    value = get(fieldEl)
    run()
  })

  labelEl.append(fieldEl)

  return [labelEl, () => value]
}

const [iterCountEl, iterCount] = createControl({
  get(field) {
    return field.valueAsNumber
  },
  set(field, value) {
    field.valueAsNumber = value
  },
  label: "Number of Steps:",
  type: "number",
  value: 1000,
})

const [isCompactEl, isCompact] = createControl({
  get(field) {
    return field.checked
  },
  set(field, value) {
    field.checked = value
  },
  label: "Compact Output?",
  type: "checkbox",
  value: true,
})

const [willShowStepsEl, willShowSteps] = createControl({
  get(field) {
    return field.checked
  },
  set(field, value) {
    field.checked = value
  },
  label: "Show Steps?",
  type: "checkbox",
  value: false,
})

const code = document.createElement("textarea")
code.placeholder = "zero = \\f \\x x;\nsucc = \\n \\f \\x f (n f x);\nsucc zero"
code.addEventListener("input", run)

const outputEl = document.createElement("textarea")
outputEl.readOnly = true

const styleEl = document.createElement("style")
styleEl.textContent = `
*, ::before, ::after {
  box-sizing: border-box;
}

body {
  height: 100vh;
  margin: 0;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: ui-system, sans-serif;
}

label {
  display: flex;
  gap: 8px;
  width: 100%;
  align-items: center;
}

input {
  margin: 0;
}

div {
  display: flex;
  gap: 8px;
}

div:last-child {
  flex: 1;
}

textarea {
  display: block;
  flex: 1;
  resize: none;
}
`

const div1 = document.createElement("div")
div1.append(iterCountEl, isCompactEl, willShowStepsEl)

const div2 = document.createElement("div")
div2.append(code, outputEl)

document.body.append(styleEl, div1, div2)
