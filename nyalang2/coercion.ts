import type { Ctx } from "./ctx"
import { issue } from "./error"
import type { IdLabeled } from "./id"
import { INSPECT } from "./inspect"
import type { FnParams } from "./param"
import type { Pos } from "./pos"
import { T, Ty, type TyData } from "./ty"
import { Val } from "./val"

function isCoercionTarget(ty: Ty) {
  return (
    ty.k == T.Bool
    || ty.k == T.Int
    || ty.k == T.Num
    || (ty.is(T.Adt) && ty.of.adt.plain)
  )
}

export type CoercionFn = (val: Val, ctx: Ctx) => Val

class Coercion {
  constructor(
    readonly from: Ty,
    readonly into: Ty,
    readonly auto: boolean,
    readonly exec: CoercionFn,
  ) {}
}

function cycle(from: Ty, into: Ty, pos: Pos): never {
  issue(`Cycle detected when adding coercion '${from}' -> '${into}'.`, pos)
}

class CoercionsRaw {
  private readonly byFrom = new Map<Ty, Coercion[]>()
  private readonly byInto = new Map<Ty, Coercion[]>()
  private readonly single = new Map<Ty, Map<Ty, Coercion>>()

  from(type: Ty): Coercion[] {
    return this.byFrom.get(type) ?? []
  }

  into(type: Ty): Coercion[] {
    return this.byInto.get(type) ?? []
  }

  for(from: Ty, into: Ty): Coercion | null {
    return this.single.get(from)?.get(into) ?? null
  }

  has(from: Ty, into: Ty): boolean {
    return !!this.single.get(from)?.has(into)
  }

  private add(coercion: Coercion, pos: Pos) {
    if (coercion.from == coercion.into) {
      cycle(coercion.from, coercion.into, pos)
    }

    let from = this.byFrom.get(coercion.from)
    if (!from) {
      from = []
      this.byFrom.set(coercion.from, from)
    }

    let into = this.byInto.get(coercion.into)
    if (!into) {
      into = []
      this.byInto.set(coercion.into, into)
    }

    {
      const idxExisting = from.findIndex((x) => x.into == coercion.into)
      if (idxExisting == -1) {
        from.push(coercion)
      } else {
        const existing = from[idxExisting]!

        if (!coercion.auto) {
          if (existing.auto) {
            from[idxExisting] = coercion
          } else {
            issue(
              `Two coercions added for ${coercion.from}->${coercion.into}`,
              pos,
            )
          }
        }
      }
    }

    {
      const idxExisting = into.findIndex((x) => x.from == coercion.from)
      if (idxExisting == -1) {
        into.push(coercion)
      } else {
        const existing = into[idxExisting]!

        if (!coercion.auto) {
          if (existing.auto) {
            into[idxExisting] = coercion
          } else {
            issue(
              `Two coercions added for ${coercion.from}->${coercion.into}`,
              pos,
            )
          }
        }
      }
    }

    {
      let map = this.single.get(coercion.from)
      if (!map) {
        map = new Map()
        this.single.set(coercion.from, map)
      }

      map.set(coercion.into, coercion)
    }
  }

  addCoercion(coercion: Coercion, pos: Pos) {
    if (coercion.from == coercion.into) {
      cycle(coercion.from, coercion.into, pos)
    }

    // Say `coercion` coerces `B` into `C`. Then there are five steps:
    //
    // 1. Add coercion B->C
    // 2. For all coercions A->B, add A->C
    // 3. For all coercions C->D, add B->D
    // 4. For all coercions A->B and C->D, add A->D
    // 5. Reorder so that if X->Z, then X->Y, then Y->Z is added, we swap so X prefers Y over Z

    this.add(coercion, pos)

    const intoB = this.byInto.get(coercion.from)?.slice() ?? []
    const fromC = this.byFrom.get(coercion.into)?.slice() ?? []

    const B = coercion.from
    const C = coercion.into

    for (const A2B of intoB) {
      const A = A2B.from

      this.add(
        new Coercion(A, C, true, (a, ctx) => {
          const b = A2B.exec(a, ctx)
          const c = coercion.exec(b, ctx)
          return c
        }),
        pos,
      )
    }

    for (const C2D of fromC) {
      const D = C2D.into

      this.add(
        new Coercion(B, D, true, (b, ctx) => {
          const c = coercion.exec(b, ctx)
          const d = C2D.exec(c, ctx)
          return d
        }),
        pos,
      )
    }

    for (const A2B of intoB) {
      const A = A2B.from

      for (const C2D of fromC) {
        const D = C2D.into

        this.add(
          new Coercion(A, D, true, (a, ctx) => {
            const b = A2B.exec(a, ctx)
            const c = coercion.exec(b, ctx)
            const d = C2D.exec(c, ctx)
            return d
          }),
          pos,
        )
      }
    }

    this.order(pos)
  }

