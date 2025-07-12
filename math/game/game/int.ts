import { Game, Player } from ".."

export class Int extends Game<Player> {
  constructor(public count: number) {
    super()
  }

  moves(player: Player): readonly Player[] {
    return Math.sign(this.count) == player ? [player] : []
  }

  move(move: Player): void {
    this.count -= move
  }

  undo(move: Player): void {
    this.count += move
  }
}
