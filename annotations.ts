// Utilities for figuring out the relation between pages annotated in a book
// when examined a few times and total percentage of pages annotated in that
// same book.

import { shuffle } from "./shuffle"

export function runOnce(
    approximateActualPercentage: number,
    pagesTotal: number,
    inspected: number,
): { annotated: number; blank: number } {
    const pages = shuffle(
        Array.from(
            { length: pagesTotal },
            () => Math.random() < approximateActualPercentage,
        ),
    ).slice(0, inspected)

    return {
        annotated: pages.reduce((a, b) => a + +b, 0),
        blank: pages.reduce((a, b) => a + +!b, 0),
    }
}

export function runMany(
    pcBrackets: number,
    pagesTotal: number,
    inspected: number,
    countPerPc: number,
): Map<
    /* .annotated */ number,
    Map</* .percentage */ number, /* count */ number>
> {
    const result = new Map<number, Map<number, number>>()

    for (let i = 0; i < pcBrackets; i++) {
        const pc = i / pcBrackets

        const approximateActualPercentage =
            i / pcBrackets + Math.random() / pcBrackets

        for (let i = 0; i < countPerPc; i++) {
            const { annotated } = runOnce(
                approximateActualPercentage,
                pagesTotal,
                inspected,
            )

            let submap = result.get(annotated)
            if (!submap) {
                result.set(annotated, (submap = new Map()))
            }

            submap.set(pc, (submap.get(pc) ?? 0) + 1)
        }
    }

    return result
}

export function format(
    data: Map</* .percentage */ number, /* count */ number>,
) {
    const total = Array.from(data).reduce((a, b) => a + b[1], 0)

    let output = ""
    let count = 0
    for (const [key, value] of Array.from(data).reverse()) {
        count += value
        if (output) {
            output += "\n"
        }
        output += `${key}\t${count / total}`
    }

    return output
}
