export function haunted(source: string) {
  type Cell = [row: number, col: number, cell: "S" | "E" | "." | "#"]

  const map = source
    .split("\n")
    .map(
      (x, i) => [i, x.split("").map((y, j) => [i, j, y] as const)] as const,
    ) as [row: number, data: Cell[]][]

  const start = map
    .map(([, row]) => row.find(([, , cell]) => cell))
    .find((x): x is Exclude<typeof x, undefined> => x != null)

  let exploredCells: Cell[] = [start!]

  let size = 0

  while (size < 100) {
    size++

    exploredCells = [
      ...new Set(
        exploredCells
          .flatMap(([i, j]) => [
            map[i - 1]?.[1][j],
            map[i + 1]?.[1][j],
            map[i]![1][j - 1],
            map[i]![1][j + 1],
          ])
          .filter((x) => x) as any,
      ),
    ] as any

    if (exploredCells.some((x) => x[2] == "E")) {
      return size
    }
  }
}
