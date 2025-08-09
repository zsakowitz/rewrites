import type { Block } from "./block"
import { issue } from "./error"
import type { Pos } from "./pos"
import { T, Ty, type TyData } from "./ty"
import type { Val } from "./val"

function isCoercionTarget(ty: Ty) {
  return (
    ty.k == T.Bool ||
    ty.k == T.Int ||
    ty.k == T.Num ||
    (ty.is(T.Adt) && ty.of.adt.plain)
  )
}

class Coercion {
  constructor(
    readonly from: Ty,
    readonly into: Ty,
    readonly auto: boolean,
    readonly exec: (block: Block, val: Val, pos: Pos) => Val,
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
            throw new Error(
              `Two coercions added for ${coercion.from}->${coercion.into}`,
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
            throw new Error(
              `Two coercions added for ${coercion.from}->${coercion.into}`,
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
        new Coercion(A, C, true, (a, block, pos) => {
          const b = A2B.exec(a, block, pos)
          const c = coercion.exec(b, block, pos)
          return c
        }),
        pos,
      )
    }

    for (const C2D of fromC) {
      const D = C2D.into

      this.add(
        new Coercion(B, D, true, (b, block, pos) => {
          const c = coercion.exec(b, block, pos)
          const d = C2D.exec(c, block, pos)
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
          new Coercion(A, D, true, (a, block, pos) => {
            const b = A2B.exec(a, block, pos)
            const c = coercion.exec(b, block, pos)
            const d = C2D.exec(c, block, pos)
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

  [Symbol.for("nodejs.util.inspect.custom")]() {
    return (
      `CoercionsRaw {` +
      Array.from(this.byFrom)
        .map((x) => "\n  " + x[0] + " -> " + x[1].map((x) => x.into).join(", "))
        .join("") +
      `\n}`
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

export class Coercions {
  readonly #raw = new CoercionsRaw()

  add(
    pos: Pos,
    from: Ty,
    into: Ty,
    exec: (block: Block, val: Val, pos: Pos) => Val,
  ) {
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

  can(from: Ty, into: Ty): boolean {
    // quick catch
    if (from == into) {
      return true
    }

    switch (from.k) {
      case T.Never:
        return true
      case T.Bool:
      case T.Int:
      case T.Num:
        return this.#raw.has(from, into)
      case T.Adt: {
        const src = from.of as TyData[T.Adt]
        if (!src.adt.generics) {
          return this.#raw.has(from, into)
        } else if (into.is(T.Adt)) {
          const dst = into.of

          return (
            src.adt == dst.adt &&
            src.adt.generics.coerce != null &&
            src.consts.every((x, i) => x.eq(dst.consts[i]!)) &&
            src.tys.every((x, i) => this.can(x, dst.tys[i]!))
          )
        } else {
          return false
        }
      }
      case T.Sym: {
        const src = from.of as TyData[T.Sym]
        if (into.is(T.Sym)) {
          const dst = into.of
          return (
            (dst.tag ? src.tag == dst.tag : true) && this.can(src.el, dst.el)
          )
        }
        if (src.tag && into.is(T.Adt)) {
          const dst = into.of
          const converter = dst.adt.syms.get(src.tag)
          if (converter) {
            return this.can(src.el, converter.arg)
          }
        }
        return false
      }
      case T.Array:
      case T.ArrayCapped: {
        const src = from.of as TyData[T.Array | T.ArrayCapped]
        if (into.is(T.Array) || into.is(T.ArrayCapped)) {
          const dst = into.of
          return (
            (from.k == T.Array || into.k == T.ArrayCapped) &&
            this.can(src.el, dst.el) &&
            src.size.length == dst.size.length &&
            src.size.every((x, i) => dst.size[i] == x)
          )
        }
        if (into.is(T.ArrayUnsized)) {
          return this.can(src.el, into.of.el)
        }
        return false
      }
      case T.ArrayUnsized: {
        const src = from.of as TyData[T.ArrayUnsized]
        return into.is(T.ArrayUnsized) && this.can(src.el, into.of.el)
      }
      case T.Tuple: {
        const src = from.of as TyData[T.Tuple]
        return (
          into.is(T.Tuple) &&
          into.of.length == src.length &&
          src.every((x, i) => this.can(x, into.of[i]!))
        )
      }
      case T.Fn: {
        const src = from.of as TyData[T.Fn]
        return into.is(T.Fn) && src == into.of
      }
    }
  }
}
