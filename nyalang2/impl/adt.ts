import type { Ctx } from "./ctx"
import type { IdGlobal } from "./id"
import type { FnParams } from "./param"
import { T, Ty } from "./ty"
import type { Val } from "./val"
import type { Var } from "./variance"

export class AdtSym {
    constructor(
        readonly sym: IdGlobal,
        readonly arg: Ty,
        readonly exec: (self: Ty<T.Adt>, arg: Val, ctx: Ctx) => Val,
    ) {}
}

interface AdtGenerics {
    coerce(
        src: Val<T.Adt>,
        dst: Ty<T.Adt>,
        ctx: Ctx,
        params: FnParams | null,
    ): Val
    readonly tys: readonly Var[]
    readonly consts: readonly { ty: Ty<T.Const>; var: Var }[]
}

export class Adt {
    constructor(
        readonly id: IdGlobal,
        /** For constructing this ADT from a `sym`. */
        readonly syms: ReadonlyMap<IdGlobal, AdtSym>,
        readonly generics: AdtGenerics | null,
        readonly has0: (ty: Ty<T.Adt>) => boolean,
        readonly has1: (ty: Ty<T.Adt>) => boolean,
        readonly toRuntime: (ctx: Ctx, val: Val<T.Adt>) => string | null,
    ) {}

    /** `true` if this ADT uses no generics. */
    get plain() {
        return !this.generics
    }

    get label() {
        return this.id.label
    }
}
