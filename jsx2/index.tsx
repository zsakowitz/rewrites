/** @jsxImportSource . */

import { signal } from "./core"
import { render } from "./jsx-runtime"
import { Suspense } from "./suspense"

async function AsyncComponent() {
  await new Promise((r) => setTimeout(r, 4000))
  return "now it's here hi"
}

function Main() {
  const [data, setData] = signal("23")
  return (
    <div>
      <h1>hello</h1>
      <div>{data()}</div>
      <input onInput={(e) => setData(e.currentTarget.value)} />
      <Suspense fallback="this should be instantly" name="the small one">
        good morning
      </Suspense>
      <Suspense fallback="this should take a moment" name="the big one">
        <AsyncComponent />
      </Suspense>
    </div>
  )
}

render(document.body, () => <Main />)
