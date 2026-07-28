import { assert, unreachable } from "./assert"
import { Errors, TraceEntry } from "./error"
import type { File } from "./file"
import type { Frac } from "./frac"
import { FLOAT_BIT_SIZES, floatFromFrac, isSafeInt, type FloatBitSize } from "./num"
import type { Expr, Stmt } from "./parse"

const usize: RType = { k: "u", v: 32 }

export type Lazy<Final, Raw> =
    | { resolved: true; value: Final }
    | { resolved: false; value: { context: Context; input: Raw } }

export type RType =
    | { k: "never"; v: null }
    | { k: "void"; v: null }
    | { k: "bool"; v: null }
    | { k: "comptime_int"; v: null }
    | { k: "comptime_frac"; v: null }
    | { k: "u" | "i"; v: number }
    | { k: "f"; v: FloatBitSize }
    | { k: "str"; v: null }
    | { k: "null"; v: null }
    | { k: "optional"; v: RType }
    | { k: "array"; v: { len: number | null; child: RType } }
    | { k: "fn"; v: { args: RType[]; return: RType } }
    | { k: "type"; v: null }
    | {
          k: "struct"
          v: {
              id: number
              name: string
              captures: RValue[]
              fields: Record<string, RType>
              decls: Record<string, RContainerDecl>
          }
      }
    | {
          k: "union"
          v: {
              id: number
              name: string
              captures: RValue[]
              tagType: RType & { k: "i" | "u" | "enum" }
              fields: Record<string, RType>
              decls: Record<string, RContainerDecl>
          }
      }
    | {
          k: "enum"
          v: {
              id: number
              name: string
              captures: RValue[]
              tagType: RType & { k: "i" | "u" }
              fields: Record<string, RValue>
              decls: Record<string, RContainerDecl>
          }
      }

export type RValue =
    | { k: "unreachable"; v: null }
    | { k: "void"; v: null }
    | { k: "bool"; v: boolean }
    | { k: "int"; v: bigint }
    | { k: "float"; v: number }
    | { k: "frac"; v: Frac }
    | { k: "str"; v: string }
    | { k: "null"; v: null }
    | { k: "some"; v: RValue }
    | { k: "array"; v: RValue[] }
    | { k: "fn"; v: Fn }
    | { k: "type"; v: RType }
    | { k: "struct"; v: Record<string, RValue> }
    | { k: "enum"; v: string }
    | { k: "union"; v: { key: string; value: RValue } }
    | { k: "runtime"; v: InstIndex }

export type RContainerDecl =
    | { k: "const"; v: Lazy<RTypedValue, { type: Expr; value: Expr }> }
    | { k: "var"; v: Lazy<RTypedValue, { type: Expr; value: Expr }> }
    | { k: "fn"; v: Fn }

// `.type` and `.value` must match.
//
// `.value.k === "runtime"` is valid for most types, where `.v` describes a runtime value
//
// `.value.k === "error"` is valid for all types, and describes a value
// resulting from a compile error. This lets us continue gathering errors
// for the user, even though codegen is impossible.
export type RTypedValue = { type: RType; value: RValue }

export interface Fn {
    args: { comptime: boolean; name: string; type: Expr }[]
    return: Expr
    exec(block: Block | null /** `null` for comptime */, args: RTypedValue[]): RTypedValue
}

export type Context = Record<string, RTypedValue>

export type InstIndex = number

export type RuntimeInst =
    | { k: "value"; v: RTypedValue }
    | { k: "var-init"; v: RTypedValue }
    | { k: "var-set"; v: RValue }
    | { k: "float-extend"; v: { old: FloatBitSize; new: FloatBitSize; value: InstIndex } }

export class Block {
    body: RuntimeInst[] = []

    constructor(
        readonly errors: Errors,
        public file: File,
        readonly context: Context,
    ) {}

    raiseAt(range: { s: number; e: number }, message: string) {
        this.errors.raise(new TraceEntry(this.file, range.s, range.e, message))
    }
}

export function typeName(type: RType): string {
    switch (type.k) {
        case "never":
        case "void":
        case "bool":
        case "str":
        case "comptime_int":
        case "comptime_frac":
        case "type":
            return type.k

        case "u":
        case "i":
        case "f":
            return type.k + type.v

        case "null":
            return "@TypeOf(null)"

        case "optional":
            return "?" + typeName(type.v)

        case "array":
            return "[" + (type.v.len ?? "") + "]" + typeName(type.v.child)

        case "fn":
            return "fn (" + type.v.args.map(typeName).join(", ") + ") " + typeName(type.v.return)

        case "struct":
        case "union":
        case "enum":
            return type.v.name
    }
}

