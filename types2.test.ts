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

function debug(value: ScriptValue | Value) {
  if (!(value instanceof ScriptValue)) {
    value = scriptifier.valueToScript(value)
  }

  console.log(scriptifier.fns)
  console.log(value)
}

debug(fn("add_then_square", [local("e"), local("pi")]))
debug(fn("square", [local("pi")]))
