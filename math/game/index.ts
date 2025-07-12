export const Player = Object.freeze({
  Left: -1,
  Right: 1,
})

export type Player = (typeof Player)[keyof typeof Player]

export function opponent(player: Player) {
  return player == Player.Left ? Player.Right : Player.Left
}

export const Sign = Object.freeze({
  Zero: 0,
  Left: -1,
  Right: 1,
  Star: 3,
})

export type Sign = (typeof Sign)[keyof typeof Sign]

export abstract class Game<T> {
  abstract moves(player: Player): readonly T[]
  abstract move(move: T): void
  abstract undo(move: T): void

  /** Determines who wins, given the first player. */
  winner(player: Player): Player {
    const opp = opponent(player)
    const moves = this.moves(player)
    if (moves.length == 0) {
      return opp
    }

    for (let i = 0; i < moves.length; i++) {
      const mv = moves[i]!
      this.move(mv)
      const sign = this.winner(opp)
      this.undo(mv)
      if (sign == player) {
        return player
      }
    }

    return opp
  }

  /**
   * Determines the sign of the position's value. -1, 0, and 1 are all defined
   * as usual; star represents any position where the first player to move
   * wins.
   */
  sign(): Sign {
    const lOnL = this.winner(Player.Left) == Player.Left
    const lOnR = this.winner(Player.Right) == Player.Left

    return lOnL
      ? lOnR
        ? Player.Left
        : Sign.Star
      : lOnR
        ? Sign.Zero
        : Player.Right
  }
}

/**
 * A special kind of game where both players have the same set of moves
 * available.
 */
export abstract class GameEq<T> extends Game<T> {
  abstract moves(): readonly T[]

  sign(): Sign {
    const lOnL = this.winner(Player.Left) == Player.Left
    return lOnL ? Sign.Star : Sign.Zero
  }
}
