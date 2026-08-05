import { assert } from "./assert"
import {
    as,
    ERROR,
    EvaluationContext,
    exprAs,
    isComptimeValue,
    normal,
    tbool,
    tcomptime_int,
    tstr,
    type FnArg,
    type Op1,
    type Op2,
    type Result,
    type Type,
    type TypedValue,
} from "./ir"
import { floatTruncate, iabs, idivCeil, idivFloor, isign } from "./num"
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

export function builtinFn(type: Type, name: string): BuiltinFn | null {
    if (!Object.hasOwn(BUILTIN_METHODS, type.k)) {
        return null
    }

    if (!Object.hasOwn(BUILTIN_METHODS[type.k]!, name)) {
        return null
    }

    return BUILTIN_METHODS[type.k]![name]!
}

export function builtinConst(type: Type, name: string): BuiltinConst | null {
    if (!Object.hasOwn(BUILTIN_CONSTANTS, type.k)) {
        return null
    }

    if (!Object.hasOwn(BUILTIN_CONSTANTS[type.k]!, name)) {
        return null
    }

    return BUILTIN_CONSTANTS[type.k]![name]!
}

function cint_unary(f: (ctx: EvaluationContext, p: Range, a: bigint) => bigint | null): BuiltinFn {
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

function cint_binary(
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

function cint_binary_dividing(
    f: (ctx: EvaluationContext, p: Range, a: bigint, b: bigint) => bigint | null,
): BuiltinFn {
    return cint_binary((ctx, p, a, b) => {
        if (b === 0n) {
            ctx.raiseAt(p, `division by zero`)
            return null
        }

        return f(ctx, p, a, b)
    })
}

function cint_cmp(f: (a: bigint, b: bigint) => boolean): BuiltinFn {
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

const conj: BuiltinFn = (ctx, comptime, self, p, args) => {
    if (args.length !== 1) {
        ctx.raiseAt(p, "'.conj' requires exactly one argument")
        return ERROR
    }

    return fnArg(ctx, comptime, self, args[0]!)
}

const BUILTIN_METHODS_F: Record<string, BuiltinFn> = {
    "0-": f_unary("0-", (x) => -x),
    "+": f_binary("+", (_ctx, _p, a, b) => a + b),
    "-": f_binary("-", (_ctx, _p, a, b) => a - b),
    "*": f_binary("*", (_ctx, _p, a, b) => a * b),

    "1/": f_unary("1/", (x) => 1 / x),
    "/": f_binary("/", (_ctx, _p, a, b) => a / b),
    divExact: f_binary("@divExact", (ctx, p, a, b) => {
        if (!(isFinite(a) && isFinite(b))) {
            ctx.raiseAt(p, `'.divExact' called with non-finite values`)
            return null
        }

        const quot = a / b
        if (quot !== Math.trunc(quot) || a % b !== 0) {
            ctx.raiseAt(p, `division is not exact`)
            return null
        }

        return quot
    }),
    divFloor: f_binary("@divFloor", (_ctx, _p, a, b) => Math.floor(a / b)),
    divCeil: f_binary("@divCeil", (_ctx, _p, a, b) => Math.ceil(a / b)),
    divTrunc: f_binary("@divTrunc", (_ctx, _p, a, b) => Math.trunc(a / b)),
    "%": f_binary("%", (ctx, p, a, b) => {
        if (!(isFinite(a) && isFinite(b))) {
            ctx.raiseAt(p, `'%' called with non-finite values`)
            return null
        }

        if (b <= 0) {
            ctx.raiseAt(
                p,
                `'%' called with nonpositive divisor; use '.rem' or '.mod' to specify behavior when divisor is negative`,
            )
            return null
        }

        return a % b
    }),
    rem: f_binary("@rem", (_ctx, _p, a, b) => a % b),
    mod: f_binary("@mod", (_ctx, _p, a, b) => ((a % b) + b) % b),

    sign: f_unary("@sign", (x) => Math.sign(x)),
    abs: f_unary("@abs", (x) => Math.abs(x)),

    sin: f_unary("@sin", (x) => Math.sin(x)),
    sinh: f_unary("@sinh", (x) => Math.sinh(x)),
    asin: f_unary("@asin", (x) => Math.asin(x)),
    asinh: f_unary("@asinh", (x) => Math.asinh(x)),
    cos: f_unary("@cos", (x) => Math.cos(x)),
    cosh: f_unary("@cosh", (x) => Math.cosh(x)),
    acos: f_unary("@acos", (x) => Math.acos(x)),
    acosh: f_unary("@acosh", (x) => Math.acosh(x)),
    tan: f_unary("@tan", (x) => Math.tan(x)),
    tanh: f_unary("@tanh", (x) => Math.tanh(x)),
    atan: f_unary("@atan", (x) => Math.atan(x)),
    atanh: f_unary("@atanh", (x) => Math.atanh(x)),

    exp: f_unary("@exp", (x) => Math.exp(x)),
    exp2: f_unary("@exp2", (x) => Math.pow(2, x)),
    exp10: f_unary("@exp10", (x) => Math.pow(10, x)),
    expm1: f_unary("@expm1", (x) => Math.expm1(x)),
    log: f_unary("@log", (x) => Math.log(x)),
    log2: f_unary("@log2", (x) => Math.log2(x)),
    log10: f_unary("@log10", (x) => Math.log10(x)),
    log1p: f_unary("@log1p", (x) => Math.log1p(x)),

    floor: f_unary("@floor", (x) => Math.floor(x)),
    ceil: f_unary("@ceil", (x) => Math.ceil(x)),
    trunc: f_unary("@trunc", (x) => Math.trunc(x)),

    isInf: f_check("@isInf", (x) => x === x && !isFinite(x)),
    isNan: f_check("@isNan", (x) => x !== x),
    isFin: f_check("@isFin", (x) => isFinite(x)),

    "<": f_cmp("<", (a, b) => a < b),
    ">": f_cmp(">", (a, b) => a > b),
    "<=": f_cmp("<=", (a, b) => a <= b),
    ">=": f_cmp(">=", (a, b) => a >= b),
    "==": f_cmp("==", (a, b) => a == b),
    "!=": f_cmp("!=", (a, b) => a != b),

    conj,
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
        "0-": cint_unary((_ctx, _p, a) => -a),
        "+": cint_binary((_ctx, _p, a, b) => a + b),
        "-": cint_binary((_ctx, _p, a, b) => a - b),
        "*": cint_binary((_ctx, _p, a, b) => a * b),

        "/": cint_binary_dividing((ctx, p, a, b) => {
            if (a % b !== 0n) {
                ctx.raiseAt(p, `division is not exact; try '.divFloor', '.divCeil', or '.divTrunc'`)
                return null
            }

            return a / b
        }),
        divExact: cint_binary_dividing((ctx, p, a, b) => {
            if (a % b !== 0n) {
                ctx.raiseAt(p, `division is not exact; try '.divFloor', '.divCeil', or '.divTrunc'`)
                return null
            }

            return a / b
        }),
        divFloor: cint_binary_dividing((_ctx, _p, a, b) => idivFloor(a, b)),
        divCeil: cint_binary_dividing((_ctx, _p, a, b) => idivCeil(a, b)),
        divTrunc: cint_binary_dividing((_ctx, _p, a, b) => a / b),
        "%": cint_binary_dividing((ctx, p, a, b) => {
            if (b < 0n) {
                ctx.raiseAt(p, `divisor of '%' cannot be negative; try '.rem' or '.mod'`)
                return null
            }

            return a / b
        }),
        rem: cint_binary_dividing((_ctx, _p, a, b) => a % b),
        mod: cint_binary_dividing((_ctx, _p, a, b) => ((a % b) + b) % b),

        "&": cint_binary((_ctx, _p, a, b) => a & b),
        "|": cint_binary((_ctx, _p, a, b) => a | b),
        "~": cint_binary((_ctx, _p, a, b) => a ^ b),

        sign: cint_unary((_ctx, _p, a) => isign(a)),
        abs: cint_unary((_ctx, _p, a) => iabs(a)),

        "<": cint_cmp((a, b) => a < b),
        ">": cint_cmp((a, b) => a > b),
        "<=": cint_cmp((a, b) => a <= b),
        ">=": cint_cmp((a, b) => a >= b),
        "==": cint_cmp((a, b) => a == b),
        "!=": cint_cmp((a, b) => a != b),

        conj,
        into_str(ctx, comptime, _self, p, args) {
            if (args.length !== 1) {
                ctx.raiseAt(p, `'comptime_int.into_str' requires exactly one argument`)
                return ERROR
            }

            const arg = fnArg(ctx, comptime, tcomptime_int, args[0]!)
            if (arg.k !== "normal") return ERROR
            assert(arg.v.value.k === "int")

            return normal(tstr, { k: "str", v: arg.v.value.v.toString() })
        },
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

        conj,
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

        conj,
    },

    comptime_float: BUILTIN_METHODS_F,
    f: BUILTIN_METHODS_F,

    str: {
        "+"(ctx, comptime, _self, p, args) {
            if (args.length !== 2) {
                ctx.raiseAt(p, `'str.@"+"' requires exactly two arguments`)
                return ERROR
            }

            const lhs = fnArg(ctx, comptime, tstr, args[0]!)
            if (lhs.k !== "normal") return ERROR

            const rhs = fnArg(ctx, comptime, tstr, args[1]!)
            if (rhs.k !== "normal") return ERROR

            if (lhs.v.value.k === "str" && rhs.v.value.k === "str") {
                return normal(tstr, { k: "str", v: lhs.v.value.v + rhs.v.value.v })
            }

            ctx.todo(p, `'str.@"+"' must be called at comptime`)
            return ERROR
        },
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

function f_unary(name: Op1, f: (a: number) => number): BuiltinFn {
    return (ctx, comptime, self, p, args) => {
        assert(self.k === "comptime_float" || self.k === "f")

        if (args.length !== 1) {
            ctx.raiseAt(p, "expected exactly one argument")
            return ERROR
        }

        const arg = fnArg(ctx, comptime, self, args[0]!)
        if (arg.k !== "normal") return arg

        if (arg.v.value.k === "float") {
            let value = f(arg.v.value.v)
            if (self.k === "f") {
                value = floatTruncate(self.v, value)
            }
            return normal(self, { k: "float", v: value })
        }

        assert(arg.v.value.k === "runtime" && self.k === "f")
        return ctx.rtResult(self, "op-1", { name, v: arg.v.value.v })
    }
}

function f_binary(
    name: Op2,
    f: (ctx: EvaluationContext, p: Range, a: number, b: number) => number | null,
): BuiltinFn {
    return (ctx, comptime, self, p, args) => {
        assert(self.k === "comptime_float" || self.k === "f")

        if (args.length !== 2) {
            ctx.raiseAt(p, "expected exactly two arguments")
            return ERROR
        }

        const lhs = fnArg(ctx, comptime, self, args[0]!)
        if (lhs.k !== "normal") return lhs

        const rhs = fnArg(ctx, comptime, self, args[1]!)
        if (rhs.k !== "normal") return rhs

        if (lhs.v.value.k === "float" && rhs.v.value.k === "float") {
            let value = f(ctx, p, lhs.v.value.v, rhs.v.value.v)
            if (value === null) return ERROR

            if (self.k === "f") {
                value = floatTruncate(self.v, value)
            }
            return normal(self, { k: "float", v: value })
        }

        if (name === "%") {
            ctx.raiseAt(
                p,
                `'%' is not allowed for non-comptime floating-point values; use '.rem' or '.mod' instead to be explicit about behavior when divisor is zero`,
            )
            return ERROR
        }

        assert(self.k === "f")
        return ctx.rtResult(self, "op-2", {
            name,
            l: ctx.makeRuntime(lhs.v),
            r: ctx.makeRuntime(rhs.v),
        })
    }
}

function f_cmp(name: Op2, f: (a: number, b: number) => boolean): BuiltinFn {
    return (ctx, comptime, self, p, args) => {
        assert(self.k === "comptime_float" || self.k === "f")

        if (args.length !== 2) {
            ctx.raiseAt(p, "expected exactly two arguments")
            return ERROR
        }

        const lhs = fnArg(ctx, comptime, self, args[0]!)
        if (lhs.k !== "normal") return lhs

        const rhs = fnArg(ctx, comptime, self, args[1]!)
        if (rhs.k !== "normal") return rhs

        if (lhs.v.value.k === "float" && rhs.v.value.k === "float") {
            return normal(self, { k: "bool", v: f(lhs.v.value.v, rhs.v.value.v) })
        }

        assert(self.k === "f")
        return ctx.rtResult({ k: "bool", v: null }, "op-2", {
            name,
            l: ctx.makeRuntime(lhs.v),
            r: ctx.makeRuntime(rhs.v),
        })
    }
}

function f_check(name: Op1, f: (a: number) => boolean): BuiltinFn {
    return (ctx, comptime, self, p, args) => {
        if (args.length !== 1) {
            ctx.raiseAt(p, "expected exactly one argument")
            return ERROR
        }

        const arg = fnArg(ctx, comptime, self, args[0]!)
        if (arg.k !== "normal") return arg

        if (arg.v.value.k === "float") {
            const result = f(arg.v.value.v)
            return normal(tbool, { k: "bool", v: result })
        }

        assert(arg.v.value.k === "runtime" && self.k === "f")
        return ctx.rtResult(self, "op-1", { name, v: arg.v.value.v })
    }
}
