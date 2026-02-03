import * as Z from "../../parsers/parser-5.js"

export function makeParserFromMap<T>(map: Record<string, T>): Z.Parser<T> {
    const items = Object.keys(map)
        .join("|")
        .split(/[|/]/g)
        .sort((a, b) =>
            a.length < b.length ? 1
            : a.length > b.length ? -1
            : 0,
        )

    const regex = new RegExp("^(?:" + items.join("|") + ")", "i")

    return Z.regex(regex).map((result) => map[result[0]]!)
}
