import { Game, type Player } from ".."

export class Any extends Game<{ on: Game<unknown>; move: unknown }> {
    games

    constructor(...games: Game<unknown>[]) {
        super()
        this.games = games
    }

    moves(player: Player): readonly { on: Game<unknown>; move: unknown }[] {
        const ret = []
        for (const game of this.games) {
            for (const mv of game.moves(player)) {
                ret.push({ on: game, move: mv })
            }
        }
        return ret
    }

    move(move: { on: Game<unknown>; move: unknown }): void {
        move.on.move(move.move)
    }

    undo(move: { on: Game<unknown>; move: unknown }): void {
        move.on.undo(move.move)
    }
}
