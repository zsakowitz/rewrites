import { Game, Player } from ".."

export interface DyadicMove {
  fexp: number
  fsize: number
  nexp: number
  nsize: number
}

export class Dyadic extends Game<DyadicMove> {
  constructor(
    public size: number,
    public exp: number,
  ) {
    while (size % 2 == 0 && exp != 0) {
      exp--
      size /= 2
    }
    super()
  }

  moves(player: Player): readonly DyadicMove[] {
    if (this.exp == 0) {
      if (this.size == player) {
        return [{ fexp: 0, fsize: player, nexp: 0, nsize: 0 }]
      } else {
        return []
      }
    }

    return [
      {
        fexp: this.exp,
        fsize: this.size,
        nexp: this.exp - 1,
        nsize: (this.size - player) / 2,
      },
    ]
  }

  move({ nexp: exp, nsize: size }: DyadicMove): void {
    while (size % 2 == 0 && exp != 0) {
      exp--
      size /= 2
    }
    this.exp = exp
    this.size = size
  }

  undo(move: DyadicMove): void {
    this.exp = move.fexp
    this.size = move.fsize
  }
}
