import { shuffle } from "../../shuffle"

let zero = false
function e(a: number, b: number, ...args: number[]) {
    zero = args.some((x) => x == 0)
    return isFinite(a) && isFinite(b) && a == b && a != 0
}

function* map() {
    for (let a1 = 0; a1 <= 9; a1++)
        for (let a2 = 0; a2 <= 9; a2++)
            for (let a3 = 0; a3 <= 9; a3++)
                for (let b1 = 0; b1 <= 9; b1++)
                    for (let b2 = 0; b2 <= 9; b2++)
                        for (let b3 = 0; b3 <= 9; b3++) {
                            yield [a1, a2, a3, b1, b2, b3] as const
                        }
}

const log0: string[] = []
const logx: string[] = []

function log(x: string) {
    if (zero) {
        log0.push(x)
    } else {
        logx.push(x)
    }
}

for (const [a1, a2, a3, b1, b2, b3] of map()) {
    const A = 100 * a1 + 10 * a2 + a3
    const B = 100 * b1 + 10 * b2 + b3
    if (A == 0 || B == 0 || A == B) continue

    const s =
        ("" + A).padStart(3, "0") + " / " + ("" + B).padStart(3, "0") + " "

    if (a1 == b2 && e(A / B, (10 * a2 + a3) / (10 * b1 + b3), a1)) {
        log(s + "@(1/2)")
    }

    if (a1 == b3 && e(A / B, (10 * a2 + a3) / (10 * b1 + b2), a1)) {
        log(s + "@(1/3)")
    }

    if (a2 == b1 && e(A / B, (10 * a1 + a3) / (10 * b2 + b3), a2)) {
        log(s + "@(2/1)")
    }

    if (a2 == b3 && e(A / B, (10 * a1 + a3) / (10 * b1 + b2), a2)) {
        log(s + "@(2/3)")
    }

    if (a3 == b1 && e(A / B, (10 * a1 + a2) / (10 * b2 + b3), a3)) {
        log(s + "@(3/1)")
    }

    if (a3 == b2 && e(A / B, (10 * a1 + a2) / (10 * b1 + b3), a3)) {
        log(s + "@(3/2)")
    }

    if (a1 == b2 && a2 == b1 && e(A / B, a3 / b3, a1, a2)) {
        log(s + "@(1/2,2/1)")
    }

    if (a2 == b3 && a3 == b2 && e(A / B, a1 / b1, a2, a3)) {
        log(s + "@(2/3,3/2)")
    }

    if (a1 == b3 && a3 == b1 && e(A / B, a2 / b2, a1, a3)) {
        log(s + "@(3/1,1/3)")
    }

    if (a1 == b2 && a2 == b3 && e(A / B, a3 / b1, a1, a2)) {
        log(s + "@(1/2,2/3)")
    }

    if (a2 == b3 && a3 == b1 && e(A / B, a1 / b2, a2, a3)) {
        log(s + "@(2/3,3/1)")
    }

    if (a3 == b1 && a1 == b2 && e(A / B, a2 / b3, a3, a1)) {
        log(s + "@(3/1,1/2)")
    }
}

console.log(
    shuffle(log0).join("\n")
        + "\n---\n"
        + shuffle(logx.filter((x) => x.includes("0"))).join("\n")
        + "\n---\n"
        + shuffle(logx.filter((x) => !x.includes("0"))).join("\n"),
)
