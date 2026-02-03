type Point = readonly [x: number, y: number]

class Board {
    static of(cells: string) {
        return new Board(cells.split("\n").map((x) => x.split("")))
    }

    constructor(readonly cells: string[][]) {}

    *search(endpoints: string, as: string) {
        let a, b

        find: for (let i = 0; i < this.cells.length; i++) {
            for (let j = 0; j < this.cells[i]!.length; j++) {
                if (this.cells[i]![j]! == endpoints) {
                    if (a) {
                        b = [i, j] satisfies Point as Point
                        break find
                    } else {
                        a = [i, j] satisfies Point as Point
                    }
                }
            }
        }

        if (!a || !b) {
            console.warn("no endpoints")
            return
        }

        yield* this.explore(a, b, as)
    }

    *explore([sx, sy]: Point, [dx, dy]: Point, as: string): Generator<string> {
        for (const [ex, ey] of [
            [0, 1],
            [0, -1],
            [1, 0],
            [-1, 0],
        ] as Point[]) {
            const x = sx + ex
            const y = sy + ey
            if (x == dx && y == dy) {
                yield this.join()
            } else if (this.cells[y]?.[x] == ".") {
                this.cells[y]![x] = as
                yield* this.explore([x, y], [dx, dy], as)
                this.cells[y]![x] = "."
            }
        }
    }

    join() {
        return this.cells.map((x) => x.join("")).join("\n")
    }
}

const src = new Board(
    `A....
.....
..B..
CBD.A
D...C`
        .split("\n")
        .map((x) => x.split("")),
)

for (const a of src.search("A", "a")) {
    console.log()
    console.log(a)
    // for (const b of Board.of(a).search("B", "b")) {
    // for (const c of Board.of(b).search("C", "c")) {
    // for (const d of c.search("D", "d")) {
    // }
    // }
    // }
}
