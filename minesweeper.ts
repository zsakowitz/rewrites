// A clone of Google's Minesweeper, with an AI built in.

const REVEALED = 64
const FLAG = 32
const MINE = 16
const VALUE = 15

const hueOf = (cell: number) => (cell & 0b111_0000_0000) >> 8
const makeHue = (hue: number) => Math.floor(hue) * 0b1_0000_0000

const BLANK = 0

const COLORS = {
    LIGHT: "rgb(170, 215, 80)",
    LIGHT_HOVERED: "rgb(192, 225, 125)",
    LIGHT_REVEALED: "rgb(229, 194, 159)",
    DARK: "rgb(162, 209, 72)",
    DARK_HOVERED: "rgb(185, 221, 118)",
    DARK_REVEALED: "rgb(215, 184, 153)",
    BORDER: "rgb(135, 175, 58)",
    FLAG: "rgb(243, 54, 6)",
} as const

type MineColor = [background: string, interior: string]

const MINE_COLORS: MineColor[] = [
    ["rgb(219, 50, 54)", "rgb(142, 33, 35)"],
    ["rgb(245, 132, 14)", "rgb(160, 86, 7)"],
    ["rgb(244, 194, 14)", "rgb(159, 126, 10)"],
    ["rgb(1, 135, 69)", "rgb(1, 87, 44)"],
    ["rgb(73, 229, 241)", "rgb(48, 150, 158)"],
    ["rgb(73, 133, 237)", "rgb(48, 86, 155)"],
    ["rgb(183, 72, 242)", "rgb(118, 47, 157)"],
    ["rgb(237, 68, 181)", "rgb(144, 44, 118)"],
]

const NUMBER_COLORS: string[] = [
    "#000",
    "rgb(26, 118, 211)",
    "rgb(56, 142, 61)",
    "rgb(211, 47, 48)",
    "rgb(123, 31, 162)",
    "rgb(255, 143, 0)",
]

const SQUARE_SIZE = 30
const BORDER_SIZE = 2
const NON_BORDER_SIZE = SQUARE_SIZE - BORDER_SIZE
const MINE_INTERIOR_RADIUS = 7.5

function inPlaceLimitedShuffle<T>(array: T[], maxItems: number): T[] {
    let currentIndex = array.length
    let randomIndex, temp

    const end = array.length - maxItems

    while (currentIndex != end) {
        randomIndex = Math.floor(Math.random() * currentIndex)
        currentIndex--

        temp = array[currentIndex]!
        array[currentIndex] = array[randomIndex]!
        array[randomIndex] = temp
    }

    array.splice(0, end)
    return array
}

const canvas = document.createElement("canvas")
const context = canvas.getContext("2d")!
const container = document.createElement("div")
const header = document.createElement("div")
const aiButton = document.createElement("button")
const solveButton = document.createElement("button")
const minesLeft = document.createElement("code")

if (!context) {
    throw new Error("Could not acquire canvas context.")
}

// Setup styles and DOM
{
    aiButton.textContent = "Play AI Move"
    aiButton.addEventListener("click", () => {
        game().playAI()
        game().render()
    })

    solveButton.textContent = "Solve"
    solveButton.addEventListener("click", () => {
        game().playManyAI()
        game().render()
    })

    const link = document.createElement("link")
    link.onload = () => game().render()
    link.href = "https://fonts.googleapis.com/css2?family=Roboto:wght@700"
    link.rel = "stylesheet"

    minesLeft.textContent = "Mines Left: ????"

    header.append(minesLeft, aiButton, solveButton)
    container.append(header, canvas)
    document.body.append(link, container)

    // @ts-ignore
    minesLeft.style =
        "font-family: 'Fira Code', monospace; color: white; font-size: 1rem; margin: auto 0"

    // @ts-ignore
    aiButton.style = solveButton.style =
        "font-size: 1rem; font-family: 'San Francisco', system-ui, sans-serif; background-color: white; color: black; border: 0;\
     border-radius: 0.25rem; margin: auto 0"

    // @ts-ignore
    container.style = "display: flex; flex-direction: column; margin: auto"

    // @ts-ignore
    header.style =
        "width: 100%; height: 60px; background-color: #4a752c; display: flex; gap: 1rem; align-items: baseline; justify-content: center; align-content: center"

    // @ts-ignore
    document.documentElement.style = document.body.style =
        "display: flex; min-width: 100%; min-height: 100%; flex: 1; margin: 0"

    document.documentElement.style.backgroundColor = "rgba(0, 0, 0, 0.8)"

    // @ts-ignore
    canvas.style = "margin: auto"

    canvas.addEventListener("pointermove", (event) =>
        onPointerMove?.(
            Math.floor(event.offsetY / SQUARE_SIZE),
            Math.floor(event.offsetX / SQUARE_SIZE),
        ),
    )

    canvas.addEventListener("pointerleave", () => onPointerLeave?.())

    canvas.addEventListener("pointerdown", (event) => {
        if (event.pointerType == "mouse" && event.button != 0) {
            return
        }

        onPointerDown?.(
            Math.floor(event.offsetY / SQUARE_SIZE),
            Math.floor(event.offsetX / SQUARE_SIZE),
        )
    })

    canvas.addEventListener("contextmenu", (event) => {
        event.preventDefault()

        onContextMenu?.(
            Math.floor(event.offsetY / SQUARE_SIZE),
            Math.floor(event.offsetX / SQUARE_SIZE),
        )
    })
}