  /*! From https://en.wikipedia.org/wiki/Topological_sorting. */
  private order(pos: Pos) {
    const { byFrom, byInto } = this
    const unmarked = new Set([...byFrom.keys(), ...byInto.keys()])
    const permanent = new Set<Ty>()
    const temporary = new Set<Ty>()
    const ret: Ty[] = []

    function visit(node: Ty) {
      if (permanent.has(node)) return
      if (temporary.has(node)) cycle(node, node, pos)

      unmarked.delete(node)
      temporary.add(node)

      for (const m of byFrom.get(node) ?? []) {
        visit(m.into)
      }

      temporary.delete(node)
      permanent.add(node)

      ret.push(node)
    }

    for (const el of unmarked) {
      visit(el)
    }

    // We don't sort `byInto` since only `byFrom` is used for
    for (const entry of this.byFrom.values()) {
      entry.sort((a, b) => ret.indexOf(b.into) - ret.indexOf(a.into))
    }
  }

  [INSPECT]() {
    return (
      `CoercionsRaw {`
      + Array.from(this.byFrom)
        .map((x) => "\n  " + x[0] + " -> " + x[1].map((x) => x.into).join(", "))
        .join("")
      + `\n}`
    )
  }
}

// Let 'primitive' mean 'bool', 'int', 'num', or an AdtPlain type. Then, letting
// `A->B` mean "A coerces to B", these things can be coerced:
//
// - ! -> A, for all A
// - primitive A -> primitive B, if a direct coercion from A->B is defined
// - sym :tag -> AdtPlain T, if T includes a converter function
// - (~?)[A; M, N, ...] -> (~?)[B; M, N, ...], if A->B and (~ on the input) => (~ on the output)
// - (~?)[A; M, N, ...] -> [B], if A->B
// - AdtExt<A> -> AdtExt<B>, if A->B

export const enum Var {
  Coercible, // coercible for ty, <= for const
  Invar, // invariant for ty, == for const
}

export class Coercions {
  readonly #raw = new CoercionsRaw()

  add(pos: Pos, from: Ty, into: Ty, exec: (val: Val, ctx: Ctx) => Val) {
    if (!isCoercionTarget(from)) {
      issue(
        `'${from}' must be a primitive type, struct, or plain extern type in order to create a coercion involving it.`,
        pos,
      )
    }

    if (!isCoercionTarget(into)) {
      issue(
        `'${into}' must be a primitive type, struct, or plain extern type in order to create a coercion involving it.`,
        pos,
      )
    }

    this.#raw.addCoercion(new Coercion(from, into, false, exec), pos)
  }

  can(from: Ty, into: Ty, params: FnParams): boolean {
    // quick catch
    if (from == into) {
      return true
    }

    if (params && into.is(T.Param) && params.has(into.of)) {
      return params.setTy(into.of, from, Var.Coercible)
    }

    switch (from.k) {
      case T.Never:
        return true
      case T.Bool:
      case T.Int:
      case T.Num:
        return this.#raw.has(from, into)
      case T.Sym: {
        const src = from.of as TyData[T.Sym]
        if (into.is(T.Sym)) {
          const dst = into.of
          return (
            (dst.tag ? src.tag == dst.tag : true)
            && this.can(src.el, dst.el, params)
          )
        }
        if (src.tag && into.is(T.Adt)) {
          const dst = into.of
          const converter = dst.adt.syms.get(src.tag)
          if (converter) {
            return this.can(src.el, converter.arg, params)
          }
        }
        return false
      }
      case T.Tuple: {
        const src = from.of as TyData[T.Tuple]
        return (
          into.is(T.Tuple)
          && into.of.length == src.length
          && src.every((x, i) => this.can(x, into.of[i]!, params))
        )
      }
      case T.ArrayFixed: {
        const src = from.of as TyData[T.ArrayFixed]
        if (into.is(T.ArrayFixed)) {
          const dst = into.of
          return (
            this.can(src.el, dst.el, params)
            && src.size.length == dst.size.length
            && src.size.every((x, i) => x.eqTo(dst.size[i]!, params))
          )
        }
        if (into.is(T.ArrayCapped) && src.size.length == 1) {
          const dst = into.of
          return (
            this.can(src.el, dst.el, params)
            && src.size[0]!.leTo(dst.size, params)
          )
        }
        if (into.is(T.ArrayUnsized)) {
          return src.size.length == 1 && this.can(src.el, into.of.el, params)
        }
        return false
      }
      case T.ArrayCapped: {
        const src = from.of as TyData[T.ArrayCapped]
        if (into.is(T.ArrayCapped)) {
          const dst = into.of
          return (
            this.can(src.el, dst.el, params) && src.size.leTo(dst.size, params)
          )
        }
        if (into.is(T.ArrayUnsized)) {
          return this.can(src.el, into.of.el, params)
        }
        return false
      }
      case T.ArrayUnsized: {
        const src = from.of as TyData[T.ArrayUnsized]
        return into.is(T.ArrayUnsized) && this.can(src.el, into.of.el, params)
      }
      case T.Adt: {
        const src = from.of as TyData[T.Adt]
        if (!src.adt.generics) {
          return this.#raw.has(from, into)
        } else if (into.is(T.Adt)) {
          const dst = into.of

          return (
            src.adt == dst.adt
            && src.adt.generics.consts.every((x, i) =>
              x.var == Var.Coercible ?
                src.consts[i]!.leTo(dst.consts[i]!, params)
              : src.consts[i]!.eqTo(dst.consts[i]!, params),
            )
            && src.adt.generics.tys.every((x, i) =>
              x == Var.Coercible ?
                this.can(src.tys[i]!, dst.tys[i]!, params)
              : src.tys[i]!.eq(dst.tys[i]!, params),
            )
          )
        } else {
          return false
        }
      }
      case T.Fn: {
        const src = from.of as TyData[T.Fn]
        return into.is(T.Fn) && src == into.of
      }
      // coercion is really only for desmos, so allowing constraints like
      // `T -> num` seems more problematic than anything
      case T.Param:
        return (
          into.is(T.Param)
          && (into.of satisfies IdLabeled) == (from.of as TyData[T.Param])
        )
    }
  }

