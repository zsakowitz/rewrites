class Count {
    data: Record<string, number> = Object.create(null)

    merge(other: Count, multiplyBy = 1) {
        for (const key in other.data) {
            this.data[key] =
                (this.data[key] ?? 0) + other.data[key]! * multiplyBy
        }
    }
}

function count([text]: readonly [string] | TemplateStringsArray): Count {
    const data = new Count()

    const regex = /([A-Za-z]+)\s*(\d*)|\(([^)]+)\)\s*(\d*)/g
    let m: RegExpExecArray | null
    while ((m = regex.exec(text!))) {
        if (m[1]) {
            data.data[m[1]] = (data.data[m[1]] ?? 0) + Number(m[2] ?? 1)
        } else {
            data.merge(count([m[3]!]), +(m[4] ?? 1))
        }
    }

    return data
}

function det(matrix: number[][]) {
    if (matrix.length == 0) {
        return 0
    }

    if (matrix.length == 1) {
        return 1
    }

    if (matrix.length == 2) {
        return matrix[0]![0]! * matrix[1]![1]! - matrix[0]![1]! * matrix[1]![0]!
    }

    let sum = 0

    for (let i = 0; i < matrix.length; i++) {
        const next = withoutColumn(matrix.slice(1), i)
        sum += (i % 2 ? -1 : 1) * matrix[0]![i]! * det(next)
    }

    return sum
}

function withoutColumn(data: number[][], column: number) {
    return data.slice(1).map((x) => {
        const copy = x.slice()
        copy.splice(column, 1)
        return copy
    })
}

function getColumn(data: number[][], col: number) {
    return data.map((row) => row[col]!)
}

function withColumnAs(data: number[][], col: number, colData: number[]) {
    return data.map((row, index) => {
        const copy = row.slice()
        copy[col] = colData[index]!
        return col
    })
}

function solve(data: number[][]) {
    const vars = withoutColumn(data, data.length - 1)

    const D = det(vars)

    return Array.from({ length: vars.length }, (_, index) => {
        return det(withoutColumn(vars, index)) / D
    })
}
