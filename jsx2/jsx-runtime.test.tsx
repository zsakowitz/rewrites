/** @jsxRuntime automatic */
/** @jsxImportSource . */

import { memo, signal, untrack } from "./core"
import { render, type JSX } from "./jsx-runtime"

type Truthy<T> = Exclude<T & {}, 0 | "" | false | 0n>

function Show<T, U extends JSX.Element>({
  when,
  children,
}: {
  when(): T
  children: Exclude<U, Function> | ((fn: () => Truthy<T>) => U)
}): () => U | undefined {
  const getValue = memo(when, undefined, (a, b) => !a === !b)

  return memo(() => {
    const value = getValue()

    if (value) {
      return untrack(inner1)
    }
  })

  function inner1() {
    if (typeof children == "function") {
      return children(inner2)
    } else {
      return children
    }
  }

  function inner2() {
    let value
    if (!untrack(getValue) || !(value = when())) {
      throw new Error("Invalid access in <Show />")
    }
    return value satisfies NonNullable<T> as Truthy<T>
  }
}

function Main() {
  console.log("main")
  const [shown, setShown] = signal(false)

  return (
    <div>
      <h1>world</h1>
      <button
        ref={(el) => {
          el.addEventListener("click", () => setShown(true))
        }}
      >
        magic!
      </button>
      <Show when={shown}>look i exist!</Show>
    </div>
  )
}

render(document.body, Main)
