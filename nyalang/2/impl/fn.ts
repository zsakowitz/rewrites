import type { BunInspectOptions } from "bun"
import type { Constraint } from "./constraint"
import type { Ctx } from "./ctx"
import type { IdGlobal } from "./id"
import { INSPECT } from "./inspect"
import { type FnParamsTempl, type Param } from "./param"
import type { Ty } from "./ty"
import type { UntypedVal, Val } from "./val"

export type FnName = IdGlobal | Param

interface FnArg {
    name: IdGlobal
    ty: Ty
}

export class FnSignature {
    constructor(
        readonly id: FnName,
        readonly args: readonly Ty[],
        readonly ret: Ty,
    ) {}

    [INSPECT](d: number, p: BunInspectOptions, inspect: typeof Bun.inspect) {
        return `fn ${this.id.label}(${this.args.map((x) => inspect(x, p))}) -> ${inspect(this.ret, p)}`
    }
}

export class Fn extends FnSignature {
    /**
     * Whether or not this "collects" its arguments into a single array parameter.
     * True iff this `Fn` accepts a single array.
     */
    readonly collects

    constructor(
        id: IdGlobal | Param,
        readonly params: FnParamsTempl,
        readonly argn: readonly IdGlobal[],
        args: readonly Ty[],
        ret: Ty,
        readonly where: Constraint[],
        /** The return type of `exec` is replaced with `ret`. */
        readonly exec: (ctx: Ctx, args: Val[]) => UntypedVal,
    ) {
        super(id, args, ret)
        this.collects = this.args.length == 1 && this.args[0]!.isArray()
    }

    [INSPECT](d: number, p: BunInspectOptions, inspect: typeof Bun.inspect) {
        const head = `fn ${this.id.label}${
            this.params.map.size ?
                `<${Array.from(this.params.map).map(([, v]) => inspect(v, p))}>`
            :   ""
        }(${this.argn.map((x, i) => `${x.label}: ${inspect(this.args[i]!, p)}`)}) -> ${inspect(this.ret, p)}`
        if (!this.where.length) {
            return head
        }
        const where = this.where.map((x) => inspect(x, p))
        return (
            head
            + "\n  where "
            + where[0]!
            + where
                .slice(1)
                .map((x) => `\n        ${x}`)
                .join("")
        )
    }
}
