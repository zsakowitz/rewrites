import { Game, opponent, type Player } from ".."

export class Inv<T> extends Game<T> {
    constructor(readonly base: Game<T>) {
        super()
    }

    moves(player: Player): readonly T[] {
        return this.base.moves(opponent(player))
    }

    move(move: T): void {
        this.base.move(move)
    }

    undo(move: T): void {
        this.base.undo(move)
    }
}
