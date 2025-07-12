import { GameEq } from ".."

export class Empty extends GameEq<never> {
  moves(): readonly never[] {
    return []
  }

  move(): void {}

  undo(): void {}
}
