import {
  ScriptValue,
  basic,
  fn,
  local,
  type Value,
  Bval,
  Kind,
} from "./types2.js"

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
  e_pi: new Bval("[2.7, 3.1]", new Kind("float", 2)),
  e_pi_e: new Bval("[2.7, 3.1, 2.7]", new Kind("float", 3)),
  e_pi_e_dynamic: new Bval("[2.7, 3.1, 2.7]", new Kind("float", true)),
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

debug(
  scriptifier.collate(
    "+",
    [
      scriptifier.valueToScript(local("e_pi")),
      scriptifier.valueToScript(local("e_pi_e_dynamic")),
    ],
    ([a, b]) => new ScriptValue(`${a} + ${b}`, new Kind("float")),
  ),
)

// debug(fn("add_then_square", [local("e"), local("pi")]))
// debug(fn("square", [local("pi")]))
// debug(scriptifier.struct({ a: scriptifier.valueToScript(local("pi")) }))
// debug(scriptifier.struct({ a: scriptifier.valueToScript(local("e")) }))
