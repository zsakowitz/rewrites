// https://stackoverflow.com/a/11697909
export class Bezier {
  ax
  bx
  cx
  ay
  by
  cy

  constructor(p1x = 0.25, p1y = 0.1, p2x = 0.25, p2y = 1.0) {
    this.cx = 3.0 * p1x
    this.bx = 3.0 * (p2x - p1x) - this.cx
    this.ax = 1.0 - this.cx - this.bx

    this.cy = 3.0 * p1y
    this.by = 3.0 * (p2y - p1y) - this.cy
    this.ay = 1.0 - this.cy - this.by
  }

  sampleCurveX(t: number) {
    return ((this.ax * t + this.bx) * t + this.cx) * t
  }

  sampleCurveY(t: number) {
    return ((this.ay * t + this.by) * t + this.cy) * t
  }

  sampleCurveDerivativeX(t: number) {
    return (3.0 * this.ax * t + 2.0 * this.bx) * t + this.cx
  }

  solveCurveX(x: number, epsilon: number) {
    var t0
    var t1
    var t2
    var x2
    var d2
    var i

    for (t2 = x, i = 0; i < 8; i++) {
      x2 = this.sampleCurveX(t2) - x
      if (Math.abs(x2) < epsilon) return t2
      d2 = this.sampleCurveDerivativeX(t2)
      if (Math.abs(d2) < epsilon) break
      t2 = t2 - x2 / d2
    }

    t0 = 0.0
    t1 = 1.0
    t2 = x

    if (t2 < t0) return t0
    if (t2 > t1) return t1

    while (t0 < t1) {
      x2 = this.sampleCurveX(t2)
      if (Math.abs(x2 - x) < epsilon) return t2
      if (x > x2) t0 = t2
      else t1 = t2

      t2 = (t1 - t0) * 0.5 + t0
    }

    return t2
  }

  solve(x: number, epsilon = 1e-6) {
    return this.sampleCurveY(this.solveCurveX(x, epsilon))
  }
}