  /** Assumes `.can()` returned true, so it doesn't repeat any checks from there. */
  map(ctx: Ctx, val: Val, into: Ty, params: FnParams): Val {
    const from = val.ty
    if (from == into) {
      return val
    }

    const t = ctx.target

    if (into.is(T.Param) && params.has(into.of)) {
      return this.map(ctx, val, params.get(into.of), params)
    }

    switch (from.k) {
      case T.Never:
        // `val` shouldn't actually exist
        return val as never
      case T.Fn:
      case T.Param:
        return val
      case T.Bool:
      case T.Int:
      case T.Num:
        return this.#raw.for(from, into)!.exec(val, ctx)
      case T.Sym: {
        const src = from.of as TyData[T.Sym]
        if (into.is(T.Sym)) {
          const dst = into.of

          // we must also have a const tag if dst has a const tag
          if (dst.tag) {
            return this.map(
              ctx,
              val.transmute(src.el),
              dst.el,
              params,
            ).transmute(into)
          }

          const [tag, el] = t.symSplit(ctx, val as Val<T.Sym>)
          const el2 = this.map(ctx, el, dst.el, params)
          return t.symJoin(ctx, tag, el2)
        } else {
          const dst = into as Ty<T.Adt>
          const cv = dst.of.adt.syms.get(src.tag!)
          return cv!.exec(dst, val.transmute(src.el), ctx)
        }
      }
      case T.ArrayFixed:
      case T.ArrayCapped:
      case T.ArrayUnsized: {
        const dst = into.of as TyData[T.ArrayAny]
        const retEl = dst.el
        const ret = t.arrayMapPure(
          ctx,
          val as Val<T.ArrayFixed | T.ArrayCapped | T.ArrayUnsized>,
          retEl,
          (el) => this.map(ctx, el, retEl, params),
        )
        switch (val.ty.k as T.ArrayAny) {
          case T.ArrayFixed:
            switch (into.k as T.ArrayAny) {
              case T.ArrayFixed:
                return ret
              case T.ArrayCapped:
                return t.arrayToCapped(
                  ctx,
                  ret as Val<T.ArrayFixed>,
                  (into.of as TyData[T.ArrayCapped]).size,
                )
              case T.ArrayUnsized:
                return t.arrayToUnsized(ctx, ret as Val<T.ArrayFixed>)
            }
          case T.ArrayCapped:
            switch (into.k as T.ArrayCapped | T.ArrayUnsized) {
              case T.ArrayCapped:
                return ret
              case T.ArrayUnsized:
                return t.arrayToUnsized(ctx, ret as Val<T.ArrayCapped>)
            }
          case T.ArrayUnsized:
            return ret
        }
      }
      case T.Tuple: {
        const dst = into.of as TyData[T.Tuple]
        const els = t.tupleSplit(ctx, val as Val<T.Tuple>)
        const els2 = els.map((el, i) => this.map(ctx, el, dst[i]!, params))
        return t.tupleJoin(ctx, els2)
      }
      case T.Adt: {
        const src = from.of as TyData[T.Adt]
        if (!src.adt.generics) {
          return this.#raw.for(from, into)!.exec(val, ctx)
        } else {
          return src.adt.generics.coerce!(val, into as Ty<T.Adt>, ctx)
        }
      }
    }
  }
}
