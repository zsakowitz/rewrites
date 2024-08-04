import { immediateEffect, memo, onCleanup, signal, untrack } from "./classes.js"

console.group("section 1")

/**
 * - effect is running
 * - 78
 * - effect is running
 * - 56
 * - effect is running
 * - exit early
 */

const [x, setX] = signal(23)
const [exitEarly, setExitEarly] = signal(false)

immediateEffect(() => {
  console.log("effect is running")
  if (exitEarly()) {
    console.log("exit early")
    return
  }
  console.log(x())
})

setX(78)
setX(56)
setExitEarly(true)
setX(48)
setX(98)
setX(90)

console.groupEnd()
console.group("section 2")

/**
 * - setting ''
 * - before setting 23
 * - creating children
 * - after setting 23
 * - setting 45
 * - setting undefined
 * - destroying children
 * - setting ''
 */

type Truthy<T> = Exclude<T & {}, 0 | "" | false | 0n>

function Show<T, U>(
  when: () => T,
  children: (fn: () => Truthy<T>) => U,
): () => U | undefined {
  const getValue = memo(when, undefined, (a, b) => !a === !b)

  return memo(() => {
    const value = getValue()

    if (value) {
      return untrack(() =>
        children(() => {
          let value
          if (!untrack(getValue) || !(value = when())) {
            throw new Error("Invalid access in <Show />")
          }
          return value satisfies NonNullable<T> as Truthy<T>
        }),
      )
    }
  })
}

const [name, setName] = signal<string>()

const shown = Show(name, () => {
  console.log("creating children")
  onCleanup(() => {
    console.log("destroying children")
  })
  return 23
})

// memos do nothing unless they're watched
immediateEffect(() => {
  console.log("reading memo")
  shown()
})

console.log("setting ''")
setName("")
console.log("before setting 23")
setName("23")
console.log("after setting 23")
console.log("setting 45")
setName("45")
console.log("setting undefined")
setName(undefined)
console.log("setting ''")
setName("")
