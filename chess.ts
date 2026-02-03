import { Chess, DEFAULT_POSITION } from "chess.js"

const game = new Chess(DEFAULT_POSITION)

const keys = {
    isCheckmate: "win by checkmate",
    isStalemate: "draw by stalemate",
    isInsufficientMaterial: "draw by insufficient material",
    isThreefoldRepetition: "draw by threefold repetition",
    isDrawByFiftyMoves: "draw by fifty-move rule",
    isDraw: "",
}

async function go(depth: number, path: `/${string}/`) {
    const name = game.turn() == "b" ? "black" : "white"

    game.isStalemate()
    game.isCheckmate()
    game.isGameOver()

    for (const turn of game.moves()) {
    }
}
