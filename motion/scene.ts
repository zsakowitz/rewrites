import { Action, ActionIterator } from "./action"
import { signal, untrack } from "./signal"
import { View } from "./view"

export class Scene {
  private readonly view = new View(this)
  private action: ActionIterator
  readonly frame = signal(0)

  constructor(private readonly initializer: (view: View) => Action) {
    this.action = initializer(this.view)[Symbol.iterator]()
  }

  /** Renders the current state of the scene onto a canvas. */
  async render(context: CanvasRenderingContext2D): Promise<void> {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height)

    context.save()

    for (const node of this.view.nodes) {
      node?.render(context)
    }

    context.restore()
  }

  /**
   * Advances the state of this scene one frame forward.
   *
   * @returns A boolean indicating whether the scene has completed.
   */
  async next(): Promise<boolean> {
    const done = this.action.next().done || false

    if (!done) {
      this.frame(untrack(this.frame) + 1)
    }

    return done
  }

  /** Resets the state of this scene. */
  async reset(): Promise<void> {
    this.frame(0)
    this.view.clear()
    this.action = this.initializer(this.view)[Symbol.iterator]()
  }
}
