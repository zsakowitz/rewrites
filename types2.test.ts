import { ScriptValue, basic, fn, local, type Value } from "./types2.js"

const scriptifier = basic.extend({
  square: {
    type: "fn",
    args: ["a"],
    value: fn("odot", [local("a"), local("a")]),
  },
  add_then_square: {
    type: "fn",
    args: ["a", "b"],
    value: fn("square", [fn("+", [local("a"), local("b")])]),
  },
})

function debug(value: ScriptValue | Value | string) {
  if (!(value instanceof ScriptValue) && typeof value != "string") {
    value = scriptifier.valueToScript(value)
  }

  console.group("DEBUG INFO")
  console.log(scriptifier.fns)
  console.log(scriptifier.structs)
  console.log(value)
  console.groupEnd()
}

debug(fn("add_then_square", [local("e"), local("pi")]))
debug(fn("square", [local("pi")]))
debug(scriptifier.struct({ a: scriptifier.valueToScript(local("pi")) }))
debug(scriptifier.struct({ a: scriptifier.valueToScript(local("e")) }))
