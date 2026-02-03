import { Adt } from "../impl/adt"
import { Const } from "../impl/const"
import { Fn } from "../impl/fn"
import { ident } from "../impl/id"
import { FnParamsTempl } from "../impl/param"
import { Int, T, Ty } from "../impl/ty"
import { Var } from "../impl/variance"

function repr(ty: Ty<T.Adt>) {
    return new Ty(T.ArrayFixed, {
        el: ty.of.tys[0]!,
        size: ty.of.consts as [Const<T.Int>, Const<T.Int>],
    })
}

export const Matrix = new Adt(
    ident("Matrix"),
    new Map(),
    {
        coerce(src, dst, ctx, params) {
            return src
                .transmute(repr(src.ty))
                .coerce(ctx, repr(dst), params)
                .transmute(dst)
        },
        consts: [
            { ty: Int, var: Var.Invar },
            { ty: Int, var: Var.Invar },
        ],
        tys: [Var.Coercible],
    },
    (ty) => ty.of.tys[0]!.has0 && !ty.of.consts.some((x) => x.is0()),
    (ty) =>
        (ty.of.tys[0]!.has1 && ty.of.consts.some((x) => x.is0()))
        || (ty.of.tys[0]!.has0 && ty.of.consts.some((x) => x.is0())),
    (ctx, val) => val.transmute(repr(val.ty)).runtime(ctx),
)

const R = Const.Param("R", Int)
const C = Const.Param("C", Int)
const U = Ty.Param("U")
export const matrixFn = new Fn(
    ident("matrix"),
    new FnParamsTempl()
        .setConst(R, Var.Invar)
        .setConst(C, Var.Invar)
        .setTy(U, Var.Coercible),
    [ident("array")],
    [new Ty(T.ArrayFixed, { el: U, size: [R, C] })],
    new Ty(T.Adt, { adt: Matrix, tys: [U], consts: [R, C] }),
    [],
    (_, [arg]) => arg!,
)
