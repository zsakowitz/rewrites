import { ANSI } from "../ansi"

// {
//   const r = [
//     0.9714759681693133, 0.5861652458918069, 0.9076667460042577,
//     0.13776127858426668, 0.9265301405284453, 0.5643518408987609,
//     0.09819452670342854, 0.5259788110794457, 0.4402425210978358,
//     0.8385564241306055, 0.23691983276249262, 0.5679276564308433,
//     0.25424169600750346, 0.25543040832738584, 0.23648515203298826,
//     0.2918262739489691, 0.02596419332763822, 0.7127182457554926,
//     0.4719445444646251, 0.24213671095120615, 0.4353674847405722,
//     0.29615451085638866, 0.3368785914959229, 0.3149670722428132,
//     0.9814978828061446, 0.05203600539370168, 0.6279883789009735,
//     0.8563017205581497, 0.24407628437389672, 0.19199750330764143,
//     0.9191305204541681, 0.6093871921370728, 0.7574114457991296,
//     0.9187653916039856, 0.24860418842048282, 0.7051578015487063,
//     0.07593495786115334, 0.2325208915634619, 0.8472241089143439,
//     0.2581759250941794, 0.6289284508480203, 0.9815889710439382,
//     0.4096251961691537, 0.05216081384873461, 0.9399640062585113,
//     0.908990631478339, 0.08027971378735654, 0.36933644241436114,
//     0.483204983965295, 0.585952961465571, 0.38655824180634746,
//     0.07391940341110959, 0.79559942880091, 0.7177130500720136,
//     0.3133137431669285, 0.23459182471396556, 0.9322653424817913,
//     0.4701802334658861, 0.041744901032487625, 0.8220086845638003,
//     0.8653761173077622, 0.18559707719611251, 0.06459306297496781,
//     0.23579251921654532, 0.07921817552869348, 0.36119239983290596,
//     0.8446225598631095, 0.2102182738575118, 0.7017010889451997,
//     0.11538453213125865, 0.3705367971857745, 0.3415953014632809,
//     0.15462066896095428, 0.24700001620782475, 0.6042974601103709,
//     0.41916189285662775, 0.8162380610766479, 0.7048940732081956,
//     0.0918561755767856, 0.9795533834044484, 0.18792722996370115,
//     0.02103552955132637, 0.40323452011773664, 0.255097763188717,
//     0.5205664202652723, 0.7209807022583438, 0.09235765526904893,
//     0.15623623541931497, 0.7302511384086504, 0.5641548695905293,
//     0.5815759592223138, 0.26472381096879993, 0.5894991465899646,
//     0.15058108692322814, 0.0027214915753941415, 0.7428968660830029,
//     0.9203554787674474, 0.6533462940488918, 0.35353602020161035,
//     0.1661010790940236,
//   ]
//   Math.random = () => r.pop()!
// }

const FORCE_GRAVITY = -0.1
const FORCE_ATTRACT = -1
const FORCE_REPULSE = 4
const FORCE_INCADJS = (x: number) => 0 // 8 / (x / 20 + 1)
const MAX_DISPL_PER_VERTEX = 4

const COLORS = [
  ANSI.blue,
  ANSI.cyan,
  ANSI.green,
  ANSI.magenta,
  ANSI.red,
  ANSI.yellow,
]

function idColor(id: number) {
  return COLORS[id % COLORS.length]
}

export class Vertex<T, E> {
  constructor(
    readonly graph: Graph<T, E>,
    readonly id: number,
    public data: T,
  ) {}

  get edges() {
    return this.graph.ev[this.id] ?? []
  }

  createCycle(size: number, vertexData: T, edgeData: E) {
    if (size <= 0) {
      return
    }

    let base: Vertex<T, E> = this
    const g = this.graph
    for (let i = 0; i < size - 1; i++) {
      g.createEdge(base, (base = g.createVertex(vertexData)), edgeData)
    }
    g.createEdge(base, this, edgeData)
  }

  createBranch1(vertexData: T, edgeData: E) {
    const v = this.graph.createVertex(vertexData)
    this.graph.createEdge(this, v, edgeData)
    return v
  }

  createBranch(size: number, vertexData: T, edgeData: E) {
    if (size <= 0) return this
    let on: Vertex<T, E> = this
    for (let i = 0; i < size; i++) {
      on = on.createBranch1(vertexData, edgeData)
    }
    return on
  }

  toString() {
    return `${idColor(this.id)}#${this.id}${this.data == null ? "" : "=" + this.data}${ANSI.reset}`
  }
}

export class Edge<T, E> {
  constructor(
    readonly graph: Graph<T, E>,
    readonly sid: number,
    readonly did: number,
    public data: E,
  ) {}

  get src() {
    return this.graph.vl[this.sid]!
  }

  get dst() {
    return this.graph.vl[this.did]!
  }

  toString() {
    const data = this.data == null ? "" : `${ANSI.dim}(${this.data})`
    return `${idColor(this.sid)}${this.sid}${ANSI.reset} ${ANSI.dim}->${ANSI.reset} ${idColor(this.did)}${this.did}${ANSI.reset} ${data}${ANSI.reset}`
  }
}

export class Graph<T = void, E = void> {
  readonly vl: Vertex<T, E>[] = []
  readonly el: Edge<T, E>[] = []
  readonly ev: Edge<T, E>[][] = []

  createVertex(data: T) {
    const id = this.vl.length
    const v = new Vertex(this, id, data)
    this.vl.push(v)
    return v
  }

  createEdge(a: Vertex<T, E>, b: Vertex<T, E>, data: E) {
    const edge = new Edge(this, a.id, b.id, data)
    this.el.push(edge)
    ;(this.ev[a.id] ??= []).push(edge)
    ;(this.ev[b.id] ??= []).push(edge)
    return edge
  }

  logVertices() {
    console.log(this.vl.join(ANSI.dim + ", " + ANSI.reset))
  }

  logEdges() {
    console.log(this.el.join("\n"))
  }

  logGraph() {
    this.logVertices()
    this.logEdges()
  }
}

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

    for (const { sid: i, did: j } of g.el) {
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

function isWinningPosition(g: Graph<0 | 1 | void>): boolean {
  return g.vl.some((vertex) => {
    if (vertex.data !== undefined) {
      return false
    }

    const canPlay0 = !vertex.edges.some(
      (edge) => edge.src.data === 0 || edge.dst.data === 0,
    )

    const canPlay1 = !vertex.edges.some(
      (edge) => edge.src.data === 1 || edge.dst.data === 1,
    )

    if (canPlay0) {
      vertex.data = 0
      const weWinHere = !isWinningPosition(g)
      vertex.data = undefined
      if (weWinHere) return true
    }

    if (canPlay1) {
      vertex.data = 1
      const weWinHere = !isWinningPosition(g)
      vertex.data = undefined
      if (weWinHere) return true
    }
  })
}

function createGraph() {
  const g = new Graph<0 | 1 | void>()
  const v1 = g.createVertex()
  v1.createCycle(3)
  v1.createBranch(1)
  return g
}

const g = createGraph()
const now = Date.now()
const wins = isWinningPosition(g)
const dt = Date.now() - now
document.body.append(`Player ${wins ? 1 : 2} wins (computation took ${dt}ms).`)
new Visual(g).display()