let onPointerDown: ((row: number, col: number) => void) | undefined
let onContextMenu: ((row: number, col: number) => void) | undefined
let onPointerMove: ((row: number, col: number) => void) | undefined
let onPointerLeave: (() => void) | undefined

type ClickResult =
    | { type: "error"; reason: "game-already-over" }
    | { type: "error"; reason: "target-does-not-exist" }
    | { type: "error"; reason: "already-revealed" }
    | { type: "game-over"; reason: "exploded" }
    | { type: "hit-zero"; changed: Set<number> }
    | { type: "hit-number" }

type MarkResult =
    | { type: "error"; reason: "game-already-over" }
    | { type: "error"; reason: "target-does-not-exist" }
    | { type: "error"; reason: "already-revealed" }
    | { type: "error"; reason: "first-click" }
    | { type: "added-flag" }
    | { type: "removed-flag" }

type VisibleCellInfo =
    | { type: "blank" }
    | { type: "number"; value: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 }
    | { type: "mine"; color: MineColor }
    | { type: "flag" }
    | { type: "unknown" }

type CellStatus = "unknown" | "flagged" | "revealed"

type CellInfo =
    | { type: "blank"; status: CellStatus }
    | {
          type: "number"
          value: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
          status: CellStatus
      }
    | { type: "mine"; status: CellStatus; color: MineColor }

type GameOptions = {
    cols: number
    mines: number
    rows: number
}

type Target = [row: number, col: number]

export class Game {
    readonly rows: number
    readonly cols: number
    readonly mines: number
    readonly board: number[][]

    gameOver = false

    hoveredRow?: number
    hoveredCol?: number

    readonly options: GameOptions

