import { assert } from "./assert"
import {
    as,
    ERROR,
    EvaluationContext,
    exprAs,
    isComptimeValue,
    normal,
    tbool,
    type FnArg,
    type Result,
    type Type,
    type TypedValue,
} from "./ir"
import { iabs, idivCeil, idivFloor, isign } from "./num"
import type { Range } from "./parse"

type BuiltinFn = (
    ctx: EvaluationContext,
    comptime: boolean,
    self: Type,
    p: Range,
    args: FnArg[],
) => Result<TypedValue>

const ftodo: BuiltinFn = (ctx, _comptime, _self, p, _args) => {
    ctx.raiseAt(p, `builtin function not implemented yet`)
    return ERROR
}

type BuiltinConst = (ctx: EvaluationContext, self: Type, p: Range) => TypedValue | null

const ctodo: BuiltinConst = (ctx, _self, p) => {
    ctx.raiseAt(p, `builtin constant not implemented yet`)
    return null
}

function fnArg(
    ctx: EvaluationContext,
    comptime: boolean,
    type: Type,
    arg: FnArg,
): Result<TypedValue> {
    if (arg.evaluated) {
        assert(!(comptime && !isComptimeValue(arg.value.value)))
        const result = as(ctx, arg.p, type, arg.value)
        if (result === null) return ERROR
        return { k: "normal", v: result }
    }

    return exprAs(ctx, comptime, type, arg.value)
}

function builtinFn(type: Type, name: string): BuiltinFn | null {
    if (!Object.hasOwn(BUILTIN_METHODS, type.k)) {
        return null
    }

    if (!Object.hasOwn(BUILTIN_METHODS[type.k]!, name)) {
        return null
    }

    return BUILTIN_METHODS[type.k]![name]!
}

function builtinConst(type: Type, name: string): BuiltinConst | null {
    if (!Object.hasOwn(BUILTIN_CONSTANTS, type.k)) {
        return null
    }

    if (!Object.hasOwn(BUILTIN_CONSTANTS[type.k]!, name)) {
        return null
    }

    return BUILTIN_CONSTANTS[type.k]![name]!
}

function comptime_int_unary(
    f: (ctx: EvaluationContext, p: Range, a: bigint) => bigint | null,
): BuiltinFn {
    return (ctx, comptime, self, p, args) => {
        if (args.length !== 1) {
            ctx.raiseAt(p, "expected exactly one argument")
            return ERROR
        }

        const arg = fnArg(ctx, comptime, self, args[0]!)
        if (arg.k !== "normal") return arg
        assert(arg.v.value.k === "int")

        const result = f(ctx, p, arg.v.value.v)
        if (result === null) return ERROR

        return normal(self, { k: "int", v: result })
    }
}

function comptime_int_binary(
    f: (ctx: EvaluationContext, p: Range, a: bigint, b: bigint) => bigint | null,
): BuiltinFn {
    return (ctx, comptime, self, p, args) => {
        if (args.length !== 2) {
            ctx.raiseAt(p, "expected exactly two arguments")
            return ERROR
        }

        const lhs = fnArg(ctx, comptime, self, args[0]!)
        if (lhs.k !== "normal") return lhs
        assert(lhs.v.value.k === "int")

        const rhs = fnArg(ctx, comptime, self, args[1]!)
        if (rhs.k !== "normal") return rhs
        assert(rhs.v.value.k === "int")

        const result = f(ctx, p, lhs.v.value.v, rhs.v.value.v)
        if (result === null) return ERROR

        return normal(self, { k: "int", v: result })
    }
}

function comptime_int_binary_cmp(f: (a: bigint, b: bigint) => boolean): BuiltinFn {
    return (ctx, comptime, self, p, args) => {
        if (args.length !== 2) {
            ctx.raiseAt(p, "expected exactly two arguments")
            return ERROR
        }

        const lhs = fnArg(ctx, comptime, self, args[0]!)
        if (lhs.k !== "normal") return lhs
        assert(lhs.v.value.k === "int")

        const rhs = fnArg(ctx, comptime, self, args[1]!)
        if (rhs.k !== "normal") return rhs
        assert(rhs.v.value.k === "int")

        const result = f(lhs.v.value.v, rhs.v.value.v)
        return normal(tbool, { k: "bool", v: result })
    }
}

