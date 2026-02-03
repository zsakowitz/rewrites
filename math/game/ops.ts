import { Player, type Game } from "."
import { Any } from "./game/any"
import { Inv } from "./game/inv"
import { Nim } from "./game/nim"
import { Tree } from "./game/tree"

export function add(a: Game<unknown>, b: Game<unknown>) {
    if (a === b) {
        throw new Error("Cannot add two identical copies of the same game.")
    }

    return new Any(a, b)
}

export function sub(a: Game<unknown>, b: Game<unknown>) {
    if (a === b) {
        throw new Error(
            "Cannot subtract two identical copies of the same game.",
        )
    }

    return new Any(a, new Inv(b))
}

new Any(
    new Nim(3),
    new Tree().branch(0, 1, Player.Left).branch(1, 2, Player.Right),
)
    .value()
    .simplify()
    .log()
