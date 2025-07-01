import { ANSI } from "../ansi"

console.clear()

type EdgeKind = 1 | 2 | 3
type Vertex = number & { readonly __brand_vertex: unique symbol }

const KINDS = ["", ANSI.red + "P1", ANSI.blue + "P2", ANSI.green + "MX"]
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

  debug() {
    this.checkAccess()
    console.log(this.edges.join("\n"))
  }
}

const g = new Graph()
const v1 = GROUND
const v2 = g.createVertex()
const v3 = g.createVertex()
const v4 = g.createVertex()
g.createEdge(v1, v2, 1)
g.createEdge(v2, v3, 2)
g.createEdge(v1, v4, 2)
g.edges[0]!.hacked = true
g.debug()