/**
 * If `null` is returned, a fatal error prevented compilation, and the `null` should be bubbled up
 * through the application.
 *
 * Assumptions:
 *
 * - If `time == "comptime"`, the returned value must is fully known at comptime.
 * - `block.file` is set to the file `expr` is from.
 *
 * Non-assumptions:
 *
 * - The return value is assignable to `type`.
 * - The return value has been coerced into `type`.
 */
export function expr(
    block: Block,
    time: "comptime" | "any",
    type: RType | null,
    v: Expr,
): RTypedValue | null {
    switch (v.k) {
        case "error":
            return null

        case "lit-int": {
            const value = v.v

            if (type?.k === "u") {
                if (value >= 2n ** BigInt(type.v)) {
                    block.raiseAt(
                        v,
                        `Integer type '${typeName(type)}' cannot contain value '${value}'`,
                    )
                    return null
                }

                return { type, value: { k: "int", v: value } }
            }

            if (type?.k === "i") {
                if (type.v === 0 ? value !== 0n : value >= 2n ** BigInt(type.v - 1)) {
                    block.raiseAt(
                        v,
                        `Integer type '${typeName(type)}' cannot contain value '${value}'`,
                    )
                    return null
                }

                return { type, value: { k: "int", v: value } }
            }

            return { type: { k: "comptime_int", v: null }, value: { k: "int", v: value } }
        }

        case "lit-frac": {
            const value = v.v

            if (type?.k === "f") {
                return { type, value: { k: "float", v: floatFromFrac(value) } }
            }

            return { type: { k: "comptime_frac", v: null }, value: { k: "frac", v: value } }
        }

        case "lit-string":
            return {
                type: { k: "str", v: null },
                value: { k: "str", v: v.v },
            }

        case "ty-optional": {
            const child = exprAsType(block, v.v.child)
            if (child === null) return null

            return typeAsValue({ k: "optional", v: child })
        }

        case "ty-array": {
            if (v.v.len === null) {
                const child = exprAsType(block, v.v.child)
                if (child === null) return null

                return typeAsValue({ k: "array", v: { len: null, child } })
            }

            const len = exprAs(block, "comptime", usize, v.v.len)
            if (len === null) return null
            assert(len.value.k === "int")

            const child = exprAsType(block, v.v.child)
            if (child === null) return null

            return typeAsValue({ k: "array", v: { len: Number(len.value.v), child } })
        }

        case "ty-fn":
            break

        case "ns-struct":
            break

        case "ns-enum":
            break

        case "ns-union":
            break

        case "dot-empty":
            break

        case "dot-tuple":
            break

        case "dot-record":
            break

        case "dot-field":
            break

        case "dot-method":
            break

        case "dot-call":
            break

        case "op-prefix":
            break

        case "op-infix":
            break

        case "cf-unreachable":
            break

        case "cf-and":
            break

        case "cf-or":
            break

        case "cf-orelse":
            break

        case "cf-if":
            break

        case "cf-switch":
            break

        case "cf-for":
            break

        case "cf-while":
            break

        case "cf-break":
            break

        case "cf-continue":
            break

        case "cf-return":
            break

        case "cf-comptime":
            return expr(block, "comptime", type, v)

        case "get-prop":
            break

        case "get-method":
            break

        case "get-index":
            break

        case "get-call":
            break

        case "get-unwrap":
            break

        case "block":
            break

        case "builtin":
            return exprBuiltin(block, time, type, v, v.v.name, v.v.args)

        case "ident": {
            if (!v.v.raw) {
                if (/^u\d+$/.test(v.v.name)) {
                    return typeAsValue({ k: "u", v: +v.v.name.slice(1) })
                }
                if (/^i\d+$/.test(v.v.name)) {
                    return typeAsValue({ k: "i", v: +v.v.name.slice(1) })
                }
                if (/^f\d+$/.test(v.v.name)) {
                    for (const size of FLOAT_BIT_SIZES) {
                        if (v.v.name === "f" + size) {
                            return typeAsValue({ k: "f", v: size })
                        }
                    }
                    block.raiseAt(v, `'${v.v.name}' is not a valid floating-point type`)
                }
                if (v.v.name === "false") {
                    return { type: { k: "bool", v: null }, value: { k: "bool", v: false } }
                }
                if (v.v.name === "true") {
                    return { type: { k: "bool", v: null }, value: { k: "bool", v: true } }
                }
                if (v.v.name === "null") {
                    if (type?.k === "optional") {
                        return { type, value: { k: "null", v: null } }
                    }
                    return { type: { k: "null", v: null }, value: { k: "null", v: null } }
                }
                if (
                    v.v.name === "comptime_int"
                    || v.v.name === "comptime_frac"
                    || v.v.name === "bool"
                    || v.v.name === "never"
                    || v.v.name === "type"
                    || v.v.name === "void"
                    || v.v.name === "str"
                ) {
                    return typeAsValue({ k: v.v.name, v: null })
                }
            }
            block.raiseAt(v, "Variables are not implemented yet")
            return null
        }

        case "underscore":
            block.raiseAt(v, "`_` cannot be used as a value")
            return null

        case "closure":
            break

        case "paren":
            return expr(block, time, type, v.v)

        default:
            v satisfies never
    }

    block.raiseAt(v, `Expression type '.${v.k}' not implemented yet`)
    return null
}

