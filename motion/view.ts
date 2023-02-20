// A view manager for Motion.

import { Node } from "./node"
import { Scene } from "./scene"

export class View {
  #nodes: (Node | undefined)[] = []

  get nodes() {
    return this.#nodes
  }

  constructor(readonly scene: Scene) {}

  add(node: Node): () => void {
    const index = this.#nodes.push(node) - 1
    return () => (this.#nodes[index] = undefined)
  }

  clear() {
    this.#nodes = []
  }
}
