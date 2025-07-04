import ForceGraph from "force-graph"
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

  createCycle(size: number, vertexData: T, edgeData: E) {
    if (size <= 0) {
      return
    }

    let base: Vertex<T, E> = this
    const g = this.graph
    for (let i = 0; i < size - 1; i++) {
      g.createEdge(base, (base = g.createHouse(vertexData)), edgeData)
    }
    g.createEdge(base, this, edgeData)
  }

  createBranch1(vertexData: T, edgeData: E) {
    const v = this.graph.createHouse(vertexData)
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

  createHouse(data: T) {
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

  display() {
    const el = document.createElement("div")
    document.body.append(el)
    const graph = new ForceGraph<Vertex<T, E>, Edge<T, E>>(el)
    graph.graphData({ nodes: this.vl, links: this.el })
    return graph
  }
}
