import { createMemo, createSignal, h, render } from "../solid"
import { expression } from "./expression-parser"
import { printLaTeX } from "./print-latex"

const [script, setScript] = createSignal("x^2")

const parsed = createMemo(() => expression.parse(script()))

render(
  <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
    <textarea
      style="flex:1"
      placeholder="Type a script here..."
      value={script()}
      on:input={(event) => setScript(event.currentTarget.value)}
    />

    <pre style="flex:1">
      {() => {
        const value = parsed()
        return value.ok ? printLaTeX(value.value) : "Error: " + value.value
      }}
    </pre>

    <pre style="width:100%">{() => JSON.stringify(parsed(), undefined, 2)}</pre>
  </div>,
  document.body,
)
