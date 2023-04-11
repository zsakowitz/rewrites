import { createEffect, createMemo, createSignal, h, render } from "../solid"
import { expression } from "./expression-parser"
import { printAST } from "./print-ast"
import { printLaTeX } from "./print-latex"
import katex from "katex"
import "katex/dist/katex.css"

const [script, setScript] = createSignal("x^2")

const parsed = createMemo(() => expression.parse(script()))

render(
  <div style="display:grid;grid-template-columns:calc(50% - 1rem) calc(50% - 1rem);gap:2rem">
    <textarea
      className="section"
      style="resize:none;height:5rem;font-size:1rem"
      placeholder="Type a script here..."
      value={script()}
      on:input={(event) => setScript(event.currentTarget.value)}
    />

    <div
      className="section"
      style="margin:0;display:flex;align-items:center;justify-content:center"
      use={(el) => {
        createEffect(() => {
          const value = parsed()

          if (value.ok) {
            el.innerHTML = katex.renderToString(printLaTeX(value.value))
          } else {
            el.textContent = "Error: " + value.value
          }
        })
      }}
    />

    <pre className="section" style="margin:0">
      {() => JSON.stringify(parsed(), undefined, 2)}
    </pre>

    <pre className="section" style="margin:0">
      {() => printAST(parsed().value)}
    </pre>

    <style>
      body {"{"}
      margin: 2rem
      {"}"}
      .section {"{"}
      background-color: #f0f0f0; border: 0;padding:0.5rem;border-radius:0.25rem
      {"}"}
    </style>
  </div>,
  document.body,
)
