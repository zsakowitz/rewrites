// An HTML page that shows a demo of the sArCaStIcIfY function.

import { sArCaStIcIfY } from "./sarcastic-text.js"
import { createMemo, createSignal, h, render } from "./solid.js"

const [text, setText] = createSignal("")
const output = createMemo(() => sArCaStIcIfY(text()))

render(
  [
    <textarea on:input={(event) => setText(event.currentTarget.value)} />,
    <textarea readOnly value={output} />,
  ],
  document.body,
)
