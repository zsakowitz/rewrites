import { assert, unreachable } from "./assert"
import { Errors, TraceEntry } from "./error"
import type { File } from "./file"
import { FLOAT_BIT_SIZES, intIsSafe, type FloatBitSize } from "./num"
import type { Expr, Range, Stmt } from "./parse"

const usize: RType = { k: "u", v: 32 }

export type Lazy<Final, Raw> =
    | { resolved: true; value: Final }
    | { resolved: false; value: { context: Names; input: Raw } }

export type RType =
    | { k: "never"; v: null }
    | { k: "void"; v: null }
    | { k: "bool"; v: null }
    | { k: "comptime_int"; v: null }
    | { k: "comptime_float"; v: null }
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
              fields: Record<string, bigint>
              decls: Record<string, RContainerDecl>
          }
      }

export type RValue =
    | { k: "unreachable"; v: null }
    | { k: "void"; v: null }
    | { k: "bool"; v: boolean }
    | { k: "int"; v: bigint }
    | { k: "float"; v: number }
    | { k: "str"; v: string }
    | { k: "null"; v: null }
    | { k: "some"; v: RValue }
    | { k: "array"; v: RValue[] }
    | { k: "fn"; v: Fn }
    | { k: "type"; v: RType }
    | { k: "struct"; v: Record<string, RValue> }
    | { k: "enum"; v: string }
    | { k: "union"; v: { key: string; value: RValue } }
    | { k: "runtime"; v: RII }

export type RContainerDecl =
    | { k: "const"; v: Lazy<RTypedValue, { type: Expr; value: Expr }> }
    | { k: "var"; v: Lazy<RTypedValue, { type: Expr; value: Expr }> }
    | { k: "fn"; v: Fn }

// Validity:
//
// - `.value.k == "unreachable"` is valid for all types
// - `.value.k == "runtime"` is valid for runtime values (i.e. excludes `type`, `?type`, etc.) (this is not defined specifically because this is not a specification)
// - in general, the `value.k` and `type.k` must match, although this does not necessarily mean their string values are directly equal. for instance, for `type.k == "optional"`, `value.k == "null"` and `value.k == "some"` are both valid
export type RTypedValue = { type: RType; value: RValue }

export interface Fn {
    names: Names
    args: { comptime: boolean; name: string; type: Expr }[]
    return: Expr
    exec(block: Block | null /** `null` for comptime */, args: RTypedValue[]): RTypedValue
}

export type Names = Record<string, Name>

export type Name =
    // Constant which can be captured by other declarations.
    | { k: "comptime-const"; v: RTypedValue }

    // Function.
    | { k: "fn"; v: Fn }

    // Constant or variable which is local to some block.
    | { k: "const" | "var"; v: { n: RII; type: RType } }

    // A name which is used in an earlier scope but which can no longer be
    // accessed.
    //
    // Example: `var a; _ = struct { var a; }` errors because the `var a`
    // declaration in the struct shadows the outer `a`, but the inner struct
    // can't access the value of the outer `a`.
    | { k: "reserved"; v: null }

/** Runtime instruction index. Used to reference outputs of runtime instructions. */
type RII = number & { __rii: never }

const nextRII = (() => {
    let next = 0
    return () => next++ as RII
})()

type RuntimeInst =
    | { n: RII; k: "lit"; v: RTypedValue }
    | { n: RII; k: "cf-if"; v: { cond: RII; if: RuntimeBlock; else: RuntimeBlock } }
    | { n: RII; k: "cf-unreachable"; v: null }
    | { n: RII; k: "get-unwrap"; v: RII }
    | { n: RII; k: "var-init"; v: RTypedValue }

// For `if`, `else`, `while`, etc.
interface RuntimeBlock {
    body: RuntimeInst[]
    value: RTypedValue
}

export class Block {
    /**
     * Contains all instructions with potential side effects, including `unreachable`, control flow,
     * and extern functions.
     */
    body: RuntimeInst[] = []

    constructor(
        readonly errors: Errors,
        public file: File,
        readonly names: Names,
    ) {}

    /** Forks this block into another one with a separate `.body` array. */
    fork() {
        return new Block(this.errors, this.file, this.names)
    }

    raiseAt(range: Range, message: string) {
        this.errors.raise(new TraceEntry(this.file, range.s, range.e, message))
    }

    todo(range: Range) {
        const source = new Error().stack?.split("\n")[2]

        this.raiseAt(range, "not implemented yet (" + source?.slice(source.indexOf("(") + 49))
    }

