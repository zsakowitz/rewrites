import type * as Bun from "bun"
import type { BunInspectOptions } from "bun"
import { INSPECT } from "./inspect"
import { Param, ParamKind, type FnParams } from "./param"
import type { T, Ty } from "./ty"

type ConstVal<K extends T.Const> =
    | (K extends T.Bool ? boolean : never)
    | (K extends T.Int ? number : never)
    | Param<ParamKind.Const>

export class Const<
    K extends T.Const = T.Const,
    V extends ConstVal<K> = ConstVal<K>,
> {
    static Param<K extends T.Const>(label: string, k: Ty<K>) {
        return new Const(new Param(label, ParamKind.Const), k)
    }

    constructor(
        readonly value: V,
        readonly ty: Ty<K>,
    ) {}

    get const() {
        return typeof this.value != "object"
    }

    with(params: FnParams): Const<K> {
        if (params && this.value instanceof Param && params.has(this.value)) {
            return params.get(this.value) satisfies Const as any
        }

        return this
    }

    /**
     * If this returns `true`, `this` can be assigned to `other` under `params`.
     * The converse might not be true: `0.eqTo(T)`, but `!T.eqTo(0)` for generic
     * `T`.
     */
    eqTo(other: Const, params: FnParams | null): boolean {
        if (this.ty !== other.ty) {
            return false
        }

        return (
            this.value === other.value
            || (other.value instanceof Param
                && params != null
                && params.has(other.value)
                && params.setConst(other.value, this))
        )
    }

    /**
     * If this returns `true`, `this <= other`. The converse is not true, since `T
     * <= U` cannot be proven in general for generics `T` and `U`.
     */
    leTo(other: Const, params: FnParams | null): boolean {
        return (
            (typeof this.value == "number"
                && typeof other.value == "number"
                && this.value <= other.value)
            || this.eqTo(other, params)
        )
    }

    is0() {
        return this.value === 0
    }

    toString() {
        if (typeof this.value == "object") {
            return `${this.value.label}: ${this.ty}`
        }
        return `${this.value}: ${this.ty}`
    }

    valToString() {
        if (typeof this.value == "object") {
            return this.value.label
        }
        return "" + this.value
    }

    [INSPECT](_: unknown, p: BunInspectOptions, inspect: typeof Bun.inspect) {
        if (typeof this.value == "object") {
            return `${this.value.label}: ${this.ty}`
        }
        return `${inspect(this.value, p)}: ${inspect(this.ty, p)}`
    }
}
