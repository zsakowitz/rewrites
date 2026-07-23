import { File } from "./file"

const file = new File(
    "world.nya",
    `line 1\nline 2\nlinewor 3\nline 4\nline 5 but extra\nline 6\nline 7`,
)

const rows = [
    0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3,
    3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5,
    5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6,
]

const cols = [
    0, 1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0,
    1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    0, 1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4, 5, 6,
]

for (let i = 0; i < rows.length; i++) {
    console.assert(file.row(i) === rows[i]!)
    console.assert(file.col(i, file.row(i)) === cols[i]!)
}