    push<K extends RuntimeInst["k"]>(k: K, v: Extract<RuntimeInst, { k: K }>["v"]): RII {
        const rii = nextRII()
        this.body.push({ n: rii, k, v } as RuntimeInst)
        return rii
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

const VOID: RTypedValue = { type: { k: "void", v: null }, value: { k: "void", v: null } }

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

        case "lit-void":
            return VOID

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

        case "lit-str":
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

        case "ty-fn": {
            const args: RType[] = []
            for (const arg of v.v.args) {
                const type = exprAsType(block, arg)
                if (type === null) return null

                args.push(type)
            }

            const ret = exprAsType(block, v.v.ret)
            if (ret === null) return null

            return typeAsValue({ k: "fn", v: { args, return: ret } })
        }

        case "ns-struct":
            break

        case "ns-enum":
            break

        case "ns-union":
            break

        case "dot-empty": {
            if (type?.k === "array") {
                if (type.v.len === null || type.v.len === 0) {
                    return { type, value: { k: "array", v: [] } }
                }
                block.raiseAt(v, `Expected ${type.v.len} elements, but got 0`)
            }

            block.todo(v)
            return null
        }

        case "dot-tuple": {
            if (type?.k === "array") {
                if (type.v.len === null || type.v.len === v.v.value.length) {
                    const ret: RValue[] = []
                    for (const el of v.v.value) {
                        const subval = expr(block, time, type.v.child, el)
                        if (subval === null) return null
                        ret.push(subval.value)
                    }
                    return { type, value: { k: "array", v: ret } }
                }
                block.raiseAt(v, `Expected ${type.v.len} elements, but got ${v.v.value.length}`)
            }

            block.todo(v)
            return null
        }

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
            if (time === "comptime") {
                block.raiseAt(v, "Encountered 'unreachable' at comptime")
                return null
            }

            block.push("cf-unreachable", null)
            return unreachableOf(type)

        case "cf-and":
            break

        case "cf-or":
            break

        case "cf-orelse":
            break

        case "cf-if": {
            if (v.v.capture) {
                block.todo(v.v.capture)
                return null
            }

            const cond = exprAs(block, time, { k: "bool", v: null }, v.v.cond)
            if (cond === null) return null
            if (cond.value.k === "unreachable") return unreachableOf(type)

            if (cond.value.k === "bool") {
                if (cond.value.v) {
                    return expr(block, time, type, v.v.if)
                } else {
                    return v.v.else ? expr(block, time, type, v.v.else) : VOID
                }
            }

            assert(cond.value.k === "runtime")

            const blockIf = block.fork()
            const blockElse = block.fork()

            const valueIf = expr(blockIf, time, type, v.v.if)
            const valueElse = v.v.else ? expr(blockElse, time, type, v.v.else) : VOID
            if (valueIf === null || valueElse === null) return null

            const joined = join(block, v, valueIf, valueElse)
            if (joined === null) return null

            const rii = block.push("cf-if", {
                cond: cond.value.v,
                if: { body: blockIf.body, value: joined[0] },
                else: { body: blockElse.body, value: joined[1] },
            })

            return { type: joined[0].type, value: { k: "runtime", v: rii } }
        }

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
            return expr(block, "comptime", type, v.v)

        case "get-prop":
            break

        case "get-method":
            break

        case "get-index":
            break

        case "get-call":
            break

        case "get-unwrap": {
            const target = expr(block, time, type ? { k: "optional", v: type } : null, v.v.target)
            if (target === null) return null

            if (target.type.k !== "optional") {
                block.raiseAt(v.v.target, "Expected optional value")
                return null
            }

            if (target.value.k === "null") {
                block.raiseAt(v.v.target, "Cannot unwrap 'null'")
                return null
            }

            if (target.value.k === "some") {
                return { type: target.type.v, value: target.value.v }
            }

            if (target.value.k === "unreachable") {
                return { type: target.type.v, value: { k: "unreachable", v: null } }
            }

            assert(target.value.k === "runtime")

            return {
                type: target.type.v,
                value: { k: "runtime", v: block.push("get-unwrap", target.value.v) },
            }
        }

        case "block": {
            // TODO labeled blocks

            const innerBlock = new Block(
                block.errors,
                block.file,
                Object.assign(Object.create(null), block.names),
            )

            for (const el of v.v.body) {
                const rv = stmt(innerBlock, time, el)
                if (rv === "error") return null
                if (rv === "never") return unreachableOf(type)
            }

            block.body.push(...innerBlock.body)

            return VOID
        }

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
                    return null
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
                    || v.v.name === "comptime_float"
                    || v.v.name === "bool"
                    || v.v.name === "never"
                    || v.v.name === "type"
                    || v.v.name === "void"
                    || v.v.name === "str"
                ) {
                    return typeAsValue({ k: v.v.name, v: null })
                }
            }

            if (!(v.v.name in block.names)) {
                block.raiseAt(v, `'${v.v.name}' is not defined in this scope`)
                return null
            }

            const value = block.names[v.v.name]!
            switch (value.k) {
                case "reserved":
                    block.raiseAt(v, `'${v.v.name}' is not accessible from this scope`)
                    return null

                case "comptime-const":
                    return value.v

                case "fn":
                case "const":
                case "var":
                    block.todo(v)
                    return null
            }
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

    block.todo(v)
    return null
}

