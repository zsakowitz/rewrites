import { assert, unreachable } from "./assert"
import { Errors, TraceEntry } from "./error"
import type { File } from "./file"
import * as identCaptures from "./ident"
import { isReservedIdent } from "./ident"
import { FLOAT_BIT_SIZES, intIsSafe, type FloatBitSize } from "./num"
import type { Decl, Expr, Range, Stmt } from "./parse"

const usize: RType = { k: "u", v: 32 }

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
              captures: RTypedValue[]
              fields: Record<string, { type: RType; default: RTypedValue | null }>
              decls: Record<string, RContainerDecl>
          }
      }
    | {
          k: "union"
          v: {
              id: number
              name: string
              captures: RTypedValue[]
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
              captures: RTypedValue[]
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

// TODO: var
export type RContainerDecl = { k: "const"; v: RTypedValue } | { k: "fn"; v: Fn }

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

export interface Label {
    n: RII
    break: RType | null | false // null = no expected type; false = no break allowed
    continue: RType | null | false // null = no expected type; false = no break allowed
}

export type Labels = Record<string, Label>

export type ReturnType = RType | null | false // null = no expected type; false = no break allowed

/** Runtime instruction index. Used to reference outputs of runtime instructions. */
type RII = number & { __rii: never }

const nextRII = (() => {
    let next = 0
    return () => next++ as RII
})()

type RuntimeInst =
    | { n: RII; k: "lit"; v: RTypedValue }
    | { n: RII; k: "cf-if"; v: { cond: RII; type: RType; if: RuntimeBlock; else: RuntimeBlock } }
    | { n: RII; k: "cf-maybe"; v: RuntimeBlock }
    | { n: RII; k: "cf-unreachable"; v: null }
    | { n: RII; k: "cf-block"; v: { type: RType; body: RuntimeBlock } }
    | { n: RII; k: "get-unwrap"; v: RII }
    | { n: RII; k: "var-init"; v: RTypedValue }
    | { n: RII; k: "var-store"; v: { target: RII; value: RTypedValue } }
    | { n: RII; k: "var-load"; v: RII }
    | { n: RII; k: "side-effect"; v: null }

type RuntimeCompletion = Exclude<Result<RTypedValue>, { k: "error" }>

// For `if`, `else`, `while`, etc.
interface RuntimeBlock {
    body: RuntimeInst[]
    value: RuntimeCompletion
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
        readonly labels: Labels,
        readonly implicitLabel: string | null,
        readonly returnType: ReturnType,
    ) {}

    forkForConditional(): Block {
        return new Block(this.errors, this.file, this.names, this.labels, null, this.returnType)
    }

    forkForNamespace(): Block {
        const names: Names = Object.create(null)
        for (const key in this.names) {
            const name = this.names[key]!
            names[key] =
                name.k === "comptime-const" || name.k === "fn" ? name : { k: "reserved", v: null }
        }

        return new Block(this.errors, this.file, names, Object.create(null), null, false)
    }

    completeWith(value: RuntimeCompletion): RuntimeBlock {
        return { body: this.body, value }
    }

    raiseAt(range: Range, message: string) {
        this.errors.raise(new TraceEntry(this.file, range.s, range.e, message))
    }

    todo(range: Range, message?: string) {
        const source = new Error().stack?.split("\n")[2]

        this.raiseAt(
            range,
            `not implemented yet${message ? " (" + message + ")" : ""} (`
                + source?.slice(source.indexOf("(") + 49),
        )
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

export type Result<T> =
    | ResultPlain<T>
    | { k: "break"; v: { n: RII; value: RTypedValue } }
    | { k: "continue"; v: { n: RII; value: RTypedValue } }
    | { k: "unreachable"; v: null }

export type ResultPlain<T> = { k: "normal"; v: T } | { k: "error"; v: null }

function normal(value: RTypedValue): RuntimeCompletion & ResultPlain<RTypedValue>
function normal<T>(value: T): ResultPlain<T>
function normal<T>(value: T): ResultPlain<T> {
    return { k: "normal", v: value }
}

/**
 * If `type` is passed, the return value will eventually be coerced into that type, without
 * exceptions. There is no case where an expected type is present but other types are accepted.
 *
 * Assumptions:
 *
 * - If `time == "comptime"`, the returned value is fully known at comptime.
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
): Result<RTypedValue> {
    switch (v.k) {
        case "error":
            return ERROR

        case "lit-void":
            return normal(VOID)

        case "lit-int": {
            const value = v.v

            if (type?.k === "u") {
                if (value >= 2n ** BigInt(type.v)) {
                    block.raiseAt(
                        v,
                        `Integer type '${typeName(type)}' cannot contain value '${value}'`,
                    )
                    return ERROR
                }

                return normal({ type, value: { k: "int", v: value } })
            }

            if (type?.k === "i") {
                if (type.v === 0 ? value !== 0n : value >= 2n ** BigInt(type.v - 1)) {
                    block.raiseAt(
                        v,
                        `Integer type '${typeName(type)}' cannot contain value '${value}'`,
                    )
                    return ERROR
                }

                return normal({ type, value: { k: "int", v: value } })
            }

            return normal({ type: { k: "comptime_int", v: null }, value: { k: "int", v: value } })
        }

        case "lit-float": {
            const value = v.v

            if (type?.k === "f") {
                return normal({ type, value: { k: "float", v: value } })
            }

            return normal({
                type: { k: "comptime_float", v: null },
                value: { k: "float", v: value },
            })
        }

        case "lit-str":
            return normal({
                type: { k: "str", v: null },
                value: { k: "str", v: v.v },
            })

        case "ty-optional": {
            const child = exprAsType(block, v.v.child)
            if (child.k !== "normal") return child

            return resultFromType({ k: "optional", v: child.v })
        }

        case "ty-array": {
            if (v.v.len === null) {
                const child = exprAsType(block, v.v.child)
                if (child.k !== "normal") return child

                return resultFromType({ k: "array", v: { len: null, child: child.v } })
            }

            const len = exprAs(block, "comptime", usize, v.v.len)
            if (len.k !== "normal") return len
            assert(len.v.value.k === "int")

            const child = exprAsType(block, v.v.child)
            if (child.k !== "normal") return child

            return resultFromType({ k: "array", v: { len: Number(len.v.value.v), child: child.v } })
        }

        case "ty-fn": {
            const args: RType[] = []
            for (const arg of v.v.args) {
                const type = exprAsType(block, arg)
                if (type.k !== "normal") return type

                args.push(type.v)
            }

            const ret = exprAsType(block, v.v.ret)
            if (ret.k !== "normal") return ret

            return resultFromType({ k: "fn", v: { args, return: ret.v } })
        }

        case "ns-struct": {
            if (v.v.extern) {
                block.todo(v)
                return ERROR
            }

            const type = nsStruct(block, v, v.v.id, v.v.child)
            if (type === null) return ERROR

            return resultFromType(type)
        }

        case "ns-enum":
            break

        case "ns-union":
            break

        case "dot-empty": {
            if (type?.k === "array") {
                if (type.v.len === null || type.v.len === 0) {
                    return normal({ type, value: { k: "array", v: [] } })
                }
                block.raiseAt(v, `Expected ${type.v.len} elements, but got 0`)
            }

            block.todo(v)
            return ERROR
        }

        case "dot-tuple": {
            if (type?.k === "array") {
                if (type.v.len === null || type.v.len === v.v.value.length) {
                    const ret: RValue[] = []
                    for (const el of v.v.value) {
                        const subval = expr(block, time, type.v.child, el)
                        if (subval.k !== "normal") return subval
                        ret.push(subval.v.value)
                    }
                    return normal({ type, value: { k: "array", v: ret } })
                }
                block.raiseAt(v, `Expected ${type.v.len} elements, but got ${v.v.value.length}`)
            }

            block.todo(v)
            return ERROR
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
                return ERROR
            }

            block.push("cf-unreachable", null)
            return UNREACHABLE

        case "cf-and":
            break

        case "cf-or":
            break

        case "cf-orelse":
            break

        case "cf-if": {
            break
            // if (v.v.capture) {
            //     block.todo(v.v.capture)
            //     return ERROR
            // }
            // const cond = exprAs(block, time, { k: "bool", v: null }, v.v.cond)
            // if (cond.k !== "normal") return cond
            // if (cond.v.value.k === "unreachable") return UNREACHABLE
            // if (cond.v.value.k === "bool") {
            //     if (cond.v.value.v) {
            //         return expr(block, time, type, v.v.if)
            //     } else {
            //         return v.v.else ? expr(block, time, type, v.v.else) : normal(VOID)
            //     }
            // }
            // assert(cond.v.value.k === "runtime")
            // const blockIf = block.fork()
            // const blockElse = block.fork()
            // const valueIf = expr(blockIf, time, type, v.v.if)
            // if (valueIf.k === "error") return valueIf
            // const valueElse = v.v.else ? expr(blockElse, time, type, v.v.else) : normal(VOID)
            // if (valueElse.k === "error") return valueElse
            // if (valueIf.k === "normal" && valueElse.k === "normal") {
            //     const joined = join(block, v, valueIf.v, valueElse.v)
            //     if (joined === null) return ERROR
            //     const rii = block.push("cf-if", {
            //         cond: cond.v.value.v,
            //         type: joined[0].type,
            //         if: { body: blockIf.body, value: joined[0] },
            //         else: { body: blockElse.body, value: joined[1] },
            //     })
            //     return normal({ type: joined[0].type, value: { k: "runtime", v: rii } })
            // }
            // const rii = block.push("cf-if", {
            //     cond: cond.v.value.v,
            //     type:
            //         valueIf.k === "normal" ? valueIf.v.type
            //         : valueElse.k === "normal" ? valueElse.v.type
            //         : { k: "never", v: null },
            //     if: {
            //         body: blockIf.body,
            //         value: valueIf.k === "normal" ? valueIf.v : null,
            //     },
            //     else: {
            //         body: blockElse.body,
            //         value: valueElse.k === "normal" ? valueElse.v : null,
            //     },
            // })
            // return (
            //     valueIf.k === "normal" ? normalRuntime(valueIf.v.type, rii)
            //     : valueElse.k === "normal" ? normalRuntime(valueElse.v.type, rii)
            //     : UNREACHABLE
            // )
        }

        case "cf-switch":
            break

        case "cf-for":
            break

        case "cf-while":
            break

        case "cf-break":
        case "cf-continue": {
            const kind = v.k === "cf-break" ? "break" : "continue"

            const value = v.v.value ? expr(block, time, type, v.v.value) : normal(VOID)
            if (value.k !== "normal") return value

            let name: string
            if (v.v.label === null) {
                if (!block.implicitLabel) {
                    block.raiseAt(v, `'${kind}' has no target`)
                    return ERROR
                }
                name = block.implicitLabel
            } else {
                if (v.v.label.name in block.labels) {
                    name = v.v.label.name
                } else {
                    block.raiseAt(v, `Cannot '${kind}' to nonexistent label`)
                    return ERROR
                }
            }

            const label = block.labels[name]!
            if (label[kind] === false) {
                block.raiseAt(v, "Label does not support 'break'")
                return ERROR
            }

            if (label[kind] === null) {
                return { k: kind, v: { n: label.n, value: value.v } }
            }

            const coerced = as(block, label[kind], v, value.v)
            if (coerced === null) return ERROR

            return { k: kind, v: { n: label.n, value: coerced } }
        }

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
            const targetRaw = expr(
                block,
                time,
                type ? { k: "optional", v: type } : null,
                v.v.target,
            )
            if (targetRaw.k !== "normal") return ERROR

            const target = targetRaw.v

            if (target.type.k !== "optional") {
                block.raiseAt(v.v.target, "Expected optional value")
                return ERROR
            }

            if (target.value.k === "null") {
                block.raiseAt(v.v.target, "Cannot unwrap 'null'")
                return ERROR
            }

            if (target.value.k === "some") {
                return normal({ type: target.type.v, value: target.value.v })
            }

            if (target.value.k === "unreachable") {
                return UNREACHABLE
            }

            assert(target.value.k === "runtime")

            return normal({
                type: target.type.v,
                value: { k: "runtime", v: block.push("get-unwrap", target.value.v) },
            })
        }

        case "block": {
            const innerBlock = new Block(
                block.errors,
                block.file,
                Object.assign(Object.create(null), block.names),
                Object.assign(Object.create(null), block.labels),
                block.implicitLabel,
                block.returnType,
            )

            if (v.v.label === null) {
                const result = stmtList(innerBlock, time, v.v.body)
                block.body.push(...innerBlock.body)
                return result.k === "normal" ? normal(VOID) : result
            }

            if (v.v.label.name in innerBlock.labels) {
                block.raiseAt(v.v.label, "Label shadows a label declared on an outer block or loop")
                return ERROR
            }

            const n = nextRII()
            innerBlock.labels[v.v.label.name] = { n, break: type, continue: false }

            const result = stmtList(innerBlock, time, v.v.body)
            if (result.k === "error") return ERROR

            if (time === "comptime") {
                if (result.k === "normal") {
                    return normal(VOID)
                }
                return result
            }

            const rv = innerBlock.completeWith(result.k === "normal" ? normal(VOID) : result)
            if (type === null) {
                type = unifyTerminators(block, v, rv, "break", n)
                if (type === null) return ERROR
            }

            const allBlocks: RuntimeBlock[] = []
            collectBlocksIn(allBlocks, rv)

            const uses = allBlocks.filter((x) => x.value.k === "break" && x.value.v.n === n)
            if (uses.length === 0) {
                block.raiseAt(v, `Block label ':${v.v.label.name}' is never referenced`)
                return ERROR
            }

            if (result.k === "break" && result.v.n === n) {
                if (uses.length === 1) {
                    block.body.push(...innerBlock.body)
                    return normal(result.v.value)
                }

                block.body.push({
                    n,
                    k: "cf-block",
                    v: { type, body: innerBlock.completeWith(normal(result.v.value)) },
                })
                return normal({ type, value: { k: "runtime", v: n } })
            }

            if (result.k === "normal") {
                if (type.k !== "void") {
                    block.raiseAt(v, `Expected to break with '${typeName(type)}' at end of block`)
                    return ERROR
                }
                block.body.push({
                    n,
                    k: "cf-block",
                    v: { type, body: innerBlock.completeWith(normal(VOID)) },
                })
                return normal(VOID)
            }

            block.body.push({
                n,
                k: "cf-block",
                v: { type, body: innerBlock.completeWith(result) },
            })

            return normal({ type, value: { k: "runtime", v: n } })
        }

        case "cf-maybe": {
            if (time === "comptime") {
                block.raiseAt(v, "'maybe' is not supported at comptime")
            }

            const innerBlock = block.forkForConditional()
            const result = exprAs(innerBlock, time, { k: "void", v: null }, v.v)
            if (result.k === "error") return ERROR
            block.push("cf-maybe", innerBlock.completeWith(result))

            return normal(VOID)
        }

        case "builtin":
            return exprBuiltin(block, time, type, v, v.v.name, v.v.args)

        case "ident": {
            if (!v.v.raw) {
                if (/^u\d+$/.test(v.v.name)) {
                    return resultFromType({ k: "u", v: +v.v.name.slice(1) })
                }
                if (/^i\d+$/.test(v.v.name)) {
                    return resultFromType({ k: "i", v: +v.v.name.slice(1) })
                }
                if (/^f\d+$/.test(v.v.name)) {
                    for (const size of FLOAT_BIT_SIZES) {
                        if (v.v.name === "f" + size) {
                            return resultFromType({ k: "f", v: size })
                        }
                    }
                    block.raiseAt(v, `'${v.v.name}' is not a valid floating-point type`)
                    return ERROR
                }
                if (v.v.name === "false") {
                    return normal({ type: { k: "bool", v: null }, value: { k: "bool", v: false } })
                }
                if (v.v.name === "true") {
                    return normal({ type: { k: "bool", v: null }, value: { k: "bool", v: true } })
                }
                if (v.v.name === "null") {
                    if (type?.k === "optional") {
                        return normal({ type, value: { k: "null", v: null } })
                    }
                    return normal({ type: { k: "null", v: null }, value: { k: "null", v: null } })
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
                    return resultFromType({ k: v.v.name, v: null })
                }
            }

            if (!(v.v.name in block.names)) {
                block.raiseAt(v, `'${v.v.name}' is not defined`)
                return ERROR
            }

            const value = block.names[v.v.name]!
            switch (value.k) {
                case "reserved":
                    block.raiseAt(v, `'${v.v.name}' is not accessible from this scope`)
                    return ERROR

                case "comptime-const":
                    return normal(value.v)

                case "const":
                case "var":
                    return normal({
                        type: value.v.type,
                        value: { k: "runtime", v: block.push("var-load", value.v.n) },
                    })

                case "fn":
                    block.todo(v)
                    return ERROR
            }
        }

        case "underscore":
            block.raiseAt(v, "`_` cannot be used as a value")
            return ERROR

        case "closure":
            break

        case "paren":
            return expr(block, time, type, v.v)

        default:
            v satisfies never
    }

    block.todo(v)
    return ERROR
}

function stmtList(block: Block, time: "comptime" | "any", stmts: Stmt[]): Result<null> {
    for (const el of stmts) {
        const result = stmt(block, time, el)
        if (result.k !== "normal") return result
    }

    return normal(null)
}

function collectBlocks(ret: RuntimeBlock[], rv: RuntimeInst): void {
    switch (rv.k) {
        case "cf-unreachable":
        case "get-unwrap":
        case "lit":
        case "side-effect":
        case "var-init":
        case "var-load":
        case "var-store":
            break

        case "cf-if":
            collectBlocksIn(ret, rv.v.if)
            collectBlocksIn(ret, rv.v.else)
            break

        case "cf-block":
            collectBlocksIn(ret, rv.v.body)
            break

        case "cf-maybe":
            collectBlocksIn(ret, rv.v)
            break

        default:
            rv satisfies never
    }
}

function collectBlocksIn(ret: RuntimeBlock[], rv: RuntimeBlock): void {
    for (const el of rv.body) collectBlocks(ret, el)
    ret.push(rv)
}

function unifyTerminators(
    block: Block,
    range: Range,
    rv: RuntimeBlock,
    kind: "break" | "continue",
    n: RII,
): RType | null {
    const subBlocks: RuntimeBlock[] = []
    collectBlocksIn(subBlocks, rv)

    const terminators = subBlocks
        .map((x) => x.value)
        .filter((x): x is Extract<typeof x, { k: "break" | "continue" }> => x.k === kind)
        .filter((x) => x.v.n === n)
        .map((x) => x.v)

    const type = join(
        block,
        range,
        terminators.map((x) => x.value),
    )
    if (type === null) return null

    for (const el of terminators) {
        const coerced = as(block, type, range, el.value)
        assert(coerced !== null)
        el.value = coerced
    }

    return type
}

const UNREACHABLE = { k: "unreachable", v: null } as const

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
        return { type, value: { k: "unreachable", v: null } }
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

function join(block: Block, range: Range, values: RTypedValue[]): RType | null {
    values = values.filter((x) => x.type.k !== "never")
    if (values.length === 0) return { k: "never", v: null }

    if (values.some((x) => x.type.k === "null") || values.some((x) => x.type.k === "optional")) {
        const optionals = values.filter((x) => x.type.k === "optional")
        if (optionals.length >= 2) {
            for (let i = 1; i < optionals.length; i++) {
                if (!typeEq(optionals[0]!.type, optionals[i]!.type)) {
                    block.raiseAt(range, "Optionals must all be the same type")
                    return null
                }
            }
        }

        const plains = values.filter((x) => x.type.k !== "null" && x.type.k !== "optional")

        if (optionals.length === 0) {
            const commonPlainType = join(block, range, plains)
            if (commonPlainType === null) return null
            return { k: "optional", v: commonPlainType } // to accomodate the nulls
        }

        assert(optionals[0]!.type.k === "optional")
        const optionalChild = optionals[0]!.type.v
        for (const el of plains) {
            const result = as(block, optionalChild, range, el)
            if (result === null) return null
        }

        return optionals[0]!.type
    }

    for (let i = 1; i < values.length; i++) {
        if (!typeEq(values[0]!.type, values[i]!.type)) {
            block.raiseAt(range, "Cannot find supertype")
            return null
        }
    }

    return values[0]!.type
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
            return (
                a.v.id === b.v.id
                && a.v.captures.every(
                    (va, i) =>
                        typeEq(va.type, b.v.captures[i]!.type)
                        && valueEq(va.value, b.v.captures[i]!.value),
                )
            )
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

function exprAs(block: Block, time: "comptime" | "any", type: RType, v: Expr): Result<RTypedValue> {
    const result = expr(block, time, type, v)
    if (result.k !== "normal") return result

    const coerced = as(block, type, v, result.v)
    if (coerced === null) return { k: "error", v: null }

    return { k: "normal", v: coerced }
}

function resultFromType(type: RType): Result<RTypedValue> {
    return normal({ type: { k: "type", v: null }, value: { k: "type", v: type } })
}

function exprBuiltin(
    block: Block,
    time: "comptime" | "any",
    type: RType | null,
    v: Expr,
    name: string,
    args: Expr[],
): Result<RTypedValue> {
    switch (name) {
        case "as": {
            if (args.length !== 2) {
                block.raiseAt(v, "'@as' expects two arguments")
                return ERROR
            }

            const type = exprAsType(block, args[0]!)
            if (type.k !== "normal") return type

            return exprAs(block, time, type.v, args[1]!)
        }

        case "compileError": {
            if (args.length !== 1) {
                block.raiseAt(v, "'@compileError' expects one argument")
                return ERROR
            }

            const message = exprAs(block, "comptime", { k: "str", v: null }, v)
            if (message.k !== "normal") return ERROR

            assert(message.v.value.k === "str")
            block.raiseAt(v, message.v.value.v)
            return ERROR
        }

        // TODO remove this. it's an arbitrary side effect that the comptime compiler cannot optimize away
        case "sideEffect": {
            if (time === "comptime") {
                block.raiseAt(v, "'@sideEffect' cannot be used at comptime")
                return ERROR
            }

            if (args.length !== 0) {
                block.raiseAt(v, "'@sideEffect' expects zero arguments")
                return ERROR
            }

            block.push("side-effect", null)
            return normal(VOID)
        }

        case "runtime": {
            if (time == "comptime") {
                block.raiseAt(v, "'@runtime' cannot be called from comptime")
                return ERROR
            }

            if (args.length !== 1) {
                block.raiseAt(v, "'@runtime' expects one argument")
                return ERROR
            }

            const value = expr(block, "any", type, args[0]!)
            if (value.k !== "normal") return ERROR

            return normal({
                type: value.v.type,
                value: { k: "runtime", v: block.push("lit", value.v) },
            })
        }

        case "TypeOf": {
            if (args.length !== 1) {
                block.raiseAt(v, "'@TypeOf' expects one argument")
                return ERROR
            }

            const value = expr(block, time, type, args[0]!)
            if (value.k !== "normal") return ERROR

            return resultFromType(value.v.type)
        }
    }

    block.todo(v)
    return ERROR
}

const ERROR: Result<never> = { k: "error", v: null }

function exprAsType(block: Block, v: Expr): Result<RType> {
    const value = expr(block, "comptime", { k: "type", v: null }, v)
    if (value.k !== "normal") return ERROR

    if (value.v.type.k !== "type") {
        block.raiseAt(v, `Expected 'type', found '${typeName(value.v.type)}'`)
        return ERROR
    }

    assert(value.v.value.k === "type")
    return normal(value.v.value.v)
}

export function stmt(block: Block, time: "comptime" | "any", v: Stmt): Result<null> {
    if (v.k === "expr") {
        const value = expr(block, time, { k: "void", v: null }, v.v)
        if (value.k !== "normal") return value

        if (value.v.type.k === "never" || value.v.value.k === "unreachable") {
            return UNREACHABLE
        }

        if (value.v.type.k === "void") {
            return normal(null)
        }

        block.raiseAt(
            v.v,
            `Values of type '${typeName(value.v.type)}' cannot be silently ignored; use \`_ = ...\` to explicitly discard the value`,
        )
        return normal(null)
    }

    const { lhs: lhsRaw, rhs: rhsRaw } = v.v
    if (lhsRaw.length !== 1) {
        block.todo(v, "Only one left-hand-side is supported on assignments for now")
        return ERROR
    }

    const lhs = lhsRaw[0]!
    if (lhs.k === "expr") {
        if (lhs.v.k === "underscore") {
            const rhs = expr(block, time, null, rhsRaw)
            if (rhs.k !== "normal") return rhs

            return normal(null)
        }

        if (lhs.v.k === "ident") {
            if (!lhs.v.v.raw && isReservedIdent(lhs.v.v.name)) {
                block.raiseAt(lhs.v.v, `Cannot assign to reserved identifier '${lhs.v.v.name}'`)
                return ERROR
            }

            if (!(lhs.v.v.name in block.names)) {
                block.raiseAt(lhs.v.v, `'${lhs.v.v.name}' is not defined in this scope`)
                return ERROR
            }

            const name = block.names[lhs.v.v.name]!
            if (name.k === "reserved") {
                block.raiseAt(lhs.v.v, `'${lhs.v.v.name}' is not accessible from this scope`)
                return ERROR
            }
            if (name.k !== "var") {
                block.raiseAt(lhs.v.v, `'${lhs.v.v.name}' is not a variable`)
                return ERROR
            }

            const rhs = exprAs(block, time, name.v.type, v.v.rhs)
            if (rhs.k !== "normal") return rhs

            block.push("var-store", { target: name.v.n, value: rhs.v })
            return normal(null)
        }

        block.todo(v, "Only `_` and identifiers can be assigned to")
        return ERROR
    }

    if (!lhs.v.name.raw && isReservedIdent(lhs.v.name.name)) {
        block.raiseAt(lhs.v.name, "Identifier shadows a builtin")
        return ERROR
    }
    if (lhs.v.name.name in block.names) {
        block.raiseAt(lhs.v.name, "Identifier shadows another declaration")
        return ERROR
    }

    if (lhs.k === "comptime-const") time = "comptime"

    let value
    if (lhs.v.type) {
        const expectedType = exprAsType(block, lhs.v.type)
        if (expectedType.k !== "normal") return expectedType

        value = exprAs(block, time, expectedType.v, rhsRaw)
    } else {
        value = expr(block, time, null, rhsRaw)
    }
    if (value.k !== "normal") return value

    if (lhs.k === "comptime-const") {
        block.names[lhs.v.name.name] = { k: "comptime-const", v: value.v }
    } else {
        block.names[lhs.v.name.name] = {
            k: lhs.k,
            v: { n: block.push("var-init", value.v), type: value.v.type },
        }
    }

    return normal(null)
}

function identsCapturedInDecl(names: Names, decl: Decl[]): string[] {
    const map = new Map<string, boolean>()
    for (const el in names) map.set(el, false)

    for (const el of decl) identCaptures.decl(map, el)

    const ret: string[] = []
    for (const [k, v] of map) if (v) ret.push(k)
    return ret
}

function nsStruct(block: Block, range: Range, id: number, v: Decl[]): RType | null {
    const identsCaptured = identsCapturedInDecl(block.names, v)
    const captures: RTypedValue[] = []

    for (const el of identsCaptured) {
        const value = block.names[el]!

        switch (value.k) {
            case "comptime-const":
                captures.push(value.v)
                break

            case "fn":
                break

            case "const":
            case "var":
            case "reserved":
                block.raiseAt(
                    range,
                    `Struct cannot capture '${el}', since it is not a 'comptime const' or a 'fn'`,
                )
                return null

            default:
                value satisfies never
        }
    }

    block.forkForNamespace()

    const decls: Record<string, RContainerDecl> = Object.create(null)
    const fields: Record<string, { type: RType; default: RTypedValue | null }> = Object.create(null)

    for (const el of v) {
        switch (el.k) {
            case "field-ident":
                block.raiseAt(el, `Struct fields must have explicit types.`)
                return null

            case "field-plain": {
                if (el.v.name.name in fields) {
                    block.raiseAt(el, `Struct field '${el.v.name.name}' declared twice.`)
                    return null
                }

                const myBlock = block.forkForNamespace()

                const typeResult = exprAsType(myBlock, el.v.type)
                if (typeResult.k === "error") return null
                assert(typeResult.k === "normal")

                let defaultValue: RTypedValue | null = null
                if (el.v.default) {
                    const val = exprAs(myBlock, "comptime", typeResult.v, el.v.default)
                    if (val.k === "error") return null
                    assert(val.k === "normal")
                    defaultValue = val.v
                }

                fields[el.v.name.name] = { type: typeResult.v, default: defaultValue }
                break
            }

            case "comptime": {
                const val = exprAs(block, "comptime", { k: "void", v: null }, el.v)
                if (val.k === "error") return null
                assert(val.k === "normal")
                break
            }

            case "test":
            case "const":
            case "var":
            case "fn":
                block.todo(el)
                break

            default:
                el satisfies never
        }
    }

    return {
        k: "struct",
        v: { id, name: `${block.file.name}__struct_${id}`, captures, decls, fields },
    }
}
