export class Coercion {
  constructor(
    readonly from: CoercionTarget,
    readonly into: CoercionTarget,
    readonly auto: boolean,
    readonly exec: (value: Value, block: Block, pos: Pos) => Value,
  ) {}
}

function cycle(from: Type, into: Type, pos: Pos | undefined): never {
  issue(`Coercion cycle detected: ${from} -> ${into}`, pos)
}

export class Coercions {
  private readonly byFrom = new Map<Type, Coercion[]>()
  private readonly byInto = new Map<Type, Coercion[]>()
  private readonly single = new Map<Type, Map<FnType, Coercion>>()

  from(type: Type): Coercion[] {
    return this.byFrom.get(type) ?? []
  }

  into(type: Type): Coercion[] {
    return this.byInto.get(type) ?? []
  }

  for(from: Type, into: FnType): Coercion | null {
    return this.single.get(from)?.get(into) ?? null
  }

  has(from: Type, into: FnType): boolean {
    return !!this.single.get(from)?.has(into)
  }

  can(from: Type, into: FnType): boolean {
    return (
      from == into ||
      into.canConvertFrom(from) ||
      (from instanceof NyaArray &&
      ((into instanceof NyaArray && from.count == into.count) ||
        into instanceof VarArray)
        ? this.can(from.item, into.item)
        : this.has(from, into))
    )
  }

  /** Assumes `.can()` returned true. */
  coerce(from: Value, into: FnType, block: Block, pos: Pos): Value {
    if (from.type == into) {
      return from
    }
    if (into.canConvertFrom(from.type)) {
      return into.convertFrom(from, pos)
    }
    if (
      from.type instanceof NyaArray &&
      ((into instanceof NyaArray && into.count == from.type.count) ||
        into instanceof VarArray)
    ) {
      const cached = block.cache(from, true)
      return block.map(from.type.count, (index, block) =>
        this.coerce(
          new Value(`${cached}[${index}]`, (from.type as NyaArray).item, false),
          into.item,
          block,
          pos,
        ),
      )
    } else {
      return this.for(from.type, into)!.exec(from, block, pos)
    }
  }

  private add(coercion: Coercion, pos: Pos | undefined) {
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

  addCoercion(coercion: Coercion, pos: Pos | undefined) {
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
  private order(pos: Pos | undefined) {
    const { byFrom, byInto } = this
    const unmarked = new Set([...byFrom.keys(), ...byInto.keys()])
    const permanent = new Set<Type>()
    const temporary = new Set<Type>()
    const ret: Type[] = []

    function visit(node: Type) {
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
      `Coercions {` +
      Array.from(this.byFrom)
        .map((x) => "\n  " + x[0] + " -> " + x[1].map((x) => x.into).join(", "))
        .join("") +
      `\n}`
    )
  }
}