    constructor(options: GameOptions) {
        this.options = options

        const { cols, mines, rows } = options

        this.rows = rows
        this.cols = cols
        this.mines = mines

        const board = (this.board = Array.from({ length: rows }, () =>
            Array.from({ length: cols }, () => BLANK),
        ))

        for (const mine of inPlaceLimitedShuffle(
            Array.from({ length: rows * cols }, (_, index) => index),
            mines,
        )) {
            const value = MINE | makeHue(8 * Math.random())

            board[Math.floor(mine / cols)]![mine % cols] = value
        }

        const isMine = (row: number, col: number) =>
            +(board[row]?.[col] ? (board[row]![col]! & MINE) != 0 : 0)

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (!(board[row]![col]! & MINE)) {
                    const surroundingMines =
                        isMine(row - 1, col - 1)
                        + isMine(row - 1, col)
                        + isMine(row - 1, col + 1)
                        + isMine(row, col - 1)
                        + isMine(row, col + 1)
                        + isMine(row + 1, col - 1)
                        + isMine(row + 1, col)
                        + isMine(row + 1, col + 1)

                    board[row]![col] = surroundingMines
                }
            }
        }
    }

    toString() {
        return this.board
            .map((row) =>
                row
                    .map((cell) =>
                        cell & MINE ? "💣"
                        : cell & VALUE ? (cell & VALUE).toString().padStart(2)
                        : "  ",
                    )
                    .join(" "),
            )
            .join("\n")
    }

    getCellInfo(row: number, col: number): CellInfo | undefined {
        const cell = this.board[row]?.[col]

        if (cell == null) {
            return
        }

        const status: CellStatus =
            cell & REVEALED ? "revealed"
            : cell & FLAG ? "flagged"
            : "unknown"

        if (cell & MINE) {
            return {
                type: "mine",
                color: MINE_COLORS[hueOf(cell)]!,
                status,
            }
        }

        if (cell & VALUE) {
            return {
                type: "number",
                value: (cell & VALUE) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
                status,
            }
        }

        return {
            type: "blank",
            status,
        }
    }

    getVisibleCellInfo(row: number, col: number): VisibleCellInfo | undefined {
        const cell = this.board[row]?.[col]

        if (cell == null) {
            return
        }

        if (cell & FLAG) {
            return { type: "flag" }
        }

        if (!(cell & REVEALED)) {
            return { type: "unknown" }
        }

        if (cell & MINE) {
            return {
                type: "mine",
                color: MINE_COLORS[hueOf(cell)]!,
            }
        }

        if (cell & VALUE) {
            return {
                type: "number",
                value: (cell & VALUE) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
            }
        }

        return {
            type: "blank",
        }
    }

    reveal(row: number, col: number, targetList: Set<number>) {
        const cell = this.board[row]?.[col]

        if (cell == null || cell & REVEALED || cell & FLAG || cell & MINE) {
            return
        }

        this.board[row]![col]! |= REVEALED
        targetList.add(row * this.cols + col)

        if ((cell & VALUE) == 0) {
            this.reveal(row - 1, col - 1, targetList)
            this.reveal(row - 1, col, targetList)
            this.reveal(row - 1, col + 1, targetList)
            this.reveal(row, col - 1, targetList)
            this.reveal(row, col + 1, targetList)
            this.reveal(row + 1, col - 1, targetList)
            this.reveal(row + 1, col, targetList)
            this.reveal(row + 1, col + 1, targetList)
        }
    }

    click(row: number, col: number): ClickResult {
        if (this.gameOver) {
            return {
                type: "error",
                reason: "game-already-over",
            }
        }

        const cell = this.board[row]?.[col]

        if (cell == null) {
            return {
                type: "error",
                reason: "target-does-not-exist",
            }
        }

        if (cell & REVEALED) {
            return {
                type: "error",
                reason: "already-revealed",
            }
        }

        if (cell & MINE) {
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    const cell = this.board[row]![col]!

                    if (cell & FLAG) {
                        this.board[row]![col] ^= FLAG
                    }

                    if (cell & MINE) {
                        this.board[row]![col]! |= REVEALED
                    }
                }
            }

            this.gameOver = true

            return {
                type: "game-over",
                reason: "exploded",
            }
        }

        if (cell & FLAG) {
            this.board[row]![col] ^= FLAG
        }

        if ((cell & VALUE) == 0) {
            const targetList = new Set<number>()
            this.reveal(row, col, targetList)
            return { type: "hit-zero", changed: targetList }
        }

        this.board[row]![col] |= REVEALED

        return { type: "hit-number" }
    }

    mark(row: number, col: number): MarkResult {
        if (this.gameOver) {
            return { type: "error", reason: "game-already-over" }
        }

        const cell = this.board[row]?.[col]

        if (cell == null) {
            return { type: "error", reason: "target-does-not-exist" }
        }

        if (cell & REVEALED) {
            return { type: "error", reason: "already-revealed" }
        }

        if (this.board[row]![col]! & FLAG) {
            this.board[row]![col]! ^= FLAG

            return { type: "removed-flag" }
        }

        this.board[row]![col]! |= FLAG

        return { type: "added-flag" }
    }

    indexToTarget(index: number): Target {
        return [Math.floor(index / this.cols), index % this.cols]
    }

    shouldBeBordered(row: number, col: number) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return false
        }

        const cell = this.board[row]![col]!

        if (cell & REVEALED && cell & MINE) {
            return true
        }

        return (this.board[row]![col]! & REVEALED) == 0
    }

    // A hook that is called after drawing the background of a cell.
    postDrawBackground?(row: number, col: number): void

    // A hook that is called after drawing the content of a cell.
    postDrawContent?(row: number, col: number): void

    render() {
        canvas.style.width = this.cols * SQUARE_SIZE + "px"
        canvas.style.height = this.rows * SQUARE_SIZE + "px"

        const squareSize = SQUARE_SIZE * devicePixelRatio
        const borderSize = BORDER_SIZE * devicePixelRatio
        const nonBorderSize = NON_BORDER_SIZE * devicePixelRatio
        const mineInteriorRadius = MINE_INTERIOR_RADIUS * devicePixelRatio

        canvas.width = this.cols * squareSize
        canvas.height = this.rows * squareSize

        let totalFlags = 0

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.getVisibleCellInfo(row, col)!

                if (cell.type == "flag") {
                    totalFlags++
                }

                // Draw cell background
                if (cell.type == "mine") {
                    context.fillStyle = cell.color[0]
                } else if ((row + col) % 2) {
                    if (cell.type == "blank" || cell.type == "number") {
                        context.fillStyle = COLORS.DARK_REVEALED
                    } else if (
                        this.hoveredRow == row
                        && this.hoveredCol == col
                    ) {
                        context.fillStyle = COLORS.DARK_HOVERED
                    } else {
                        context.fillStyle = COLORS.DARK
                    }
                } else {
                    if (cell.type == "blank" || cell.type == "number") {
                        context.fillStyle = COLORS.LIGHT_REVEALED
                    } else if (
                        this.hoveredRow == row
                        && this.hoveredCol == col
                    ) {
                        context.fillStyle = COLORS.LIGHT_HOVERED
                    } else {
                        context.fillStyle = COLORS.LIGHT
                    }
                }

                context.fillRect(
                    col * squareSize,
                    row * squareSize,
                    squareSize,
                    squareSize,
                )

                this.postDrawBackground?.(row, col)

                context.textAlign = "center"
                context.textBaseline = "alphabetic"
                context.font = `bold ${24.8 * devicePixelRatio}px Roboto`

                if (cell.type == "flag") {
                    context.fillStyle = COLORS.FLAG
                    context.fillText(
                        "!",
                        (col + 0.5) * squareSize,
                        (row + 0.5) * squareSize + 9 * devicePixelRatio,
                    )
                } else if (cell.type == "mine") {
                    context.fillStyle = cell.color[1]
                    context.beginPath()
                    context.arc(
                        (col + 0.5) * squareSize,
                        (row + 0.5) * squareSize,
                        mineInteriorRadius,
                        0,
                        360,
                    )
                    context.fill()
                } else if (cell.type == "number") {
                    context.fillStyle = NUMBER_COLORS[cell.value] || "#000"
                    context.fillText(
                        "" + cell.value,
                        (col + 0.5) * squareSize,
                        (row + 0.5) * squareSize + 9 * devicePixelRatio,
                    )
                }

                this.postDrawContent?.(row, col)

                if (cell.type == "blank" || cell.type == "number") {
                    context.fillStyle = COLORS.BORDER

                    if (this.shouldBeBordered(row, col - 1)) {
                        context.fillRect(
                            col * squareSize,
                            row * squareSize,
                            borderSize,
                            squareSize,
                        )
                    }

                    if (this.shouldBeBordered(row, col + 1)) {
                        context.fillRect(
                            col * squareSize + nonBorderSize,
                            row * squareSize,
                            borderSize,
                            squareSize,
                        )
                    }

                    if (this.shouldBeBordered(row - 1, col)) {
                        context.fillRect(
                            col * squareSize,
                            row * squareSize,
                            squareSize,
                            borderSize,
                        )
                    }

                    if (this.shouldBeBordered(row + 1, col)) {
                        context.fillRect(
                            col * squareSize,
                            row * squareSize + nonBorderSize,
                            squareSize,
                            borderSize,
                        )
                    }

                    if (this.shouldBeBordered(row + 1, col + 1)) {
                        context.fillRect(
                            col * squareSize + nonBorderSize,
                            row * squareSize + nonBorderSize,
                            borderSize,
                            borderSize,
                        )
                    }

                    if (this.shouldBeBordered(row - 1, col + 1)) {
                        context.fillRect(
                            col * squareSize + nonBorderSize,
                            row * squareSize,
                            borderSize,
                            borderSize,
                        )
                    }

                    if (this.shouldBeBordered(row + 1, col - 1)) {
                        context.fillRect(
                            col * squareSize,
                            row * squareSize + nonBorderSize,
                            borderSize,
                            borderSize,
                        )
                    }

                    if (this.shouldBeBordered(row - 1, col - 1)) {
                        context.fillRect(
                            col * squareSize,
                            row * squareSize,
                            borderSize,
                            borderSize,
                        )
                    }
                }
            }
        }

        minesLeft.textContent =
            "Mines Left: "
            + (this.options.mines - totalFlags).toString().padStart(4, " ")
    }

    makeInteractive(preventRerender?: (game: this) => boolean) {
        this.render()

        onPointerMove = (row, col) => {
            this.hoveredRow = row
            this.hoveredCol = col

            if (!preventRerender?.(this)) {
                this.render()
            }
        }

        onPointerLeave = () => {
            this.hoveredRow = undefined
            this.hoveredCol = undefined

            if (!preventRerender?.(this)) {
                this.render()
            }
        }

        onPointerDown = (row, col) => {
            this.click(row, col)

            if (!preventRerender?.(this)) {
                this.render()
            }
        }

        onContextMenu = (row, col) => {
            this.mark(row, col)

            if (!preventRerender?.(this)) {
                this.render()
            }
        }
    }

    neighbors(row: number, col: number): Target[] {
        return (
            [
                [row - 1, col - 1],
                [row - 1, col],
                [row - 1, col + 1],
                [row, col - 1],
                [row, col + 1],
                [row + 1, col - 1],
                [row + 1, col],
                [row + 1, col + 1],
            ] as [number, number][]
        ).filter(([a, b]) => this.board[a]?.[b] != null)
    }
}

