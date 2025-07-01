import { ANSI } from "../ansi"

type EdgeKind = 1 | 2 | 3
type Vertex = number

const KINDS = ["", ANSI.blue + "P1", ANSI.red + "P2", ANSI.green + "MX"]
const HACKED = ["", ANSI.strikethrough]
const GROUNDED = [ANSI.dim, ""]

class Edge {
  hacked = false
  grounded = false

  constructor(
    readonly src: Vertex,
    readonly dst: Vertex,
    readonly kind: EdgeKind,
  ) {}

  toString() {
    return `${HACKED[+this.hacked]}${GROUNDED[+this.grounded]}${KINDS[this.kind]} ${this.src} -> ${this.dst}${ANSI.reset}`
  }
}

const GROUND = 0 as Vertex

interface ScoreRange {
  lhs: number
  rhs: number
  inv: boolean
}

class Graph {
  readonly edges: Edge[] = []
  readonly #edges: Edge[][] = [[]]

  createVertex(): Vertex {
    return (this.#edges.push([]) - 1) as Vertex
  }

  createEdge(src: Vertex, dst: Vertex, kind: EdgeKind) {
    const edge = new Edge(src, dst, kind)
    this.edges.push(edge)
    ;(this.#edges[src] ??= []).push(edge)
    ;(this.#edges[dst] ??= []).push(edge)
  }

  #markGroundedFrom(vertex: Vertex, marked: Set<Vertex>) {
    if (marked.has(vertex)) return
    marked.add(vertex)
    const edges = this.#edges[vertex]
    if (!edges) return

    for (const edge of edges) {
      if (!(edge.hacked || edge.grounded)) {
        edge.grounded = true
        this.#markGroundedFrom(edge.dst != vertex ? edge.dst : edge.src, marked)
      }
    }
  }

  checkAccess() {
    for (const edgeList of this.#edges) {
      for (const edge of edgeList) {
        edge.grounded = false
      }
    }

    this.#markGroundedFrom(GROUND, new Set<Vertex>())
  }

  logValue() {
    console.log(
      {
        0: "=" + this.#adjustment,
        1: ">" + this.#adjustment,
        [-1]: "<" + this.#adjustment,
        3: "*",
      }[this.side()],
    )
  }

  logExact() {
    console.log(this.getExact())
  }

  logEdges() {
    console.log(this.edges.join("\n"))
  }

  #wins(self: 1 | 2, opponent: 1 | 2): boolean {
    this.checkAccess()
    const picks = this.edges.filter((x) => x.grounded && x.kind & self)
    return picks.some((edge) => {
      edge.hacked = true
      const w = !this.#wins(opponent, self)
      edge.hacked = false
      return w
    })
  }

  side() {
    const does1WinFirst = this.#wins(1, 2)
    const does2WinFirst = this.#wins(2, 1)
    if (does1WinFirst && does2WinFirst) {
      return 3
    } else if (does1WinFirst) {
      return 1
    } else if (does2WinFirst) {
      return -1
    } else {
      return 0
    }
  }

  clone() {
    const g = new Graph()
    for (const e of this.edges) {
      g.createEdge(e.src, e.dst, e.kind)
    }
    return g
  }

  range(): [ScoreRange, Graph] {
    const MAX = 16
    const self = this.clone()
    const base = self.side()
    switch (base) {
      case 0:
      case 3:
        return [{ lhs: 0, rhs: 0, inv: base == 3 }, self]
      case 1:
        for (let i = 1; i <= MAX; i++) {
          const vNext = self.createVertex()
          self.createEdge(GROUND, vNext, 2)
          const base = self.side()
          switch (base) {
            case 0:
            case 3:
              return [{ lhs: i, rhs: i, inv: base == 3 }, self]
            case -1:
              return [{ lhs: i - 1, rhs: i, inv: false }, self]
          }
        }
        return [{ lhs: MAX, rhs: Infinity, inv: false }, self]
      case -1:
        for (let i = 1; i <= MAX; i++) {
          const vNext = self.createVertex()
          self.createEdge(GROUND, vNext, 1)
          const base = self.side()
          switch (base) {
            case 0:
            case 3:
              return [{ lhs: -i, rhs: -i, inv: base == 3 }, self]
            case 1:
              return [{ lhs: -i, rhs: -i + 1, inv: false }, self]
          }
        }
        return [{ lhs: -Infinity, rhs: -MAX, inv: false }, self]
    }
  }

  #adjustment = 0
  offsetBy(score: number) {
    this.#adjustment += score
    while (score >= 1) {
      this.createEdge(GROUND, this.createVertex(), 2)
      score--
    }
    while (score < 0) {
      this.createEdge(GROUND, this.createVertex(), 1)
      score++
    }
    if (score == 0) {
      return
    }

    let base = GROUND
    let scale = 1
    let value = 0
    for (let i = 0; i < 16; i++) {
      if (value == score) break

      if (value < score) {
        this.createEdge(base, (base = this.createVertex()), 2)
        value += scale
      } else {
        this.createEdge(base, (base = this.createVertex()), 1)
        value -= scale
      }

      scale /= 2
    }
  }

  getExact() {
    const side = this.side()
    if (side == 0) {
      return "0"
    } else if (side == 3) {
      return "~0"
    }

    let lo = 0
    while (true) {
      lo += side
      const cloned = this.clone()
      cloned.offsetBy(side)
      const nextSide = cloned.side()
      if (nextSide == 0) {
        return "" + lo
      } else if (nextSide == 3) {
        return `~${lo}`
      } else if (nextSide != side) {
        break
      }
    }

    let hi
    if (side == -1) {
      hi = lo + 1
    } else {
      hi = lo
      lo = lo - 1
    }

    return `${lo}..${hi}`
  }
}

const g = new Graph()

g.createEdge(0, 1, 2)
g.createEdge(1, 2, 1)

g.logEdges()
g.logExact()
