// An experiment to ensure the logic for project nya's coercion system will work
// before implementing it in the (admittedly more complicated) actual codebase.

function cycle(from: string, into: string) {
  throw new Error(`Coercion cycle detected: ${from}->${into}`)
}

class Fn {
  constructor(
    readonly from: string,
    readonly into: string,
    /**
     * Whether this coercion was created as an "implied" coercion. A more
     * efficient or direct coercion may be available if the user specifies it
     * manually.
     */
    readonly auto: boolean,
    readonly exec: (x: number) => number,
  ) {}
}

class Coercions {
  readonly byFrom = new Map<string, Fn[]>()
  readonly byInto = new Map<string, Fn[]>()

  private add(coercion: Fn) {
    if (coercion.from == coercion.into) {
      cycle(coercion.from, coercion.into)
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
  }

  addCoercion(coercion: Fn) {
    if (coercion.from == coercion.into) {
      cycle(coercion.from, coercion.into)
    }

    // Say `coercion` coerces `B` into `C`. Then there are five steps:
    //
    // 1. Add coercion B->C
    // 2. For all coercions A->B, add A->C
    // 3. For all coercions C->D, add B->D
    // 4. For all coercions A->B and C->D, add A->D
    // 5. Reorder so that if X->Z, then X->Y, then Y->Z is added, we swap so X prefers Y over Z

    this.add(coercion)

    const intoB = this.byInto.get(coercion.from)?.slice() ?? []
    const fromC = this.byFrom.get(coercion.into)?.slice() ?? []

    const B = coercion.from
    const C = coercion.into

    for (const A2B of intoB) {
      const A = A2B.from

      this.add(
        new Fn(A, C, true, (a) => {
          const b = A2B.exec(a)
          const c = coercion.exec(b)
          return c
        }),
      )
    }

    for (const C2D of fromC) {
      const D = C2D.into

      this.add(
        new Fn(B, D, true, (b) => {
          const c = coercion.exec(b)
          const d = C2D.exec(c)
          return d
        }),
      )
    }

    for (const A2B of intoB) {
      const A = A2B.from

      for (const C2D of fromC) {
        const D = C2D.into

        this.add(
          new Fn(A, D, true, (a) => {
            const b = A2B.exec(a)
            const c = coercion.exec(b)
            const d = C2D.exec(c)
            return d
          }),
        )
      }
    }

    this.order()
  }

  /*! From https://en.wikipedia.org/wiki/Topological_sorting. */
  private order() {
    const { byFrom, byInto } = this
    const unmarked = new Set([...byFrom.keys(), ...byInto.keys()])
    const permanent = new Set<string>()
    const temporary = new Set<string>()
    const ret: string[] = []

    function visit(node: string) {
      if (permanent.has(node)) return
      if (temporary.has(node)) cycle(node, node)

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

const c = new Coercions()

function x(x: string, y: string) {
  c.addCoercion(new Fn(x, y, false, (x) => x))
}

x("r64", "c64")
x("rabs32", "r32")
x("angle", "q32")
x("r32", "q32")
x("r32", "c32")
x("c32", "q32")
x("r64", "r32")
x("c64", "c32")
x("rabs64", "r64")
x("angle", "rabs32")

console.log(c)