export class GameWithAI extends Game {
    constructor(options: GameOptions) {
        super(options)
    }

    playAI() {
        if (this.gameOver) {
            return
        }

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const info = this.getVisibleCellInfo(row, col)!

                if (info.type == "number") {
                    const neighbors = this.neighbors(row, col).map(
                        ([row, col]) => ({
                            row,
                            col,
                            info: this.getVisibleCellInfo(row, col)!,
                        }),
                    )

                    const flaggedNeighbors = neighbors.filter(
                        (
                            cell,
                        ): cell is typeof cell & { info: { type: "flag" } } =>
                            cell.info.type == "flag",
                    )

                    const unknownNeighbors = neighbors.filter(
                        (
                            cell,
                        ): cell is typeof cell & {
                            info: { type: "unknown" }
                        } => cell.info.type == "unknown",
                    )

                    if (
                        // has at least one unknown neighbor &&
                        unknownNeighbors.length
                        // my value - (# of flagged neighbors) == # of unknown neighbors
                        && info.value - flaggedNeighbors.length
                            == unknownNeighbors.length
                    ) {
                        // mark all unknown neighbors
                        this.mark(
                            unknownNeighbors[0]!.row,
                            unknownNeighbors[0]!.col,
                        )

                        return true
                    }

                    if (
                        // has at least one unknown neighbor &&
                        unknownNeighbors.length
                        // my value == # of flagged neighbors
                        && info.value == flaggedNeighbors.length
                    ) {
                        // click all unknown neighbors
                        this.click(
                            unknownNeighbors[0]!.row,
                            unknownNeighbors[0]!.col,
                        )

                        return true
                    }
                }
            }
        }

        return false
    }

    async playManyAI() {
        while (this.playAI()) {
            await new Promise((resolve) => setTimeout(resolve))
        }
    }
}

