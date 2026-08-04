import { blue, cyan, dim, green, reset, yellow } from "../2/ansi"
import { assert } from "./assert"
import { Error, Errors } from "./error"
import { typeName } from "./ir"

export function debug(value: unknown, key?: string): string {
    if (!Array.isArray(value) && ["returnType", "runtimeArgTypes"].includes(key!)) {
        return blue + typeName(value as any) + reset
    }

    if (value instanceof Uint8Array) {
        return `0x[${value.toHex()}]`
    }

    if (value instanceof Map) {
        if (value.size === 0) {
            return `{}`
        }

        let ret = "{"
        for (const [k, v] of value) {
            ret += `\n    ${debug(k)} => ${debug(v).replaceAll("\n", "\n    ")},`
        }
        ret += "\n}"
        return ret
    }

    if (value instanceof Error) {
        return value
            .toString()
            .split("\n")
            .map((x) => dim + "\\\\" + reset + x.toString())
            .join("\n")
    }

    if (value instanceof Errors) {
        return "Errors " + reset + debug(value.errors)
    }

    if (typeof value === "boolean" || typeof value === "number" || value === null) {
        return yellow + value + reset
    }

    if (typeof value === "bigint") {
        return yellow + value + "n" + reset
    }

    if (typeof value === "string") {
        return green + JSON.stringify(value) + reset
    }

    if (typeof value === "symbol") {
        return blue + "Symbol(" + value.description + ")" + reset
    }

    if (typeof value === "undefined") {
        return dim + "undefined" + reset
    }

    if (Array.isArray(value)) {
        if (value.length === 0) return "[]"

        const subvalues = value.map((x) => debug(x, key))

        const flat =
            Bun.stringWidth(subvalues.join(", ")) < 40
            && value.every((x) => typeof x !== "object" || x === null)

        if (flat) {
            return "[ " + subvalues.join(", ") + " ]"
        }

        return (
            "["
            + subvalues.map((x) => "\n    " + x.replaceAll("\n", "\n    ") + ",").join("")
            + "\n]"
        )
    }

    if (typeof value !== "object") {
        return "<unknown>"
    }

    if ("type" in value && "value" in value && Object.keys(value).length === 2) {
        return `@as(${blue}${typeName(value.type as any)}${reset}, ${debug(value.value)})`
    }

    assert(typeof value === "object" && value !== null)

    if (
        "s" in value
        && typeof value.s === "number"
        && "e" in value
        && typeof value.e === "number"
    ) {
        let s, e
        ;({ s, e, ...value } = value)
    }

    assert(typeof value === "object" && value !== null)

    if ("ns" in value) {
        let ns
        ;({ ns, ...value } = value)
    }

    assert(typeof value === "object" && value !== null)

    if (
        "n" in value
        && typeof value.n === "number"
        && "k" in value
        && typeof value.k === "string"
        && "v" in value
        && Object.keys(value).length === 3
    ) {
        return `${yellow}%${value.n}${reset} := ${cyan}.${value.k.replace(/-/g, "_")}${reset} ${debug(value.v)}`
    }

    if (
        "k" in value
        && typeof value.k === "string"
        && "v" in value
        && Object.keys(value).length === 2
    ) {
        if (value.k === "runtime" && typeof value.v == "number") {
            return `${yellow}%${value.v}${reset}`
        }

        if (value.k === "type" && typeof value.v == "object") {
            return `${cyan}.type${reset} ${typeName(value.v as any)}`
        }

        return `${cyan}.${value.k.replace(/-/g, "_")}${reset} ${debug(value.v)}`
    }

    const subvalues = Object.entries(value).map(
        ([k, v]) =>
            "."
            + k.replace(/-/g, "_").replace(/[A-Z]/g, (x) => "_" + x.toLowerCase())
            + " = "
            + debug(v, k),
    )

    const flat = Bun.stringWidth(subvalues.join(", ")) < 40

    if (flat) {
        return "{ " + subvalues.join(", ") + " }"
    }

    return (
        "{" + subvalues.map((x) => "\n    " + x.replaceAll("\n", "\n    ") + ",").join("") + "\n}"
    )
}

export function print(value: unknown) {
    console.log(debug(value))
}
