import { type NodeObject } from "force-graph"
import { ANSI } from "../../ansi"

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

  get edges() {
    return this.graph.ev[this.id] ?? []
  }

  cycle(size: number, vertexData: T, edgeData: E) {
    if (size <= 0) {
      return
    }

    let base: Vertex<T, E> = this
    const g = this.graph
    for (let i = 0; i < size - 1; i++) {
      g.edge(base, (base = g.vertex(vertexData)), edgeData)
    }
    g.edge(base, this, edgeData)
  }

  rect(rows: number, cols: number, vertexData: T, edgeData: E) {
    let base: Vertex<T, E> = this
    const heads: Vertex<T, E>[] = [this]

    for (let i = 1; i < cols; i++) {
      heads.push((base = base.branch1(vertexData, edgeData)))
    }

    for (let r = 1; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const above = heads[c]!
        const lhs = heads[c - 1]
        const self = above.branch1(vertexData, edgeData)
        if (lhs) this.graph.edge(self, lhs, edgeData)
        heads[c] = self
      }
    }
  }

  branch1(vertexData: T, edgeData: E) {
    const v = this.graph.vertex(vertexData)
    this.graph.edge(this, v, edgeData)
    return v
  }

  branch(size: number, vertexData: T, edgeData: E) {
    if (size <= 0) return this
    let on: Vertex<T, E> = this
    for (let i = 0; i < size; i++) {
      on = on.branch1(vertexData, edgeData)
    }
    return on
  }

  toString() {
    return `${idColor(this.id)}#${this.id}${this.data == null ? "" : "=" + this.data}${ANSI.reset}`
  }
}

export interface Vertex<T, E> extends NodeObject {}

export class Edge<T, E> {
  source: any
  target: any

  constructor(
    readonly graph: Graph<T, E>,
    readonly sid: number,
    readonly did: number,
    public data: E,
  ) {
    this.source = sid
    this.target = did
  }

  get src() {
    return this.graph.vl[this.sid]!
  }

  get dst() {
    return this.graph.vl[this.did]!
  }

  toString() {
    const data = this.data == null ? "" : `${ANSI.dim}(${this.data})`
    return `${idColor(this.sid)}${this.sid}${ANSI.reset} ${ANSI.dim}->${ANSI.reset} ${idColor(this.did)}${this.did}${ANSI.reset} ${data}${ANSI.reset}`
  }
}

export class Graph<T = void, E = void> {
  readonly vl: Vertex<T, E>[] = []
  readonly el: Edge<T, E>[] = []
  readonly ev: Edge<T, E>[][] = []

  vertex(data: T) {
    const id = this.vl.length
    const v = new Vertex(this, id, data)
    this.vl.push(v)
    return v
  }

  edge(a: Vertex<T, E>, b: Vertex<T, E>, data: E) {
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