type InteractiveGameOptions = GameOptions & {
    minRevealed: number
}

function makeInteractiveGame<T extends Game>(
    Constructor: new (options: GameOptions) => T,
    options: InteractiveGameOptions,
): () => T {
    let game = new Constructor(options)
    let isFirstClick = true

    const preventRerender = (thisGame: T) => game != thisGame

    function click(row: number, col: number): ClickResult {
        if (!isFirstClick) {
            return Object.getPrototypeOf(game).click.call(game, row, col)
        }

        const result: ClickResult = Object.getPrototypeOf(game).click.call(
            game,
            row,
            col,
        )

        let totalRevealed = 0

        for (let row = 0; row < game.rows; row++) {
            for (let col = 0; col < game.cols; col++) {
                const cell = game.board[row]![col]!

                if (cell & REVEALED && !(cell & MINE)) {
                    totalRevealed++
                }
            }
        }

        if (totalRevealed >= options.minRevealed) {
            isFirstClick = false

            game.render()

            return result
        }

        game = new Constructor(options)
        game.click = click
        game.mark = mark
        game.makeInteractive(preventRerender)

        return click(row, col)
    }

    function mark(row: number, col: number): MarkResult {
        if (isFirstClick) {
            return { type: "error", reason: "first-click" }
        }

        const output = Object.getPrototypeOf(game).mark.call(game, row, col)

        game.render()

        return output
    }

    game.click = click
    game.mark = mark
    game.makeInteractive(preventRerender)

    return () => game
}

const options: InteractiveGameOptions = {
    rows: 14,
    cols: 18,
    mines: 40,
    minRevealed: 2,
}

const game = makeInteractiveGame(GameWithAI, options)
