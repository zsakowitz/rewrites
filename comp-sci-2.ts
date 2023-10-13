function unique<T>(array: readonly T[]) {
  return array.filter((x, i, a) => a.indexOf(x) == i).length
}

function ascii(size: number) {
  let output = []

  for (let i = 0; i < size; i++) {
    output.push(
      " ".repeat(size - i) + "/" + "  ".repeat(i) + "\\" + " ".repeat(size - i),
    )
  }

  for (let i = 1; i <= size; i++) {
    output.push(
      " ".repeat(i) + "\\" + "  ".repeat(size - i) + "/" + " ".repeat(i),
    )
  }

  return output.join("\n")
}

function starAscii(size: number) {
  const output = []

  for (let x = 1; x <= size; x += 2) {
    output.push(" ".repeat((size - x) / 2) + "*".repeat(x))
  }

  for (let x = size - 2; x >= 1; x -= 2) {
    output.push(" ".repeat((size - x) / 2) + "*".repeat(x))
  }

  return output.join("\n")
}

function minArrows(stars: [number, number][]) {
  unique(stars.map(([x, y]) => Math.atan2(y, x)))
}

function minArrowsWithRadius(stars: [x: number, y: number, r: number][]) {
  const angles = stars.map(([x, y, r]) => [])
}

export {}
