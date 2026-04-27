type Expr =
    | { k: "exp"; v: Expr }
    | { k: "log"; v: Expr }
    | { k: "var"; v: string }
    | { k: "sub"; v: [Expr, Expr] }
    | { k: "const"; v: [number, number] }

function exp(x: Expr): Expr {
    return (
        x.k == "log" ? x.v
        : x.k == "const" ?
            {
                k: "const",
                v: [
                    // exp(a+bi) == exp(a) exp(bi) == exp(a) (cos b + i sin b)
                    Math.exp(x.v[0]) * Math.cos(x.v[1]),
                    Math.exp(x.v[0]) * Math.sin(x.v[1]),
                ],
            }
        :   { k: "exp", v: x }
    )
}

function log(x: Expr): Expr {
    return (
        x.k == "exp" ? x.v
        : x.k == "const" ?
            {
                k: "const",
                v: [
                    // log(a+bi) == log(r * exp(i * t)) == log(r) + i * t
                    Math.log(Math.hypot(x.v[0], x.v[1])),
                    Math.atan2(x.v[1], x.v[0]),
                ],
            }
        :   { k: "log", v: x }
    )
}

function sub(x: Expr, y: Expr): Expr {
    return (
        x.k == "var" && y.k == "var" && x.v == y.v ? { k: "const", v: [0, 0] }
        : x.k == "const" && y.k == "const" ?
            { k: "const", v: [x.v[0] - y.v[0], x.v[1] - y.v[1]] }
        :   { k: "sub", v: [x, y] }
    )
}

function eml(x: Expr, y: Expr) {
    return sub(exp(x), log(y))
}

function str(x: Expr): string {
    let a

    return (
        x.k == "const" ?
            x.v[1] == 0 ? "" + x.v[0]
            : x.v[0] == 0 ? x.v[1] + "i"
            : x.v[0]
                + " "
                + (x.v[1] < 0 ? "-" : "+")
                + " "
                + Math.abs(x.v[1])
                + "i"
        : x.k == "var" ? x.v
        : x.k == "sub" ?
            (a = str(x.v[1])).includes(" - ") ?
                `${str(x.v[0])} - (${a})`
            :   `${str(x.v[0])} - ${a}`
        : (a = str(x.v)).includes(" ") ? `${x.k}(${a})`
        : `${x.k} ${a}`
    )
}

function next(x: Expr[]): Expr[] {
    return Array.from(
        new Map(
            x
                .concat(x.flatMap((a) => x.flatMap((b) => eml(a, b))))
                .filter(
                    (x) => x.k != "const" || Math.hypot(x.v[0], x.v[1]) < 24,
                )
                .map((x) => [str(x), x] as const),
        ).values(),
    )
}

const I0: Expr[] = [{ k: "const", v: [1, 0] }]
const I1 = next(I0)
const I2 = next(I1)
const I3 = next(I2)
const I4 = next(I3)
const I5 = next(I4)
console.log(I5.length)
const I6 = next(I5)
console.log(I6.map(str).filter((x) => x.startsWith("3.14")))
console.log(I6.map(str).filter((x) => x.startsWith("3.14159")))