export function unreachableOf(type: RType | null): RTypedValue {
    return { type: type ?? { k: "never", v: null }, value: { k: "unreachable", v: null } }
}

// Properties of the typesystem. "is equivalent to" denotes that either both
// segments result in an error, or both result in identically-functioning code.
//
// These properties encode that values and types form a kind of partial
// semilattice.
//
// - `@as(C, @as(B, a))` is equivalent to `@as(C, a)`.
// - `%%join%%(a, b)` is equivalent to `@as(@TypeOf(%%join%%(a, b)), a)` and `@as(@TypeOf(%%join%%(a, b)), b)`.
// - `@as(@TypeOf(a), a)` is equivalent to `a`.
//
// Note that `%%join%%` denotes the internal partial operator which finds a
// common supertype of two values. It does not always succeed, even if some type
// exists which both values coerce to. In the future, our goal is that it always
// finds the common supertype when it exists, but this is a prototype compiler,
// so it does not matter enough.

/**
 * Coerces a value to have a given type. If the coercion fails, an error is issued and `null` is
 * returned.
 *
 * Assumes `range` comes from `block.file`.
 */
function as(block: Block, type: RType, range: Range, value: RTypedValue): RTypedValue | null {
    if (value.value.k === "unreachable") {
        return unreachableOf(type)
    }

    switch (type.k) {
        case "never":
        case "void":
        case "bool":
        case "null":
        case "comptime_int": // TODO
        case "comptime_float": // TODO
        case "str":
        case "type":
            if (value.type.k === type.k) return value
            break

        case "u":
            if (
                (value.type.k === "comptime_int" || value.type.k === "u" || value.type.k === "i")
                && value.value.k === "int"
            ) {
                if (!intIsSafe("u", type.v, value.value.v)) {
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
                if (!intIsSafe("i", type.v, value.value.v)) {
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
            if (value.type.k === "comptime_float" && value.value.k === "float") {
                return {
                    type,
                    value: { k: "float", v: value.value.v },
                }
            }

            if (value.type.k === "f" && value.type.v === type.v) {
                return value
            }

            break

        case "optional":
            if (value.type.k === "null") {
                return { type, value: { k: "null", v: null } }
            }

            if (value.type.k !== "optional") {
                const valueAsChild = as(block, type.v, range, value)
                if (valueAsChild === null) return null

                return { type, value: { k: "some", v: valueAsChild.value } }
            }

            const depthTarget = countOptionalNestingDepth(type)
            const depthSource = countOptionalNestingDepth(value.type)

            // e.g. coercing ?i32 into ?i32
            if (depthTarget === depthSource) {
                if (!typeEq(type, value.type)) {
                    break
                }
                return value
            }

            // e.g. coercing ?i32 into ???i32
            if (depthTarget > depthSource) {
                let targetUnwrapped: RType = type
                for (let i = 0; i < depthTarget - depthSource; i++) {
                    assert(targetUnwrapped.k === "optional")
                    targetUnwrapped = targetUnwrapped.v
                }

                const inner = as(block, targetUnwrapped, range, value)
                if (inner === null) return null

                let retval = inner.value
                for (let i = 0; i < depthTarget - depthSource; i++) {
                    retval = { k: "some", v: retval }
                }

                return { type, value: retval }
            }

            break

        case "array":
        case "fn":
        case "struct":
        case "union":
        case "enum":
            if (!typeEq(type, value.type)) {
                break
            }
            return value
    }

    block.raiseAt(
        range,
        `Expected '${typeName(type)}', but value has type '${typeName(value.type)}'`,
    )
    return null
}

/**
 * Coerces two values into a common supertype, or returns `null` if this is not possible.
 *
 * This operates on values instead of types because values of `comptime_int` can coerce into
 * different `uN` and `iN` types depending on their exact values.
 *
 * The `block` will not have any new runtime instructions appended. It is used exclusively for error
 * reporting.
 */
function join(
    block: Block,
    range: Range,
    a: RTypedValue,
    b: RTypedValue,
): [RTypedValue, RTypedValue] | null {
    // never
    if (a.type.k === "never") return [unreachableOf(b.type), b]
    if (b.type.k === "never") return [a, unreachableOf(a.type)]

    // null
    if (a.type.k === "null") {
        if (b.type.k === "optional") return [{ type: b.type, value: { k: "null", v: null } }, b]
        if (b.type.k === "null") return [a, b]

        const type: RType = { k: "optional", v: b.type }
        return [
            { type, value: { k: "null", v: null } },
            { type, value: { k: "some", v: b.value } },
        ]
    }
    if (b.type.k === "null") {
        if (a.type.k === "optional") return [a, { type: a.type, value: { k: "null", v: null } }]

        const type: RType = { k: "optional", v: a.type }
        return [
            { type, value: { k: "some", v: a.value } },
            { type, value: { k: "null", v: null } },
        ]
    }

    if (!typeEq(a.type, b.type)) {
        block.raiseAt(
            range,
            `Unable to unify types '${typeName(a.type)}' and '${typeName(b.type)}'. Use '@as' to specify an explicit supertype if the compiler cannot detect it.`,
        )
        return null
    }

    return [a, b]
}

function countOptionalNestingDepth(type: RType): number {
    let count = 0

    while (type.k === "optional") {
        type = type.v
        count++
    }

    return count
}

function typeEq(a: RType, b: RType): boolean {
    if (a === b) return true
    if (a.k !== b.k) return false

    switch (a.k) {
        case "never":
        case "void":
        case "bool":
        case "comptime_int":
        case "comptime_float":
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
        case "as": {
            if (args.length !== 2) {
                block.raiseAt(v, "'@as' expects two arguments")
                return null
            }

            const type = exprAsType(block, args[0]!)
            if (type === null) return null

            return exprAs(block, time, type, args[1]!)
        }

        case "compileError": {
            if (args.length !== 1) {
                block.raiseAt(v, "'@compileError' expects one argument")
                return null
            }

            const message = exprAs(block, "comptime", { k: "str", v: null }, v)
            if (message === null) return null

            assert(message.value.k === "str")
            block.raiseAt(v, message.value.v)
            return null
        }

        case "runtime": {
            if (time == "comptime") {
                block.raiseAt(v, "'@runtime' cannot be called from comptime")
                return null
            }

            if (args.length !== 1) {
                block.raiseAt(v, "'@runtime' expects one argument")
                return null
            }

            const value = expr(block, "any", type, args[0]!)
            if (value === null) return null

            return {
                type: value.type,
                value: { k: "runtime", v: block.push("lit", value) },
            }
        }

        case "TypeOf": {
            if (args.length !== 1) {
                block.raiseAt(v, "'@TypeOf' expects one argument")
                return null
            }

            const value = expr(block, time, type, args[0]!)
            if (value === null) return null

            return typeAsValue(value.type)
        }

        // todo remove
        case "join0":
        case "join1": {
            if (args.length !== 2) {
                block.raiseAt(v, "'@joinN' expects two arguments")
                return null
            }

            const v0 = expr(block, time, type, args[0]!)
            if (v0 === null) return null

            const v1 = expr(block, time, type, args[1]!)
            if (v1 === null) return null

            const joined = join(block, v, v0, v1)
            if (joined === null) return null

            return name === "join0" ? joined[0] : joined[1]
        }
    }

    block.todo(v)
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

    const { lhs: lhsRaw, rhs: rhsRaw } = v.v
    if (lhsRaw.length !== 1) {
        block.raiseAt(v, "Only one left-hand-side is supported on assignments for now.")
        return "error"
    }

    const lhs = lhsRaw[0]!
    if (lhs.k === "expr") {
        if (lhs.v.k === "underscore") {
            const rhs = expr(block, time, null, rhsRaw)
            if (rhs === null) return "error"
            if (rhs.type.k === "never" || rhs.value.k === "unreachable") return "never"
            return "void"
        }

        block.raiseAt(v, "TODO: Only `_` can be assigned to")
        return "error"
    }

    if (!lhs.v.name.raw && isReservedIdent(lhs.v.name.name)) {
        block.raiseAt(lhs.v.name, "Identifier shadows a builtin")
        return "error"
    }
    if (lhs.v.name.name in block.names) {
        block.raiseAt(lhs.v.name, "Identifier shadows another declaration")
        return "error"
    }

    if (lhs.k === "comptime-const") time = "comptime"

    let value
    if (lhs.v.type) {
        const expectedType = exprAsType(block, lhs.v.type)
        if (expectedType === null) return "error"

        value = exprAs(block, time, expectedType, rhsRaw)
    } else {
        value = expr(block, time, null, rhsRaw)
    }
    if (value === null) return "error"

    if (lhs.k === "comptime-const") {
        block.names[lhs.v.name.name] = { k: "comptime-const", v: value }
    } else {
        block.names[lhs.v.name.name] = {
            k: lhs.k,
            v: {
                n: block.push("var-init", value),
                type: value.type,
            },
        }
    }

    return "void"
}

const RESERVED =
    /^(?:comptime_int|comptime_float|bool|never|type|void|str|true|false|null|[uif]\d+)$/

function isReservedIdent(name: string) {
    return RESERVED.test(name)
}
