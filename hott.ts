export type Level =
    | { k: "var"; v: number }
    | { k: "succ"; v: Level }
    | { k: "zero"; v: null }
    | { k: "max"; v: [Level, Level] }

export function printLevel(x: Level): string {
    switch (x.k) {
        case "var":
            return ["u", "v", "w", "U", "V", "W"][x.v] ?? "#" + x.v

        case "succ":
            return "S" + printLevel(x.v)

        case "zero":
            return "0"

        case "max":
            return `max(${printLevel(x.v[0])},${printLevel(x.v[1])})`
    }
}

// checks if x <= y+o
function lteLevel(x: Level, y: Level, o: number): boolean {
    if (x.k == "max") {
        return lteLevel(x.v[0], y, o) && lteLevel(x.v[1], y, o)
    }

    if (y.k == "max") {
        return lteLevel(x, y.v[0], o) || lteLevel(x, y.v[1], o)
    }

    if (x.k == "zero") {
        return true
    }

    if (x.k == "succ") {
        if (o >= 1) return lteLevel(x.v, y, o - 1)
        if (y.k == "succ") return lteLevel(x, y, o)
        return false // maybe
    }

    if (y.k == "zero") {
        return false // maybe
    }

    if (y.k == "succ") {
        return lteLevel(x, y, o + 1)
    }

    return x.v == y.v
}

export function checkLevel(a: Level, b: Level) {
    if (!lteLevel(a, b, 0)) {
    }
}
