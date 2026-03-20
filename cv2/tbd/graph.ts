export class Node<T, E> {
    readonly incoming: number[] = []
    readonly outgoing: number[] = []

    constructor(
        readonly graph: Graph<T, E>,
        readonly id: number,
        public data: T,
    ) {}
}

export class Edge<T, E> {
    constructor(
        readonly graph: Graph<T, E>,
        readonly id: number,
        readonly from: number,
        readonly into: number,
        public data: E,
    ) {}
}

export class Graph<T, E> {
    readonly nodes: Node<T, E>[] = []
    readonly edges: Edge<T, E>[] = []

    node(value: T): Node<T, E> {
        const node = new Node(this, this.nodes.length, value)
        this.nodes.push(node)
        return node
    }

    edge(from: Node<T, E>, into: Node<T, E>, value: E): Edge<T, E> {
        const edge = new Edge(this, this.edges.length, from.id, into.id, value)
        this.edges.push(edge)
        from.outgoing.push(edge.id)
        into.incoming.push(edge.id)
        return edge
    }
}
