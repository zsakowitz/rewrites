export class File {
    readonly lineStart: readonly number[]
    readonly lineEnd: readonly number[]

    constructor(
        readonly name: string,
        readonly body: string,
    ) {
        const lineStart: number[] = [0]
        const lineEnd: number[] = []

        let previousLineStart = 0
        while (true) {
            const idxN = body.indexOf("\n", previousLineStart)
            if (idxN === -1) {
                lineEnd.push(body.length)
                break
            }

            if (body.charAt(idxN - 1) === "\r") {
                lineEnd.push(idxN - 1)
            } else {
                lineEnd.push(idxN)
            }

            lineStart.push(idxN + 1)
            previousLineStart = idxN + 1
        }

        this.lineStart = lineStart
        this.lineEnd = lineEnd
    }

    row(idx: number): number {
        let loRow = 0
        let hiRow = this.lineStart.length

        while (loRow !== hiRow - 1) {
            const midRow = Math.floor((loRow + hiRow) / 2)
            const midIdx = this.lineStart[midRow]!
            if (midIdx === idx) return midRow
            else if (midIdx < idx) loRow = midRow
            else hiRow = midRow
        }

        return loRow
    }

    col(idx: number, row: number): number {
        return idx - this.lineStart[row]!
    }
}
