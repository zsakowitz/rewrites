import { Action, ActionIterator } from "./action"
import { Node } from "./node"

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class View {
  #nodes: Node[] = []

  add(node: Node) {
    this.#nodes.push(node)
  }

  render(context: CanvasRenderingContext2D) {
    // context.clearRect(0, 0, context.canvas.width, context.canvas.height)

    for (const node of this.#nodes) {
      node.render(context)
    }
  }
}

export class Scene {
  #actionMaker: (view: View) => Action
  #action: ActionIterator
  #view = new View()
  #frame = 0

  constructor(action: (view: View) => Action) {
    this.#actionMaker = action
    this.#action = action(this.#view)[Symbol.iterator]()
    this.#frame = 0
  }

  get frame() {
    return this.#frame
  }

  next() {
    const { done } = this.#action.next()
    this.#frame++
    return done || false
  }

  render(context: CanvasRenderingContext2D) {
    this.#view.render(context)
  }

  reset() {
    this.#view = new View()
    this.#action = this.#actionMaker(this.#view)[Symbol.iterator]()
  }
}
