// An AI for the TickoaTTwo game created by Oats Jenkins:
// https://www.youtube.com/watch?v=ePxrVU4M9uA

export const enum Cell {
  None,
  Horizontal,
  Vertical,
  Both,
}

export type Player = Cell.Horizontal | Cell.Vertical

export type Location = readonly [row: number, column: number]

export interface Game {
  turn: Player
  last: Location
  readonly board: Board
}

export interface ReadonlyGame {
  readonly turn: Player
  readonly board: ReadonlyBoard
}

export type Board = Cell[][]
export type ReadonlyBoard = readonly (readonly Cell[])[]

export function isWin(board: ReadonlyBoard) {
  return (
    (board[0]![0] == Cell.Both &&
      board[1]![0] == Cell.Both &&
      board[2]![0] == Cell.Both) ||
    (board[0]![1] == Cell.Both &&
      board[1]![1] == Cell.Both &&
      board[2]![1] == Cell.Both) ||
    (board[0]![2] == Cell.Both &&
      board[1]![2] == Cell.Both &&
      board[2]![2] == Cell.Both) ||
    (board[0]![0] == Cell.Both &&
      board[0]![1] == Cell.Both &&
      board[0]![2] == Cell.Both) ||
    (board[1]![0] == Cell.Both &&
      board[1]![1] == Cell.Both &&
      board[1]![2] == Cell.Both) ||
    (board[2]![0] == Cell.Both &&
      board[2]![1] == Cell.Both &&
      board[2]![2] == Cell.Both) ||
    (board[0]![0] == Cell.Both &&
      board[1]![1] == Cell.Both &&
      board[2]![2] == Cell.Both) ||
    (board[0]![2] == Cell.Both &&
      board[1]![1] == Cell.Both &&
      board[2]![0] == Cell.Both)
  )
}

export function possibleMoves(
  board: ReadonlyBoard,
  forPlayer: Player,
  [lastRow, lastCol]: Location = [-1, -1],
): readonly Location[] {
  const output: Location[] = []

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if ((lastRow != i || lastCol != j) && !(board[i]![j]! & forPlayer)) {
        output.push([i, j])
      }
    }
  }

  return output
}

const characterMap = [".", "-", "|", "+"]
const toCharacter = (cell: Cell) => characterMap[cell]
const rowToCharacter = (row: readonly Cell[]) => row.map(toCharacter).join("")

export function ascii(board: ReadonlyBoard) {
  return board.map(rowToCharacter).join("")
}

const LOG = false

/** Assumes that it is `forPlayer`'s turn. */
export function rate(
  board: ReadonlyBoard,
  forPlayer: Player,
  last: Location | undefined,
): [bestMove: Location | undefined, rating: number] {
  if (isWin(board)) {
    if (LOG) console.log("win for", 3 - forPlayer) // TODO:

    // If the other player won, return -1.
    return [undefined, -1]
  } else {
    // Get all my moves.
    const moves = possibleMoves(board, forPlayer, last)

    if (LOG) console.log("moves for", forPlayer, moves) // TODO:

    for (const move of moves) {
      // Play each move and get the rating from the other player's POV.

      const next: Board = board.map((row) => row.slice())
      next[move[0]]![move[1]] |= forPlayer

      const [, rating] = rate(next, 3 - forPlayer, move)

      if (rating == -1) {
        // The other player definitely loses; exit early.
        return [move, 1]
      }
    }

    // If the other player can win in all scenarios, we lose.
    return [moves[0], -1]
  }
}
