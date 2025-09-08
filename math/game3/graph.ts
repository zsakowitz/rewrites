import { mex, type NimValue } from "../game2/nim"

class Node<V, E> {
  readonly outgoing: Edge<V, E>[] = []
  readonly incoming: Edge<V, E>[] = []
  readonly edges: Edge<V, E>[] = []

  constructor(
    readonly graph: Graph<V, E>,
    public data: V,
  ) {
    graph.nodes.push(this)
  }

  link(into: Node<V, E>, data: E): Edge<V, E> {
    return new Edge(this.graph, this, into, data)
  }

  branch(edgeCount: number, nodeData: V, edgeData: E): Node<V, E> {
    let from: Node<V, E> = this
    for (let i = 0; i < edgeCount; i++) {
      from.link((from = new Node(this.graph, nodeData)), edgeData)
    }
    return from
  }

  cycle(edgeCount: number, nodeData: V, edgeData: E): Node<V, E> {
    this.branch(edgeCount - 1, nodeData, edgeData).link(this, edgeData)
    return this
  }

  with(data: V): Node<V, E> {
    this.data = data
    return this
  }
}

class Edge<V, E> {
  constructor(
    readonly graph: Graph<V, E>,
    readonly from: Node<V, E>,
    readonly into: Node<V, E>,
    public data: E,
  ) {
    from.outgoing.push(this)
    into.incoming.push(this)
    from.edges.push(this)
    if (from != into) into.edges.push(this)
    graph.edges.push(this)
  }

  with(data: E): Edge<V, E> {
    this.data = data
    return this
  }
}

class Graph<V, E> {
  readonly nodes: Node<V, E>[] = []
  readonly edges: Edge<V, E>[] = []

  node(data: V) {
    return new Node(this, data)
  }

  edge(from: Node<V, E>, into: Node<V, E>, data: E) {
    return new Edge<V, E>(this, from, into, data)
  }

  toString() {
    return this.edges
      .map(
        (x) => `${this.nodes.indexOf(x.from)} -> ${this.nodes.indexOf(x.into)}`,
      )
      .join("\n")
  }
}

function evaluateFruits(g: Graph<boolean | void, void>): NimValue {
  const vals: NimValue[] = []

  for (const node of g.nodes) {
    if (node.data != null) continue

    if (
      node.outgoing.every((x) => x.into.data != true)
      && node.incoming.every((x) => x.from.data != true)
    ) {
      node.data = true
      vals.push(evaluateFruits(g))
      node.data = undefined
    }

    if (
      node.outgoing.every((x) => x.into.data != false)
      && node.incoming.every((x) => x.from.data != false)
    ) {
      node.data = false
      vals.push(evaluateFruits(g))
      node.data = undefined
    }
  }

  return mex(vals)
}

const g = new Graph<boolean | void, void>()
const x = g.node(false)
const y = x.branch(1)
y.branch(1)
y.branch(2)
x.branch(1)
console.log("" + g)
console.log("*" + evaluateFruits(g))
