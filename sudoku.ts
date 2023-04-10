// An interactive Sudoku game.

class Cell {
  value?: number
  possibleValues = [1, 2, 3, 4, 5, 6, 7, 8, 9]

  div = document.createElement("div")
  minis = Array.from({ length: 9 }, () => document.createElement("span"))
  br1 = document.createElement("br")
  br2 = document.createElement("br")

  row: Cell[] = []
  column: Cell[] = []
  group: Cell[] = []

  constructor() {
    // @ts-ignore
    this.div.style =
      "display: block; font: 3rem / 0 'Fira Code', monospace; background-color: #f0f0f0; border-radius: 0.25rem; height: 4.25rem; width: 4.25rem; align-items: center; justify-content: center; user-select: none; text-align: center; padding: 0.25rem"

    this.minis.forEach((mini, index) => {
      // @ts-ignore
      mini.style =
        "font: 1rem 'Fira Code', monospace; width: 1.25rem; height: 1.25rem; display: inline-block; text-align: center; cursor: pointer"

      mini.textContent = "" + (index + 1)

      mini.addEventListener("click", (event) => {
        this.setTo(index + 1)

        redraw()

        if (event.isTrusted) {
          checkValidity()
        }
      })

      mini.addEventListener("contextmenu", (event) => {
        event.preventDefault()

        const state = saveState()

        mini.click()

        restoreState(state)
      })
    })
  }

  updateContent() {
    if (!this.value && this.possibleValues.length == 0) {
      this.div.textContent = ""
      this.div.style.backgroundColor = "#c0c0c0"
    }

    if (this.value) {
      this.div.style.display = "flex"
      this.div.style.paddingTop = "0.5rem"

      this.div.textContent = "" + this.value
    } else {
      this.div.style.display = "block"
      this.div.style.paddingTop = "0.25rem"

      this.div.textContent = ""

      this.div.append(
        this.minis[0]!,
        this.minis[1]!,
        this.minis[2]!,
        this.br1,
        this.minis[3]!,
        this.minis[4]!,
        this.minis[5]!,
        this.br2,
        this.minis[6]!,
        this.minis[7]!,
        this.minis[8]!
      )

      this.minis.forEach((mini, index) => {
        mini.style.visibility = this.possibleValues.includes(index + 1)
          ? "visible"
          : "hidden"
      })
    }
  }

  setTo(value: number) {
    for (const other of this.row.concat(this.column).concat(this.group)) {
      if (other.value == value) {
        return
      }
    }

    this.value = value
    this.possibleValues = [value]

    for (const other of this.row.concat(this.column).concat(this.group)) {
      other.removePossibleValue(value)
    }
  }

  removePossibleValue(value: number) {
    if (this.possibleValues.includes(value)) {
      this.setPossibleValues(this.possibleValues.filter((v) => v != value))
    }
  }

  setPossibleValues(values: number[]) {
    this.possibleValues = values

    if (values.length == 1) {
      this.setTo(values[0]!)
      return
    }
  }
}

const container = document.createElement("div")

// @ts-ignore
container.style =
  "display: flex; flex-direction: column; margin: auto; gap: 0.25rem"

const board = Array.from({ length: 9 }, (_, row) => {
  const cells = Array.from({ length: 9 }, (_, col) => {
    const cell = new Cell()

    if (col == 2 || col == 5) {
      cell.div.style.marginRight = "0.75rem"
    }

    return cell
  })

  const parent = document.createElement("div")

  // @ts-ignore
  parent.style = "display: flex; gap: 0.25rem"

  if (row == 2 || row == 5) {
    parent.style.marginBottom = "0.75rem"
  }

  parent.append(...cells.map((cell) => cell.div))

  container.appendChild(parent)

  return cells
})

for (let row = 0; row < 9; row++) {
  for (let col = 0; col < 9; col++) {
    const cell = board[row]![col]!

    cell.updateContent()

    cell.row = board[row]!.filter((other) => other != cell)
    cell.column = board.map((row) => row[col]!).filter((other) => other != cell)

    cell.group = board
      .map((row) =>
        row.filter(
          (_, otherCol) => Math.floor(otherCol / 3) == Math.floor(col / 3)
        )
      )
      .filter((_, otherRow) => Math.floor(otherRow / 3) == Math.floor(row / 3))
      .flat()
      .filter((other) => other != cell)
  }
}

function redraw() {
  board.forEach((row) => row.forEach((cell) => cell.updateContent()))
}

function checkValidity() {
  for (const mini of document.querySelectorAll("span")) {
    const state = saveState()

    mini.click()

    if (isImpossible()) {
      mini.style.color = "#c04040"
    } else {
      mini.style.color = "black"
    }

    restoreState(state)
  }
}

const checkValidityEl = document.createElement("button")
checkValidityEl.textContent = "Check Validity"
checkValidityEl.addEventListener("click", checkValidity)

// @ts-ignore
document.body.style = "margin: 0; height: 100vh; width: 100vw; display: flex"

document.body.append(checkValidityEl, container)

type State = { possibleValues: number[]; value: number | undefined }[][]

function saveState(): State {
  return board.map((row) =>
    row.map((cell) => ({
      possibleValues: cell.possibleValues.slice(),
      value: cell.value,
    }))
  )
}

function restoreState(state: State) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const saved = state[row]![col]!
      const cell = board[row]![col]!

      cell.value = saved.value
      cell.possibleValues = saved.possibleValues
    }
  }
}

function isImpossible() {
  return board.some((row) =>
    row.some((cell) => cell.possibleValues.length == 0)
  )
}