function comptime_int_binary_dividing(
    f: (ctx: EvaluationContext, p: Range, a: bigint, b: bigint) => bigint | null,
): BuiltinFn {
    return comptime_int_binary((ctx, p, a, b) => {
        if (b === 0n) {
            ctx.raiseAt(p, `division by zero`)
            return null
        }

        return f(ctx, p, a, b)
    })
}

const conj: BuiltinFn = (ctx, comptime, self, p, args) => {
    if (args.length !== 1) {
        ctx.raiseAt(p, "'.conj' requires exactly one argument")
        return ERROR
    }

    return fnArg(ctx, comptime, self, args[0]!)
}

const BUILTIN_METHODS: Partial<Record<Type["k"], Record<string, BuiltinFn>>> = {
    bool: {
        "!": ftodo,
        "&": ftodo,
        "|": ftodo,
        "~": ftodo,

        "==": ftodo,
        "!=": ftodo,
        "<": ftodo,
        ">": ftodo,
        "<=": ftodo,
        ">=": ftodo,
    },

    comptime_int: {
        "0-": comptime_int_unary((_ctx, _p, a) => -a),
        "+": comptime_int_binary((_ctx, _p, a, b) => a + b),
        "-": comptime_int_binary((_ctx, _p, a, b) => a - b),
        "*": comptime_int_binary((_ctx, _p, a, b) => a * b),

        "/": comptime_int_binary_dividing((ctx, p, a, b) => {
            if (a % b !== 0n) {
                ctx.raiseAt(p, `division is not exact; try '.divFloor', '.divCeil', or '.divTrunc'`)
                return null
            }

            return a / b
        }),
        divExact: comptime_int_binary_dividing((ctx, p, a, b) => {
            if (a % b !== 0n) {
                ctx.raiseAt(p, `division is not exact; try '.divFloor', '.divCeil', or '.divTrunc'`)
                return null
            }

            return a / b
        }),
        divFloor: comptime_int_binary_dividing((_ctx, _p, a, b) => idivFloor(a, b)),
        divCeil: comptime_int_binary_dividing((_ctx, _p, a, b) => idivCeil(a, b)),
        divTrunc: comptime_int_binary_dividing((_ctx, _p, a, b) => a / b),
        "%": comptime_int_binary_dividing((ctx, p, a, b) => {
            if (b < 0n) {
                ctx.raiseAt(p, `divisor of '%' cannot be negative; try '.rem' or '.mod'`)
                return null
            }

            return a / b
        }),
        rem: comptime_int_binary_dividing((_ctx, _p, a, b) => a % b),
        mod: comptime_int_binary_dividing((_ctx, _p, a, b) => ((a % b) + b) % b),

        "&": comptime_int_binary((_ctx, _p, a, b) => a & b),
        "|": comptime_int_binary((_ctx, _p, a, b) => a | b),
        "~": comptime_int_binary((_ctx, _p, a, b) => a ^ b),

        sign: comptime_int_unary((_ctx, _p, a) => isign(a)),
        abs: comptime_int_unary((_ctx, _p, a) => iabs(a)),

        "<": comptime_int_binary_cmp((a, b) => a < b),
        ">": comptime_int_binary_cmp((a, b) => a > b),
        "<=": comptime_int_binary_cmp((a, b) => a <= b),
        ">=": comptime_int_binary_cmp((a, b) => a >= b),
        "==": comptime_int_binary_cmp((a, b) => a == b),
        "!=": comptime_int_binary_cmp((a, b) => a != b),

        conj,
    },

    i: {
        "0-": ftodo,
        "+": ftodo,
        "-": ftodo,
        "*": ftodo,
        "0-%": ftodo,
        "+%": ftodo,
        "-%": ftodo,
        "*%": ftodo,

        "/": ftodo,
        divExact: ftodo,
        divFloor: ftodo,
        divCeil: ftodo,
        divTrunc: ftodo,
        "%": ftodo,
        rem: ftodo,
        mod: ftodo,

        "1~": ftodo,
        "&": ftodo,
        "|": ftodo,
        "~": ftodo,

        sign: ftodo,
        abs: ftodo,
        clz: ftodo,

        "<": ftodo,
        ">": ftodo,
        "<=": ftodo,
        ">=": ftodo,
        "==": ftodo,
        "!=": ftodo,

        conj: ftodo,
    },

    u: {
        "+": ftodo,
        "-": ftodo,
        "*": ftodo,
        "+%": ftodo,
        "-%": ftodo,
        "*%": ftodo,

        "/": ftodo,
        divExact: ftodo,
        divFloor: ftodo,
        divCeil: ftodo,
        divTrunc: ftodo,
        "%": ftodo,
        rem: ftodo,
        mod: ftodo,

        "1~": ftodo,
        "&": ftodo,
        "|": ftodo,
        "~": ftodo,

        sign: ftodo,
        abs: ftodo,
        clz: ftodo,

        "<": ftodo,
        ">": ftodo,
        "<=": ftodo,
        ">=": ftodo,
        "==": ftodo,
        "!=": ftodo,

        conj: ftodo,
    },

    comptime_float: {
        "0-": ftodo,
        "+": ftodo,
        "-": ftodo,
        "*": ftodo,

        "1/": ftodo,
        "/": ftodo,
        divExact: ftodo,
        divFloor: ftodo,
        divCeil: ftodo,
        divTrunc: ftodo,
        "%": ftodo,
        rem: ftodo,
        mod: ftodo,

        sign: ftodo,
        abs: ftodo,

        sin: ftodo,
        sinh: ftodo,
        asin: ftodo,
        asinh: ftodo,
        cos: ftodo,
        cosh: ftodo,
        acos: ftodo,
        acosh: ftodo,
        tan: ftodo,
        tanh: ftodo,
        atan: ftodo,
        atanh: ftodo,

        exp: ftodo,
        exp2: ftodo,
        exp10: ftodo,
        expm1: ftodo,
        log: ftodo,
        log2: ftodo,
        log10: ftodo,
        log1p: ftodo,

        floor: ftodo,
        ceil: ftodo,
        trunc: ftodo,

        isInf: ftodo,
        isNan: ftodo,
        isFin: ftodo,

        "<": ftodo,
        ">": ftodo,
        "<=": ftodo,
        ">=": ftodo,
        "==": ftodo,
        "!=": ftodo,

        conj: ftodo,
    },

    f: {
        "0-": ftodo,
        "+": ftodo,
        "-": ftodo,
        "*": ftodo,

        "1/": ftodo,
        "/": ftodo, // comptime-only
        divExact: ftodo,
        divFloor: ftodo,
        divCeil: ftodo,
        divTrunc: ftodo,
        "%": ftodo, // comptime-only
        rem: ftodo,
        mod: ftodo,

        sign: ftodo,
        abs: ftodo,

        sin: ftodo,
        sinh: ftodo,
        asin: ftodo,
        asinh: ftodo,
        cos: ftodo,
        cosh: ftodo,
        acos: ftodo,
        acosh: ftodo,
        tan: ftodo,
        tanh: ftodo,
        atan: ftodo,
        atanh: ftodo,

        exp: ftodo,
        exp2: ftodo,
        exp10: ftodo,
        expm1: ftodo,
        log: ftodo,
        log2: ftodo,
        log10: ftodo,
        log1p: ftodo,

        floor: ftodo,
        ceil: ftodo,
        trunc: ftodo,

        isInf: ftodo,
        isNan: ftodo,
        isFin: ftodo,

        "<": ftodo,
        ">": ftodo,
        "<=": ftodo,
        ">=": ftodo,
        "==": ftodo,
        "!=": ftodo,

        conj: ftodo,
    },
}

const BUILTIN_CONSTANTS: Partial<Record<Type["k"], Record<string, BuiltinConst>>> = {
    i: {
        minValue: ctodo,
        maxValue: ctodo,
    },

    u: {
        minValue: ctodo,
        maxValue: ctodo,
    },

    comptime_float: {
        epsilon: ctodo,
        pi: ctodo,
        e: ctodo,
        inf: ctodo,
        nan: ctodo,
    },

    f: {
        epsilon: ctodo,
        pi: ctodo,
        e: ctodo,
        inf: ctodo,
        nan: ctodo,
    },
}
