import { ANSI } from "../ansi"

const COLORS = [
  ANSI.blue,
  ANSI.cyan,
  ANSI.green,
  ANSI.magenta,
  ANSI.red,
  ANSI.yellow,
]

function idColor(id: number) {
  return COLORS[id % COLORS.length]
}

export class Vertex<T, E> {
  constructor(
    readonly graph: Graph<T, E>,
    readonly id: number,
    public data: T,
  ) {}

  createCycle(size: number, vertexData: T, edgeData: E) {
    if (size <= 0) {
      return
    }

    let base: Vertex<T, E> = this
    const g = this.graph
    for (let i = 0; i < size - 1; i++) {
      g.createEdge(base, (base = g.createVertex(vertexData)), edgeData)
    }
    g.createEdge(base, this, edgeData)
  }

  createBranch1(vertexData: T, edgeData: E) {
    const v = this.graph.createVertex(vertexData)
    this.graph.createEdge(this, v, edgeData)
    return v
  }

  createBranch(size: number, vertexData: T, edgeData: E) {
    if (size <= 0) return this
    let on: Vertex<T, E> = this
    for (let i = 0; i < size; i++) {
      on = on.createBranch1(vertexData, edgeData)
    }
    return on
  }

  toString() {
    return `${idColor(this.id)}#${this.id}${this.data == null ? "" : "=" + this.data}${ANSI.reset}`
  }
}

export class Edge<T, E> {
  constructor(
    readonly graph: Graph<T, E>,
    readonly src: number,
    readonly dst: number,
    public data: E,
  ) {}

  toString() {
    const data = this.data == null ? "" : `${ANSI.dim}(${this.data})`
    return `${idColor(this.src)}${this.src}${ANSI.reset} ${ANSI.dim}->${ANSI.reset} ${idColor(this.dst)}${this.dst}${ANSI.reset} ${data}${ANSI.reset}`
  }
}

export class Graph<T = void, E = void> {
  readonly vl: Vertex<T, E>[] = []
  readonly el: Edge<T, E>[] = []
  readonly ev: Edge<T, E>[][] = []

  createVertex(data: T) {
    const id = this.vl.length
    const v = new Vertex(this, id, data)
    this.vl.push(v)
    return v
  }

  createEdge(a: Vertex<T, E>, b: Vertex<T, E>, data: E) {
    const edge = new Edge(this, a.id, b.id, data)
    this.el.push(edge)
    ;(this.ev[a.id] ??= []).push(edge)
    ;(this.ev[b.id] ??= []).push(edge)
    return edge
  }

  logVertices() {
    console.log(this.vl.join(ANSI.dim + ", " + ANSI.reset))
  }

  logEdges() {
    console.log(this.el.join("\n"))
  }

  logGraph() {
    this.logVertices()
    this.logEdges()
  }
}

const g = new Graph<0 | 1 | void>()
const center = g.createVertex()
center.createCycle(3)
center.createBranch(2)
g.logGraph()
