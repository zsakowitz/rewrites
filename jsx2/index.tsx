/** @jsxImportSource . */

import { effect, memo, signal } from "./core"
import { render } from "./jsx-runtime"

function Main() {
  const [data, setData] = signal("23")
  return (
    <div>
      <h1>hello</h1>
      <div>{data()}</div>
      <input onInput={(e) => setData(e.currentTarget.value)} />
    </div>
  )
}

render(document.body, () => <Main />)
