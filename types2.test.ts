import {
  ScriptValue,
  basic,
  fn,
  local,
  type Value,
  Bval,
  Kind,
  bval,
  Bfn,
  Scriptifier,
  NameHasher,
  bind,
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
  square_p_and_add_q: {
    type: "fn",
    args: ["p", "q"],
    value: fn("+", [fn("odot", [local("p"), local("p")]), local("q")]),
  },
  //   sum: new Bfn(function ([val, _]) {
  //     if (!val || _) {
  //       throw new Error("`sum` takes exactly two arguments.")
  //     }

  //     return this.block(val.kind)`${val.kind.toGlsl(this)} sum;
  // for (int i = )`
  //   }),
})

function debug(value: ScriptValue | Value | string) {
  if (!(value instanceof ScriptValue) && typeof value != "string") {
    value = scriptifier.valueToScript(value)
  }

  console.group("DEBUG INFO")
  console.log(scriptifier.fns)
  console.log(scriptifier.structs)
  console.log(scriptifier.blocks)
  console.log(value)
  console.groupEnd()
}

// debug(
//   scriptifier.collate(
//     "+",
//     [
//       scriptifier.valueToScript(local("e_pi")),
//       scriptifier.valueToScript(local("e_pi_e_dynamic")),
//     ],
//     ([a, b]) => ScriptValue.float`${a} + ${b}`,
//   ),
// )

// debug(
//   fn("square_p_and_add_q", [
//     bval("23", new Kind("int")),
//     bval("45.0", new Kind("float")),
//   ]),
// )

// debug(fn("add_then_square", [local("e"), local("pi")]))
// debug(fn("square", [local("pi")]))
// debug(scriptifier.struct({ a: scriptifier.valueToScript(local("pi")) }))
// debug(scriptifier.struct({ a: scriptifier.valueToScript(local("e")) }))

// debug(
//   scriptifier.block(new Kind("float"), {
//     a: scriptifier.valueToScript(bval("23", new Kind("int"))),
//   })`a + 2`,
// )

debug(
  function (this: Scriptifier) {
    const output = NameHasher.random("output")
    const i = ScriptValue.local(NameHasher.random("i"), new Kind("int"))
    return this.block(new Kind("float"))`float ${output} = 0;
for (int ${i} = 0; ${i} < 10; ${i}++) {
  ${output} += ${this.valueToScript(bind("i", i, local("i")))};
}
return ${output};`
  }.call(scriptifier),
)
