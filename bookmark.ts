// Generates a bookmark file that can be imported into Chrome.

export function indent(text: string) {
  return text.split("\n").join("\n  ")
}

export function bookmark(href: string, title: string, icon?: string) {
  return `<A HREF="${href}"${icon ? ` ICON="${icon}"` : ""}>${title}</A>`
}

function list(items: string[]) {
  return `<DL>
  <DT>${indent(items.join("\n<DT>"))}
</DL>`
}

export function folder(title: string, items: string[]) {
  return `<H3>${title}</H3>
${list(items)}`
}

export function file(items: string[]) {
  return `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
${list(items)}`
}

export namespace TicTacToe {
  export type Player = 1 | 2
  export type Cell = 0 | Player
  export type Position = [row: number, col: number]
  export type Board = readonly (readonly Cell[])[]

  export function isFull(board: Board) {
    return !!(
      board[0][0] &&
      board[0][1] &&
      board[0][2] &&
      board[1][0] &&
      board[1][1] &&
      board[1][2] &&
      board[2][0] &&
      board[2][1] &&
      board[2][2]
    )
  }

  export function isWin(board: Board) {
    return (
      (board[0][0] == board[0][1] &&
        board[0][0] == board[0][2] &&
        board[0][0]) ||
      (board[1][0] == board[1][1] &&
        board[1][0] == board[1][2] &&
        board[1][0]) ||
      (board[2][0] == board[2][1] &&
        board[2][0] == board[2][2] &&
        board[2][0]) ||
      (board[0][0] == board[1][0] &&
        board[0][0] == board[2][0] &&
        board[0][0]) ||
      (board[0][1] == board[1][1] &&
        board[0][1] == board[2][1] &&
        board[0][1]) ||
      (board[0][2] == board[1][2] &&
        board[0][2] == board[2][2] &&
        board[0][2]) ||
      (board[0][0] == board[1][1] &&
        board[0][0] == board[2][2] &&
        board[0][0]) ||
      (board[0][2] == board[1][1] && board[0][2] == board[2][0] && board[0][2])
    )
  }

  export function getMoves(board: Board): Position[] {
    const output: Position[] = []

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] == 0) {
          output.push([row, col])
        }
      }
    }

    return output
  }

  // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
  function shuffle<T>(array: T[]): T[] {
    let currentIndex = array.length
    let randomIndex

    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex--
      ;[array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ]
    }

    return array
  }

  export function analyze(
    board: Board,
    player: Player
  ): [cell: Position | undefined, score: number] {
    const win = isWin(board)

    if (isFull(board)) {
      return [undefined, 0]
    }

    if (win) {
      if (win == player) {
        return [undefined, 1]
      } else {
        return [undefined, -1]
      }
    }

    const moves = shuffle(getMoves(board))
    const possible: [Position, number][] = []

    for (const move of moves) {
      const nextBoard = board.map((row) => row.slice())
      nextBoard[move[0]][move[1]] = player

      const [, rating] = analyze(nextBoard, (3 - player) as Player)

      if (rating == -1) {
        return [move, 1]
      }

      possible.push([move, -rating])
    }

    if (possible.length) {
      return possible.sort((a, b) => b[1] - a[1])[0]
    }

    return [undefined, -1]
  }
}
