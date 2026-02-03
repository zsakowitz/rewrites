// A playground which allows expressions to be typed and converted into
// Desmos-compatible LaTeX. It automatically detects complex numbers and
// replaces their operations (*, ^, exp, ln) with c_mult, c_pow, c_exp, and
// other functions to easily allow the typing of complex expressions in Desmos.

import katex from "katex"
import "katex/dist/katex.css"
import { createEffect, createMemo, createSignal, h, render } from "../solid.js"
import { expression } from "./expression-parser.js"
import { printAST } from "./print-ast.js"
import { printLaTeX } from "./print-latex.js"

const [script, setScript] = createSignal("x^2")

const parsed = createMemo(() => expression.parse(script()))

function Label(props: { label: string }) {
    return (
        <strong style="display:block;user-select:none;margin-bottom:1rem;font-family:sans-serif">
            {props.label}
        </strong>
    )
}

render(
    <div style="display:grid;grid-template-columns:calc(50% - 1rem) calc(50% - 1rem);grid-template-rows:15rem auto;gap:2rem;height:calc(100vh - 4rem)">
        <div style="display:flex;gap:2rem;flex-direction:column">
            <textarea
                className="section"
                style="resize:none;height:5rem;font-size:1rem"
                placeholder="Type a script here..."
                value={script()}
                on:input={(event) => setScript(event.currentTarget.value)}
            />

            <div
                className="section"
                style="font-family:monospace;flex:1;font-size:1rem"
            >
                <Label label="LaTeX" />

                <div
                    use={(el) => {
                        createEffect(() => {
                            const value = parsed()

                            if (value.ok) {
                                el.textContent = printLaTeX(value.value)
                            } else {
                                el.textContent = "Error: " + value.value
                            }
                        })
                    }}
                />
            </div>
        </div>

        <div
            className="section"
            style="display:flex;align-items:center;justify-content:center"
            use={(el) => {
                createEffect(() => {
                    const value = parsed()

                    if (value.ok) {
                        el.innerHTML = (
                            katex as any as typeof katex.default
                        ).renderToString(printLaTeX(value.value), {
                            displayMode: true,
                        })
                    } else {
                        el.textContent = "Error: " + value.value
                    }
                })
            }}
        />

        <pre className="section" style="margin:0;overflow:auto;flex:1">
            <Label label="AST" />

            {() => JSON.stringify(parsed(), undefined, 2)}
        </pre>

        <pre className="section" style="margin:0;overflow:auto;flex:1">
            <Label label="Formatted AST" />

            {() => printAST(parsed().value)}
        </pre>

        <style>
            body {"{"}
            margin: 2rem
            {"}"}
            .section {"{"}
            background-color: #f0f0f0; border:
            0;padding:0.5rem;border-radius:0.25rem
            {"}"}
        </style>
    </div>,
    document.body,
)
