// A class-based TicTacToe implementation.

export type Player = 1 | 2

export type Square = 0 | Player

export class TicTacToe {
    static randomPosition(): 0 | 1 | 2 {
        return Math.floor(3 * Math.random()) as 0 | 1 | 2
    }

    readonly board: [
        [Square, Square, Square],
        [Square, Square, Square],
        [Square, Square, Square],
    ] = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
    ]

    currentPlayer: Player = 1

    play(row: 0 | 1 | 2, column: 0 | 1 | 2): boolean {
        if (!this.board[row][column]) {
            this.board[row][column] = this.currentPlayer
            this.currentPlayer = (3 - +this.currentPlayer) as 1 | 2
            return true
        }

        return false
    }

    winner(): 0 | Player {
        if (
            (this.board[0][0] == 1
                && this.board[0][1] == 1
                && this.board[0][2] == 1)
            || (this.board[1][0] == 1
                && this.board[1][1] == 1
                && this.board[1][2] == 1)
            || (this.board[2][0] == 1
                && this.board[2][1] == 1
                && this.board[2][2] == 1)
            || (this.board[0][0] == 1
                && this.board[1][0] == 1
                && this.board[2][0] == 1)
            || (this.board[0][1] == 1
                && this.board[1][1] == 1
                && this.board[2][1] == 1)
            || (this.board[0][2] == 1
                && this.board[1][2] == 1
                && this.board[2][2] == 1)
            || (this.board[0][0] == 1
                && this.board[1][1] == 1
                && this.board[2][2] == 1)
            || (this.board[0][2] == 1
                && this.board[1][1] == 1
                && this.board[2][0] == 1)
        ) {
            return 1
        }

        if (
            (this.board[0][0] == 2
                && this.board[0][1] == 2
                && this.board[0][2] == 2)
            || (this.board[1][0] == 2
                && this.board[1][1] == 2
                && this.board[1][2] == 2)
            || (this.board[2][0] == 2
                && this.board[2][1] == 2
                && this.board[2][2] == 2)
            || (this.board[0][0] == 2
                && this.board[1][0] == 2
                && this.board[2][0] == 2)
            || (this.board[0][1] == 2
                && this.board[1][1] == 2
                && this.board[2][1] == 2)
            || (this.board[0][2] == 2
                && this.board[1][2] == 2
                && this.board[2][2] == 2)
            || (this.board[0][0] == 2
                && this.board[1][1] == 2
                && this.board[2][2] == 2)
            || (this.board[0][2] == 2
                && this.board[1][1] == 2
                && this.board[2][0] == 2)
        ) {
            return 2
        }

        return 0
    }

    playRandomly() {
        let row
        let column

        do {
            row = TicTacToe.randomPosition()
            column = TicTacToe.randomPosition()
        } while (!this.play(row, column))
    }
}
