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
        0: "=0",
        1: ">0",
        "-1": "<0",
        3: "*",
      }[this.#side()],
    )
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

  #side() {
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

  #clone() {
    const g = new Graph()
    for (const e of this.edges) {
      g.createEdge(e.src, e.dst, e.kind)
    }
    return g
  }

  #offsetBy(score: number) {
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
      if (value == score) {
        break
      } else if (value < score) {
        this.createEdge(base, (base = this.createVertex()), 2)
        value += scale
      } else {
        this.createEdge(base, (base = this.createVertex()), 1)
        value -= scale
      }

      scale /= 2
    }
  }

  #sideOfScore(score: number) {
    const clone = this.#clone()
    clone.#offsetBy(score)
    return clone.#side()
  }

  sideOf(score: number | [number, number]) {
    if (Array.isArray(score)) {
      let [lo, hi] = score
      if (lo > hi) {
        ;[lo, hi] = [hi, lo]
      }
      const los = this.#sideOfScore(lo)
      const his = this.#sideOfScore(hi)
      if (los == 0) return lo
      if (his == 0) return hi
      if (los == 3) return `*${lo}`
      if (his == 3) return `*${hi}`
      if (los == 1) {
        if (his == -1) return `${lo} .. ${hi}`
        else return `>${lo}`
      } else {
        if (his == 1) return `*(${lo} .. ${hi})`
        else return `<${lo}`
      }
    }
    return {
      "0": score,
      "3": `*${score}`,
      "-1": `<${score}`,
      "1": `>${score}`,
    }[this.#sideOfScore(score)]
  }

  bisectOn(lo: number, hi: number, max = 32): number | [number, number] {
    if (this.#sideOfScore(lo) != 1) {
      return lo
    }

    if (this.#sideOfScore(hi) != -1) {
      return hi
    }

    for (let i = 0; i < max; i++) {
      const mid = (lo + hi) / 2
      switch (this.#sideOfScore(mid)) {
        case 0:
        case 3:
          return mid
        case 1:
          lo = mid
          break
        case -1:
          hi = mid
          break
      }
    }

    return [lo, hi]
  }

  logBisection(lo = -16, hi = lo + 32, max?: number) {
    const score = this.bisectOn(lo, hi, max)
    console.log(this.sideOf(score))
  }
}

const g = new Graph()

g.createEdge(0, 1, 3)
g.createEdge(0, 2, 3)
g.createEdge(1, 2, 1)
g.createEdge(0, 3, 3)
// g.createEdge(1, 3, 1)
// g.createEdge(0, 1, 1)
// g.createEdge(1, 3, 3)
// g.createEdge(0, 2, 2)
// g.createEdge(2, 4, 3)
// g.createEdge(3, 4, 3)
// g.createEdge(0, 5, 1)
g.logEdges()
g.logBisection()
