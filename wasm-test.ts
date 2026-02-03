import { Module } from "./wasm-define"

const wasm = new Module()

wasm.raw.type.push([
    {
        final: true,
        typeuse: [],
        comptype: {
            k: "struct",
            v: [{ mut: false, zt: { null: false, ht: 1 } }],
        },
    },
    {
        final: true,
        typeuse: [],
        comptype: {
            k: "struct",
            v: [{ mut: false, zt: { null: false, ht: 0 } }],
        },
    },
])

await wasm.instantiate()
console.log("done")
