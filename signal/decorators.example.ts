// #::exclude

import { memo, signal } from "./decorators"

export class Adder {
  @signal
  accessor x = 0

  @signal
  accessor y = 0

  @memo
  get sum() {
    return this.x + this.y
  }
}