/**
 * Coerces a value to have a given type. If the coercion fails, an error is issued and `null` is
 * returned.
 *
 * Assumes `range` comes from `block.file`.
 */
function as(
    block: Block,
    type: RType,
    range: { s: number; e: number },
    value: RTypedValue,
): RTypedValue | null {
    switch (type.k) {
        case "never":
        case "void":
        case "bool":
        case "null":
        case "comptime_int": // TODO
        case "comptime_frac": // TODO
        case "str":
        case "type":
            if (value.type.k === type.k) {
                return value
            }
            break

        case "u":
            if (
                (value.type.k === "comptime_int" || value.type.k === "u" || value.type.k === "i")
                && value.value.k === "int"
            ) {
                if (!isSafeInt("u", type.v, value.value.v)) {
                    block.raiseAt(
                        range,
                        `${value.value.v} is outside of the valid range for '${typeName(type)}'`,
                    )
                    return null
                }
                return { type, value: value.value }
            }

            if (value.type.k === "u" && value.type.v === type.v) {
                return value
            }

            break

        case "i":
            if (
                (value.type.k === "comptime_int" || value.type.k === "u" || value.type.k === "i")
                && value.value.k === "int"
            ) {
                if (!isSafeInt("i", type.v, value.value.v)) {
                    block.raiseAt(
                        range,
                        `${value.value.v} is outside of the valid range for '${typeName(type)}'`,
                    )
                    return null
                }
                return { type, value: value.value }
            }

            if (value.type.k === "i" && value.type.v === type.v) {
                return value
            }

            break

        case "f":
            if (value.type.k === "comptime_frac" && value.value.k === "frac") {
                return {
                    type,
                    value: { k: "float", v: floatFromFrac(value.value.v) },
                }
            }

            if (value.type.k === "f") {
                if (value.type.v === type.v) {
                    return value
                }

                if (value.type.v <= type.v) {
                    if (value.value.k === "float") {
                        return { type, value: value.value }
                    }

                    if (value.value.k === "runtime") {
                        block.body.push({
                            k: "float-extend",
                            v: { old: value.type.v, new: type.v, value: value.value.v },
                        })
                        return {
                            type,
                            value: { k: "runtime", v: block.body.length - 1 },
                        }
                    }

                    unreachable()
                }
            }

            break

        case "optional":
            if (value.type.k === "null") {
                return { type, value: { k: "null", v: null } }
            }
            break

        case "array":
            break

        case "fn":
            break

        case "struct":
            break

        case "union":
            break

        case "enum":
            break
    }

    block.raiseAt(
        range,
        `Expected '${typeName(type)}', but value has type '${typeName(value.type)}'`,
    )
    return null
}

