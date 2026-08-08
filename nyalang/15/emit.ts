import { assert, unreachable } from "./assert"
import type { RuntimeInst, Type, Value } from "./ir"

interface Block {
    /** Argument types to this block. */
    argTypes: Type[]

    /** Outputs of runtime instructions. */
    output: ({ type: Type; value: string } | null)[]

    body: string
}

function encode(block: Block, type: Type, value: Value): string {
    switch (type.k) {
        case "never":
        case "comptime_int":
        case "comptime_float":
        case "fn":
        case "type":
            unreachable()

        case "void":
        case "null":
            return "null"

        case "bool":
            if (value.k === "runtime") return block.output[value.v]!.value
            assert(value.k === "bool")
            return "" + value.v

        case "u":
        case "i":
            if (value.k === "runtime") return block.output[value.v]!.value
            assert(value.k === "int")
            if (type.v <= 32) return `(${value.v})`
            return `(${value.v}n)`

        case "f":
            if (value.k === "runtime") return block.output[value.v]!.value
            assert(value.k === "float")
            if (type.v === 32) return `Math.fround(${value.v})`
            if (type.v === 64) return `(${value.v})`
            unreachable()

        case "str":
            if (value.k === "runtime") return block.output[value.v]!.value
            assert(value.k === "str")
            return JSON.stringify(value.v)

        case "optional":
            if (value.k === "runtime") return block.output[value.v]!.value
            if (value.k === "null") return "null"
            assert(value.k === "some")
            return `{v:${encode(block, type.v, value.v)}}`

        case "array":
            if (value.k === "runtime") return block.output[value.v]!.value
            if (value.k === "array-u8") return `[${value.v.join(",")}]`
            assert(value.k === "array")
            return `[${value.v.map((x) => encode(block, type.v.child, x)).join(",")}]`

        case "slice":
            if (value.k === "runtime") return block.output[value.v]!.value
            if (value.k === "array-u8") return `[${value.v.join(",")}]`
            assert(value.k === "array")
            return `[${value.v.map((x) => encode(block, type.v, x)).join(",")}]`

        case "tuple":
            if (value.k === "runtime") return block.output[value.v]!.value
            assert(value.k === "array")
            return `[${value.v.map((x, i) => encode(block, type.v[i]!, x)).join(",")}]`

        case "struct": {
            if (value.k === "runtime") return block.output[value.v]!.value
            assert(value.k === "struct")
            assert(type.v.members.k === "analyzed")
            let ret = "{"
            for (const [key, val] of value.v) {
                ret += keyDecl(key) + encode(block, type.v.members.v.get(key)!.type, val) + ","
            }
            return ret + "}"
        }

        case "enum":
            assert(type.v.members.k === "analyzed")
            return encode(block, type.v.backingInt, value)

        case "union": {
            if (value.k === "runtime") return block.output[value.v]!.value
            assert(value.k === "union")
            assert(type.v.members.k === "analyzed")
            return `{k:${JSON.stringify(value.v.k)},v:${encode(block, type.v.members.v.get(value.v.k)!, value.v.v)}}`
        }

        case "opaque":
            assert(value.k === "runtime")
            return block.output[value.v]!.value
    }
}

function keyDecl(key: string): `${string}:` {
    if (/^[A-Za-z0-9_]+$/.test(key)) {
        return `${key}:`
    }
    return `${JSON.stringify(key)}:`
}

function keyAccess(key: string): string {
    if (/^[A-Za-z0-9_]+$/.test(key)) {
        return `.${key}`
    }
    return `[${JSON.stringify(key)}]`
}

function encodeInst(block: Block, { k, v }: RuntimeInst) {
    switch (k) {
        case "arg-load":
            block.output.push({ type: block.argTypes[v]!, value: `__arg` + v })
            break

        case "cf-continue":
        case "cf-if/then":
        case "cf-if/else":
        case "cf-if/end":
        case "cf-return":
        case "cf-unreachable":
        case "const-init":
        case "const-load":
        case "fn-call":
        case "get-field":
        case "get-unwrap":
        case "get-variant":
        case "global-load":
        case "lit":
        case "op-1":
        case "op-2":
        case "print":
        case "slice-from-array":
        case "var-init":
        case "var-load":
    }
}
