//! https://www.desmos.com/geometry/ieagxvrhhz

class Game {
    constructor(
        readonly w: number,
        readonly h: number,
        readonly d: Uint8Array, // 0 not filled, 1 filled blue, 2 filled red, row-major
    ) {}

    get(r: number, c: number): number {
        return this.d[r * this.w + c]!
    }

    set(r: number, c: number, v: number) {
        this.d[r * this.w + c] = v
    }

    step1(): boolean {
        let changed = false

        for (let r = 0; r < this.h; r++) {
            for (let c = 0; c < this.w - 1; c++) {
                const val = this.get(r, c)

                if (val != 0 && val == this.get(r, c + 1)) {
                    if (c != 0 && this.get(r, c - 1) == 0) {
                        this.set(r, c - 1, 3 - val)
                        changed = true
                    }
                    if (c < this.w - 2 && this.get(r, c + 2) == 0) {
                        this.set(r, c + 2, 3 - val)
                        changed = true
                    }
                }

                if (
                    c != 0
                    && val == 0
                    && this.get(r, c - 1) == this.get(r, c + 1)
                    && this.get(r, c - 1) != 0
                ) {
                    this.set(r, c, 3 - this.get(r, c - 1))
                    changed = true
                }
            }
        }

        for (let c = 0; c < this.w; c++) {
            for (let r = 0; r < this.h - 1; r++) {
                const val = this.get(r, c)

                if (val != 0 && val == this.get(r + 1, c)) {
                    if (r != 0 && this.get(r - 1, c) == 0) {
                        this.set(r - 1, c, 3 - val)
                        changed = true
                    }
                    if (r < this.h - 2 && this.get(r + 2, c) == 0) {
                        this.set(r + 2, c, 3 - val)
                        changed = true
                    }
                }
            }
        }

        return changed
    }

    toString() {
        return Array.from(this.d)
            .map((x, i) => "•10"[x]! + (i % this.w == this.w - 1 ? "\n" : ""))
            .join("")
    }
}

// prettier-ignore
const init = new Game(6, 6, new Uint8Array([
    0, 0, 1, 0, 0, 0,
    2, 2, 0, 1, 0, 0,
    2, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 1, 0, 0,
    0, 0, 0, 0, 2, 0,
]))

console.log(init.toString())
while (init.step1());
console.log(init.toString())
