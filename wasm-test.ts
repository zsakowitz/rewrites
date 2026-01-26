import { Module } from "./wasm-define"

const wasm = new Module()

wasm["~raw"].global.push({
    gt: { mut: false, type: "i32" },
    e: [{ k: "i32_const", v: 23 }],
})

wasm["~raw"].global.push({
    gt: { mut: false, type: "i32" },
    e: [
        { k: "global_get", v: 0 },
        { k: "i32_const", v: 4 },
        { k: "i32_add", v: null },
    ],
})

await wasm.instantiate()
