// A bot for running algorithms on the 2048 board found (I believe) at
// https://2048game.com/.

type CellValue =
    | 2
    | 4
    | 8
    | 16
    | 32
    | 64
    | 128
    | 256
    | 512
    | 1024
    | 2048
    | 4096
    | 8192

const restartBtn = document.querySelector<HTMLAnchorElement>(".restart-button")!

function restart() {
    restartBtn.click()
}

function hasCell(value: CellValue) {
    return !!document.querySelector(".tile-" + value)
}

const gameMessage = document.querySelector<HTMLDivElement>(".game-message")!

function isGameOver() {
    return gameMessage.classList.contains("game-over")
}

function tick(ms = 0) {
    return new Promise<void>((resolve) => setTimeout(() => resolve(), ms))
}

interface Options {
    readonly targets: readonly CellValue[]
    readonly repeatValue?: number | undefined
    readonly delagValue?: number | undefined
}

async function runUntil(options: Options) {
    if (isGameOver()) {
        await tick()
        restart()
    }

    const { targets, repeatValue = 1, delagValue = 10 } = options

    for (let index = 0; ; index++) {
        if (index % delagValue == 0) {
            await tick()
        }

        for (const key of [UP, DOWN, LEFT, RIGHT]) {
            if (isGameOver()) {
                return false
            }

            if (targets.every((target) => hasCell(target))) {
                return true
            }

            for (let index = 0; index < repeatValue; index++) {
                document.body.dispatchEvent(key)
            }
        }
    }
}

async function runUntilWin(options: Options) {
    const start = Date.now()
    let runs = 0

    while (true) {
        runs++

        let time = (Math.round((Date.now() - start) / 100) / 10).toString()

        if (!time.includes(".")) {
            time += ".0"
        }

        console.log(`attempt ${runs.toString().padStart(3, "0")} at ${time}s`)

        if (await runUntil(options)) {
            return {
                runs,
                time: (Date.now() - start) / 1000,
            }
        }
    }
}

const tileContainer = document.querySelector<HTMLDivElement>(".tile-container")!

type Board = [
    [CellValue | null, CellValue | null, CellValue | null, CellValue | null],
    [CellValue | null, CellValue | null, CellValue | null, CellValue | null],
    [CellValue | null, CellValue | null, CellValue | null, CellValue | null],
    [CellValue | null, CellValue | null, CellValue | null, CellValue | null],
]

async function getBoard() {
    await tick(10)

    const board: Board = [
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
    ]

    for (const tile of tileContainer.children) {
        const value = tile.className.match(/tile-(\d+)/)
        const [, x, y] = tile.className.match(/tile-position-(\d)-(\d)/) || []

        if (x && y && value?.[1]) {
            board[+y - 1]![+x - 1]! = +value[1]! as CellValue
        }
    }

    return board
}

const [UP, DOWN, LEFT, RIGHT] = [
    ["ArrowUp", 38] as const,
    ["ArrowDown", 40] as const,
    ["ArrowLeft", 37] as const,
    ["ArrowRight", 39] as const,
].map(
    ([key, keyCode]) =>
        new KeyboardEvent("keydown", {
            altKey: false,
            bubbles: true,
            cancelable: true,
            charCode: 0,
            code: key,
            composed: true,
            ctrlKey: false,
            detail: 0,
            isComposing: false,
            key: key,
            keyCode: keyCode,
            location: 0,
            metaKey: false,
            repeat: false,
            shiftKey: false,
            view: window,
            which: keyCode,
        }),
) as [KeyboardEvent, KeyboardEvent, KeyboardEvent, KeyboardEvent]

function registerMultiClick() {
    document.body.addEventListener("keydown", (event) => {
        if (
            event.shiftKey
            && !event.altKey
            && !event.ctrlKey
            && !event.metaKey
        ) {
            const key =
                event.key == "W" || event.key == "ArrowUp" ? UP
                : event.key == "S" || event.key == "ArrowDown" ? DOWN
                : event.key == "A" || event.key == "ArrowLeft" ? LEFT
                : event.key == "D" || event.key == "ArrowRight" ? RIGHT
                : undefined

            if (key) {
                for (let index = 0; index < 12; index++) {
                    document.body.dispatchEvent(key)
                }
            }
        }
    })
}

function registerAlternateClick() {
    document.body.addEventListener("keydown", (event) => {
        const keys =
            event.key == "t" || event.key == "T" ? [UP, LEFT]
            : event.key == "y" || event.key == "Y" ? [UP, RIGHT]
            : event.key == "f" || event.key == "F" ? [DOWN, LEFT]
            : event.key == "g" || event.key == "G" ? [DOWN, RIGHT]
            : undefined

        if (keys) {
            if (event.shiftKey) {
                for (let index = 0; index < 12; index++) {
                    for (const key of keys) {
                        document.body.dispatchEvent(key)
                    }
                }
            } else {
                for (const key of keys) {
                    document.body.dispatchEvent(key)
                }
            }
        }
    })
}

registerMultiClick()
registerAlternateClick()

export {}
