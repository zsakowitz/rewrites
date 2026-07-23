import { assert } from "./assert"
import { Errors, TraceEntry } from "./ast/error"
import type { File } from "./ast/file"
import type { Expr, Stmt } from "./ast/parse"

export type Lazy<Final, Raw> =
    | { resolved: true; value: Final }
    | { resolved: false; value: { context: Context; input: Raw } }

export type RType =
    | { k: "never"; v: null }
    | { k: "void"; v: null }
    | { k: "bool"; v: null }
    | { k: "comptime_int"; v: null }
    | { k: "comptime_float"; v: null }
    | { k: "comptime_frac"; v: null }
    | { k: "u" | "i"; v: number }
    | { k: "f" | "r"; v: 32 | 64 }
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
    | { k: "frac"; v: { n: bigint; /** positive */ d: bigint } }
    | { k: "str"; v: string }
    | { k: "null"; v: null }
    | { k: "some"; v: RValue }
    | { k: "array"; v: RValue[] }
    | { k: "fn"; v: Fn }
    | { k: "type"; v: RType }
    | { k: "struct"; v: Record<string, RValue> }
    | { k: "enum"; v: string }
    | { k: "union"; v: { key: string; value: RValue } }
    | { k: "runtime"; v: number /* instruction index */ }

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

export type RuntimeInst =
    | { k: "value"; v: RTypedValue }
    | { k: "var-init"; v: RTypedValue }
    | { k: "var-set"; v: RValue }

export class Block {
    body: RuntimeInst[] = []

    constructor(
        readonly errors: Errors,
        public file: File,
        readonly context: Context,
    ) {}

    raiseAt(range: { s: number; e: number }, message: string) {
        this.errors.raise(new TraceEntry(this.file, expr.s, expr.e, message))
    }
}

export function typeName(type: RType): string {
    switch (type.k) {
        case "never":
        case "void":
        case "bool":
        case "str":
        case "comptime_int":
        case "comptime_float":
        case "type":
            return type.k

        case "u":
        case "i":
        case "f":
        case "r":
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
 * @param block Script block. `block.file` must match the file `expr` is from.
 * @param used Whether the return value is used. If `false`, the return `.value` must not be
 *   examined or used, and it may be syntactically invalid.
 * @param type The expected result type, if one exists. The expression does not necessarily need to
 *   evaluate to this type; if the caller requires a specific type, it should check it upon
 *   returning.
 * @returns `null` if there was a compile error preventing evaluation, otherwise the returned value.
 *   If it is not possible to return from this expression, use `.value.k === "unreachable"`.
 */
export function expr(
    block: Block,
    time: "comptime" | "any",
    used: boolean,
    type: RType | null,
    v: Expr,
): RTypedValue | null {
    switch (v.k) {
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

        case "lit-float": {
            const value = v.v

            if (type?.k === "f") {
                return { type, value: { k: "float", v: value } }
            }

            return { type: { k: "comptime_float", v: null }, value: { k: "float", v: value } }
        }

        case "lit-string":
            break

        case "ty-optional": {
            const child = expr(block, "comptime", used, { k: "type", v: null }, v.v.child)
            if (child === null) return null

            if (child.type.k !== "type") {
                block.raiseAt(v.v.child, `Expected type, found '${typeName(child.type)}'.`)
                return null
            }

            assert(child.value.k === "type")

            return {
                type: { k: "type", v: null },
                value: { k: "type", v: { k: "optional", v: child.value.v } },
            }
        }

        case "ty-array":
            break

        case "ty-fn":
            break

        case "ns-struct":
            break

        case "ns-enum":
            break

        case "ns-union":
            break

        case "dot-tuple":
            break

        case "dot-struct":
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
            break

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
            break

        case "ident":
            break

        case "underscore":
            break

        case "closure":
            break
    }

    block.raiseAt(v, "Expression type not implemented yet.")
    return null
}

export function stmt(block: Block, time: "comptime" | "any", type: RType | null, v: Stmt) {
    switch (v.k) {
        case "const":
        case "var":
        case "expr":
        case "assign":
    }

    block.raiseAt(v, "Statement type not implemented yet.")
    return null
}
