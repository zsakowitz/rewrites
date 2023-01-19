// A Matrix class that can be added, subtracted, and multiplied.

export type MatrixLike = ArrayLike<ArrayLike<number>>

export class Matrix {
  static from(matrixLike: MatrixLike) {
    const rows = matrixLike.length

    if (rows <= 0) {
      throw new Error(
        "The matrix-like object has a zero or negative dimension."
      )
    }

    const cols = matrixLike[0]!.length

    if (cols <= 0) {
      throw new Error(
        "The matrix-like object has a zero or negative dimension."
      )
    }

    const output = new Matrix(rows, cols)

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        output.data[row]![col] = matrixLike[row]![col]!
      }
    }

    return output
  }

  data: number[][]

  constructor(readonly rows = 1, readonly columns = 1) {
    this.data = Array<void>(rows)
      .fill()
      .map(() => Array<number>().fill(columns))
  }

  copy() {
    const output = new Matrix(this.rows, this.columns)

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        output.data[row]![col] = this.data[row]![col]!
      }
    }

    return output
  }

  multiply(other: number | Matrix) {
    if (typeof other == "number") {
      const output = new Matrix(this.rows, this.columns)

      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.columns; col++) {
          output.data[row]![col] = this.data[row]![col]! * other
        }
      }

      return output
    }

    if (this.columns !== other.rows) {
      throw new Error(
        "When multiplying matrices, the number of columns in the first matrix must be the same as the numbers of rows in the second matrix."
      )
    }

    const rows = this.rows
    const cols = other.columns
    const depth = this.columns // == other.rows
    const output = new Matrix(rows, cols)

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let sum = 0

        for (let index = 0; index < depth; index++) {
          sum += this.data[row]![index]! * other.data[index]![col]!
        }

        output.data[row]![col] = sum
      }
    }

    return output
  }

  randomize(min = 0, max = 20) {
    const pc = max - min + 1

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        this.data[row]![col] = Math.floor(pc * Math.random() + 1)
      }
    }

    return this
  }

  divide(other: number) {
    if (typeof other == "number") {
      const output = new Matrix(this.rows, this.columns)

      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.columns; col++) {
          output.data[row]![col] = this.data[row]![col]! / other
        }
      }

      return output
    }

    throw new Error("The other item is not a valid divisor.")
  }

  ascii() {
    const toText = (item: unknown) => String(item)
    const texts = this.data.map((row) => row.map(toText))

    const maxSize = (size: number, now: string) =>
      size < now.length ? now.length : size

    const size = texts
      .map((row) => row.reduce(maxSize, 0))
      .reduce((a, b) => Math.max(a, b))

    const onEach = (text: string) => text.padEnd(size)

    return `[${texts
      .map((row) => ` [${row.map(onEach).join("  ")}]`)
      .join("\n")
      .slice(1)}]`
  }
}
