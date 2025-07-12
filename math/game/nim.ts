import { GameEq } from "."

export class Nim extends GameEq<unknown> {
  constructor(public size: number) {
    super()
  }

  moves(): readonly unknown[] {
    return this.size > 0 ? [0] : []
  }

  move(): void {
    this.size--
  }

  undo(): void {
    this.size++
  }
}
