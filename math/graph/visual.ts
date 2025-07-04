import type { Graph, Vertex } from "."

const FORCE_GRAVITY = -0.1
const FORCE_ATTRACT = -1
const FORCE_REPULSE = 4
const FORCE_INCADJS = (x: number) => 0 // 8 / (x / 20 + 1)
const MAX_DISPL_PER_VERTEX = 4

export type Pos = [x: number, y: number]

export class Visual<T, E> {
  readonly cv
  readonly #ctx
  #pos = new WeakMap<Vertex<T, E>, Pos>()
  readonly #x = 0
  readonly #y = 0
  readonly #w = 20
  constructor(readonly graph: Graph<T, E>) {
    const cv = (this.cv = document.createElement("canvas"))
    cv.width = this.#sizeAbsolute(innerWidth)
    cv.height = this.#sizeAbsolute(innerHeight)
    cv.style.width = cv.style.height = "100%"
    this.#ctx = cv.getContext("2d")!
  }

  #getPosition(vertex: Vertex<T, E>) {
    const pos = this.#pos.get(vertex)
    if (pos) return pos
    const newPos: Pos = [
      2 * (Math.random() - 0.5) * this.#w,
      2 * (Math.random() - 0.5) * this.#w,
    ]
    this.#pos.set(vertex, newPos)
    return newPos
  }

  #coords([x, y]: Pos): Pos {
    return [
      (((x - this.#x) / this.#w + 1) / 2) * this.cv.width,
      ((y - this.#y) / this.#w / 2) * this.cv.width + this.cv.height / 2,
    ]
  }

  #sizeAbsolute(size: number): number {
    return size * (globalThis.devicePixelRatio ?? 1)
  }

  draw() {
    this.#ctx.beginPath()
    this.#ctx.rect(0, 0, this.cv.width, this.cv.height)
    this.#ctx.fillStyle = "#fff4"
    this.#ctx.fill()
    this.#ctx.fillStyle = "#000"
    for (const edge of this.graph.el) {
      const pos1 = this.#getPosition(this.graph.vl[edge.sid]!)
      const pos2 = this.#getPosition(this.graph.vl[edge.did]!)
      const [cx1, cy1] = this.#coords(pos1)
      const [cx2, cy2] = this.#coords(pos2)
      this.#ctx.beginPath()
      this.#ctx.moveTo(cx1, cy1)
      this.#ctx.lineTo(cx2, cy2)
      this.#ctx.lineWidth = this.#sizeAbsolute(1)
      this.#ctx.stroke()
    }

    for (const vertex of this.graph.vl) {
      const pos = this.#getPosition(vertex)
      const [cx, cy] = this.#coords(pos)
      this.#ctx.beginPath()
      const size = this.#sizeAbsolute(4)
      this.#ctx.ellipse(cx, cy, size, size, 0, 0, 2 * Math.PI)
      this.#ctx.fill()
    }
  }

  #cap(s: number) {
    if (s < -1e2) {
      return -1e2
    }
    if (s > 1e2) {
      return 1e2
    }
    if (s != s) {
      return 0
    }
    return s
  }

  step = 0
  update(dt: number) {
    const forceIncrementalAdjustment = FORCE_INCADJS(++this.step)

    const vl = this.graph.vl
    const size = vl.length
    const pos = vl.map((v) => this.#getPosition(v))

    const forces = vl.map((_, i): Pos => {
      const [x, y] = pos[i]!
      const rawSize = Math.hypot(x, y)
      const direction = Math.atan2(y, x)
      const size = this.#cap(rawSize * FORCE_GRAVITY)
      return [size * Math.cos(direction), size * Math.sin(direction)]
    })

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (i == j) continue

        const pi = pos[i]!
        const pj = pos[j]!
        const dist = this.#cap(1 / Math.hypot(pi[1] - pj[1], pi[0] - pj[0]))
        const atan = Math.atan2(pi[1] - pj[1], pi[0] - pj[0])
        forces[i]![0] += FORCE_REPULSE * (Math.cos(atan) * dist)
        forces[i]![1] += FORCE_REPULSE * (Math.sin(atan) * dist)
      }
    }

    for (const { sid: i, did: j } of this.graph.el) {
      const pi = pos[i]!
      const pj = pos[j]!
      const dist = this.#cap(1 / Math.hypot(pi[1] - pj[1], pi[0] - pj[0]))
      const atan = Math.atan2(pi[1] - pj[1], pi[0] - pj[0])
      forces[i]![0] += FORCE_ATTRACT * (Math.cos(atan) * dist)
      forces[i]![1] += FORCE_ATTRACT * (Math.sin(atan) * dist)
      forces[j]![0] -= FORCE_ATTRACT * (Math.cos(atan) * dist)
      forces[j]![1] -= FORCE_ATTRACT * (Math.sin(atan) * dist)
    }

    let displacement = 0
    for (let i = 0; i < size; i++) {
      let sz = (Math.random() - 0.5) * forceIncrementalAdjustment
      let dir = Math.random() * (2 * Math.PI)
      let rx = Math.cos(dir) * sz
      let ry = Math.sin(dir) * sz
      const dx = forces[i]![0] * dt + rx
      const dy = forces[i]![1] * dt + ry
      displacement += Math.hypot(dx, dy)
      pos[i]![0] += dx
      pos[i]![1] += dy
    }

    return displacement
  }

  #resetPositions() {
    this.#pos = new WeakMap()

    for (let i = 0; i < 1e4; i++) {
      this.update(0.06)
    }
  }

  display() {
    document.body.appendChild(this.cv)
    this.#ctx.fillText(Math.random().toString(36).slice(2), 0, 20)

    const self = this
    self.#ctx.font = `${self.#sizeAbsolute(16)}px sans-serif`
    requestAnimationFrame(function frame(dt) {
      const stop =
        self.update(dt / 1e3) > MAX_DISPL_PER_VERTEX * self.graph.vl.length
      if (stop) {
        self.#ctx.fillText("killed due to excessive thrashing", 0, 32)
      } else {
        self.draw()
        requestAnimationFrame(frame)
      }
    })
  }
}