function typeEq(a: RType, b: RType): boolean {
    if (a === b) return true
    if (a.k !== b.k) return false

    switch (a.k) {
        case "never":
        case "void":
        case "bool":
        case "comptime_int":
        case "comptime_frac":
        case "str":
        case "null":
        case "type":
            return true

        case "u":
        case "f":
        case "i":
            return a.v === b.v

        case "optional":
            assert(b.k === "optional")
            return typeEq(a.v, b.v)

        case "array":
            assert(b.k === "array")
            return typeEq(a.v.child, b.v.child) && a.v.len === b.v.len

        case "fn":
            assert(b.k === "fn")
            return (
                typeEq(a.v.return, b.v.return)
                && a.v.args.length === b.v.args.length
                && a.v.args.every((va, i) => typeEq(va, b.v.args[i]!))
            )

        case "struct":
        case "union":
        case "enum":
            assert(b.k === a.k)
            return a.v.id === b.v.id && a.v.captures.every((va, i) => valueEq(va, b.v.captures[i]!))
    }
}

/** Only for comptime-known values. Assumes corresponding types are equal. */
function valueEq(a: RValue, b: RValue): boolean {
    if (a === b) return true
    if (a.k !== b.k) return false

    switch (a.k) {
        case "unreachable":
        case "void":
        case "null":
            return true

        case "bool":
        case "int":
        case "float":
        case "str":
        case "fn":
            return a.v === b.v

        case "frac":
            assert(b.k === "frac")
            return a.v.n === b.v.n && a.v.d === b.v.d

        case "some":
            assert(b.k === "some")
            return valueEq(a.v, b.v)

        case "array":
            assert(b.k === "array")
            return a.v.length === b.v.length && a.v.every((va, i) => valueEq(va, b.v[i]!))

        case "type":
            assert(b.k === "type")
            return typeEq(a.v, b.v)

        case "struct":
            assert(b.k === "struct")
            for (const key in a.v) {
                if (!valueEq(a.v[key]!, b.v[key]!)) {
                    return false
                }
            }
            return true

        case "enum":
            assert(b.k === "enum")
            return a.v === b.v

        case "union":
            assert(b.k === "union")
            return a.v.key === b.v.key && valueEq(a.v.value, b.v.value)

        case "runtime":
            unreachable()
    }
}

function exprAs(block: Block, time: "comptime" | "any", type: RType, v: Expr): RTypedValue | null {
    const value = expr(block, time, type, v)
    if (value === null) return null

    return as(block, type, v, value)
}

function typeAsValue(type: RType): RTypedValue {
    return { type: { k: "type", v: null }, value: { k: "type", v: type } }
}

function exprBuiltin(
    block: Block,
    time: "comptime" | "any",
    type: RType | null,
    v: Expr,
    name: string,
    args: Expr[],
): RTypedValue | null {
    switch (name) {
        // Forces its argument to be evaluated at runtime.
        case "runtime": {
            if (args.length !== 1) {
                block.raiseAt(v, "'@runtime' expects one argument")
                return null
            }

            const value = expr(block, time, type, args[0]!)
            if (value === null) return null

            block.body.push({ k: "value", v: value })
            return { type: value.type, value: { k: "runtime", v: block.body.length - 1 } }
        }

        // Sets the expected type without forcing it to match.
        case "as": {
            if (args.length !== 2) {
                block.raiseAt(v, "'@as' expects two arguments")
                return null
            }

            const type = exprAsType(block, args[0]!)
            if (type === null) return null

            return exprAs(block, time, type, args[1]!)
        }
    }

    block.raiseAt(v, `Builtin '@${name}' not implemented yet`)
    return null
}

function exprAsType(block: Block, v: Expr): RType | null {
    const value = expr(block, "comptime", { k: "type", v: null }, v)
    if (value === null) return null

    if (value.type.k !== "type") {
        block.raiseAt(v, `Expected 'type', found '${typeName(value.type)}'`)
        return null
    }

    assert(value.value.k === "type")
    return value.value.v
}

export function stmt(block: Block, time: "comptime" | "any", v: Stmt): "error" | "never" | "void" {
    if (v.k === "expr") {
        const returnValue = expr(block, time, { k: "void", v: null }, v.v)

        if (returnValue === null) {
            return "error"
        }

        if (returnValue.type.k === "never" || returnValue.value.k === "unreachable") {
            return "never"
        }

        if (returnValue.type.k === "void") {
            return "void"
        }

        block.raiseAt(
            v.v,
            `Values of type '${typeName(returnValue.type)}' cannot be silently ignored; use \`_ = ...\` to explicitly discard the value`,
        )

        return "void"
    }

    block.raiseAt(v, "Statement type not implemented yet")
    return "error"
}
