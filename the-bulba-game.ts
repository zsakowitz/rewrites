// A board generator for a fun game.

import { randomItem } from "./random-item.js"
import { shuffle } from "./shuffle.js"

function capitalize(text: string) {
    return text.slice(0, 1).toUpperCase() + text.slice(1)
}

function capitalizeAll(text: string) {
    return text.split(" ").map(capitalize).join(" ")
}

function unique(fn: () => string): () => string {
    const alreadyPicked: string[] = []

    return () => {
        for (let i = 0; i < 100; i++) {
            const value = fn()
            if (!alreadyPicked.includes(value)) {
                alreadyPicked.push(value)
                return value
            }
        }

        throw new Error("Could not find suitable value.")
    }
}

const squares = {
    groceryStore() {
        return "Grocery Store"
    },

    hospital() {
        return "Hospital"
    },

    park() {
        return "Park"
    },

    battle() {
        return randomItem(["Battle of Weapons", "Battle of Wits"])
    },

    predictor() {
        return randomItem(["Tent of Time", "Canopy of Change"])
    },

    evilShop() {
        return randomItem(["Poison Shop", "Plague Shop"])
    },

    mine() {
        return randomItem(["Gold Mine", "Gem Mine"])
    },

    policeStation() {
        return "Police Station"
    },

    bank() {
        return "Bank of " + randomItem(["Souls", "Intellect"])
    },

    portal() {
        return "Portal"
    },

    suspiciousPlace() {
        return randomItem([
            "Suspicious Alley",
            "Shady Building",
            "Sleazy Corner",
        ])
    },

    wasteland() {
        return randomItem([
            "Canyon",
            "Cave",
            "Desert",
            "Jungle",
            "Mountain",
            "Ocean",
            "Space",
            "Swamp",
            "Tundra",
            "Volcano",
        ])
    },

    sewer() {
        return (
            randomItem([
                "AI",
                "Bear",
                "Cat",
                "Crocodile",
                "Dog",
                "Lion",
                "Rat",
                "Snake",
            ]) + "-Infested Sewer"
        )
    },
}

function createUniqueSquares() {
    const sqrs = { ...squares }

    for (const key in sqrs) {
        sqrs[key as keyof typeof sqrs] = unique(sqrs[key as keyof typeof sqrs])
    }

    return sqrs
}

function generateBoard() {
    const {
        bank,
        battle,
        evilShop,
        groceryStore,
        hospital,
        mine,
        park,
        policeStation,
        portal,
        predictor,
        sewer,
        suspiciousPlace,
        wasteland,
    } = createUniqueSquares()

    return [
        [
            wasteland(),
            ...shuffle([bank(), sewer(), suspiciousPlace(), park()]),
            wasteland(),
        ],
        [, , , , , battle()],
        [],
        [],
        [],
        [
            wasteland(),
            ...shuffle([mine(), predictor(), evilShop(), hospital()]),
            wasteland(),
        ],
    ]
}

function boardToTable(board: readonly (readonly (string | undefined)[])[]) {
    const table = document.createElement("table")
    const tbody = document.createElement("tbody")
    table.appendChild(tbody)

    for (const row of board) {
        const tr = document.createElement("tr")
        tbody.appendChild(tr)

        for (const el of row) {
            const td = document.createElement("td")
            td.textContent = el ?? ""
            td.style.padding = "0.25rem 0.5rem"
            td.style.textAlign = "center"
            td.style.width = "7rem"
            td.style.height = "3rem"
            tr.appendChild(td)
        }
    }

    return table
}

for (let i = 0; i < 10; i++) {
    const board = generateBoard()
    const table = boardToTable(board)
    table.style.marginBottom = "10rem"
    table.border = "1px"
    table.cellSpacing = "0"
    table.style.borderCollapse = "collapse"
    document.body.appendChild(table)
}

export {}
