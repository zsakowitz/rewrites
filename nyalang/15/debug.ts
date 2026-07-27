import { blue, cyan, dim, green, reset, yellow } from "../2/ansi"
import { assert } from "./assert"

export function debug(value: unknown): string {
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

        const subvalues = value.map(debug)

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

    if (
        "s" in value
        && typeof value.s === "number"
        && "e" in value
        && typeof value.e === "number"
        && "k" in value
        && typeof value.k === "string"
        && "v" in value
        && Object.keys(value).length === 4
    ) {
        return `${cyan}.${value.k}${reset} ${debug(value.v)}`
    }

    if ("s" in value && "e" in value) {
        let s, e
        ;({ s, e, ...value } = value)
    }

    assert(typeof value === "object" && value !== null)

    if (Object.keys(value).length === 0) return "[]"

    const subvalues = Object.entries(value).map(([k, v]) => "." + k + " = " + debug(v))

    const flat =
        Bun.stringWidth(subvalues.join(", ")) < 40
        && Object.values(value).every((x) => typeof x !== "object" || x === null)

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
