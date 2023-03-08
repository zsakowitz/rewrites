export interface FivePointConic {
  x1: number
  y1: number
  x2: number
  y2: number
  x3: number
  y3: number
  x4: number
  y4: number
  x5: number
  y5: number
}

function _solution({
  x1,
  y1,
  x2,
  y2,
  x3,
  y3,
  x4,
  y4,
  x5,
  y5,
}: FivePointConic) {
  let A!: number
  let B!: number
  let C!: number
  let D!: number
  let E!: number

  // 1. Given.
  A * x1 * x1 +
    B * x1 * y1 +
    C * y1 * y1 +
    D * x1 +
    E * y1 +
    1 ==
    0

  const F1 = y2 / y1

  // 2. Multiply (1) by F1.
  A * F1 * x1 * x1 +
    B * (y2 / y1) * x1 * y1 +
    C * (y2 / y1) * y1 * y1 +
    D * F1 * x1 +
    E * (y2 / y1) * y1 +
    1 * F1 ==
    0

  // 3. Simplify.
  A * F1 * x1 * x1 +
    B * x1 * y2 +
    C * y1 * y2 +
    D * F1 * x1 +
    E * y2 +
    F1 ==
    0

  // 4. Given.
  A * x2 * x2 +
    B * x2 * y2 +
    C * y2 * y2 +
    D * x2 +
    E * y2 +
    1 ==
    0

  // 5. Subtract (3) from 4.
  A * (x2 * x2 - F1 * x1 * x1) +
    B * (x2 * y2 - x1 * y2) +
    C * (y2 * y2 - y1 * y2) +
    D * (x2 - F1 * x1) +
    E * (y2 - y2) +
    (1 - F1) ==
    0

  // 6. Simplify.
  A * (x2 * x2 - F1 * x1 * x1) +
    B * y2 * (x2 - x1) +
    C * y2 * (y2 - y1) +
    D * (x2 - F1 * x1) +
    (1 - F1) ==
    0

  // Given.
  A * x3 * x3 +
    B * x3 * y3 +
    C * y3 * y3 +
    D * x3 +
    E * y3 +
    1 ==
    0

  // Given.
  A * x4 * x4 +
    B * x4 * y4 +
    C * y4 * y4 +
    D * x4 +
    E * y4 +
    1 ==
    0

  // Given.
  A * x5 * x5 +
    B * x5 * y5 +
    C * y5 * y5 +
    D * x5 +
    E * y5 +
    1 ==
    0
}
