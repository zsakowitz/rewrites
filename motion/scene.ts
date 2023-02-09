import { Action, ActionIterator } from "./action"
import { View } from "./view"

export class Scene {
  private readonly view = new View(this)
  private action: ActionIterator

  constructor(private readonly initializer: (view: View) => Action) {
    this.action = initializer(this.view)[Symbol.iterator]()
  }

  /** Renders the current state of the scene onto a canvas. */
  async render(context: CanvasRenderingContext2D): Promise<void> {
    context.save()

    for (const path of this.view.nodes) {
      path?.render(context)
    }

    context.restore()
  }

  /** Advances the state of this scene one frame forward. */
  async next(): Promise<void> {
    this.action.next()
  }

  /** Resets the state of this scene. */
  async reset(): Promise<void> {
    this.view.clear()
    this.action = this.initializer(this.view)[Symbol.iterator]()
  }
}
