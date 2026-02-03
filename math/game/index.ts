import { Value } from "./value"

export const Player = Object.freeze({
    Left: 1,
    Right: -1,
})

export type Player = (typeof Player)[keyof typeof Player]

export function opponent(player: Player) {
    return player == Player.Left ? Player.Right : Player.Left
}

export const Sign = Object.freeze({
    Zero: 0,
    Left: 1,
    Right: -1,
    Star: 3,
})

export type Sign = (typeof Sign)[keyof typeof Sign]

export abstract class Game<T = unknown> {
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

        return (
            lOnL ?
                lOnR ? Player.Left
                :   Sign.Star
            : lOnR ? Sign.Zero
            : Player.Right
        )
    }

    /** Gets the value of this game as a surreal pseudo-number. */
    value(): Value {
        const lhs: Value[] = []
        for (const move of this.moves(Player.Left)) {
            this.move(move)
            lhs.push(this.value())
            this.undo(move)
        }

        const rhs: Value[] = []
        for (const move of this.moves(Player.Right)) {
            this.move(move)
            rhs.push(this.value())
            this.undo(move)
        }

        return new Value(lhs, rhs)
    }

    lte(rhs: Game | Value): boolean {
        return this.value().lte(rhs)
    }

    gte(rhs: Game | Value): boolean {
        return this.value().gte(rhs)
    }

    lt(rhs: Game | Value): boolean {
        return this.value().lt(rhs)
    }

    gt(rhs: Game | Value): boolean {
        return this.value().gt(rhs)
    }

    eq(rhs: Game | Value): boolean {
        return this.value().eq(rhs)
    }

    cmp(rhs: Game | Value) {
        return this.value().cmp(rhs)
    }

    [Symbol.for("nodejs.util.inspect.custom")](
        depth: number,
        options: import("node:util").InspectOptionsStylized,
        inspect: typeof import("node:util").inspect,
    ) {
        if (depth < 0) {
            return this.constructor.name
        }

        const inner = inspect(
            { ...this },
            {
                ...options,
                colors: true,
                depth: options.depth == null ? null : options.depth - 1,
                breakLength: 20,
            },
        )

        return `${this.constructor.name} ${inner}`
    }
}

/**
 * A special kind of game where both players have the same set of moves
 * available.
 */
export abstract class GameEq<T = unknown> extends Game<T> {
    abstract moves(): readonly T[]

    sign(): Sign {
        const lOnL = this.winner(Player.Left) == Player.Left
        return lOnL ? Sign.Star : Sign.Zero
    }
}
