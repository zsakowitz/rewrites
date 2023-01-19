// An engine that automatically runs dominoes games. #game

function shuffle<T>(arr: T[]): T[] {
  return arr.sort(() => (Math.random() < 0.5 ? -1 : 0))
}

class Domino {
  constructor(public a: number, public b: number) {}

  against(n: number) {
    if (this.a === n) return this.b
    if (this.b === n) return this.a
  }

  static index: Domino[][] = []
  static dominoes: Domino[] = []

  static of(a: number, b: number) {
    if (a < b) [a, b] = [b, a]
    return this.index[a]![b]!
  }
}

Domino.index = Array<Domino[]>(7)
  .fill(0 as any)
  .map((_, i) =>
    Array<Domino>(i + 1)
      .fill(0 as any)
      .map((_, j) => new Domino(i, j))
  )

Domino.dominoes = Domino.index.flat()

class Player {
  dominoes: Domino[] = []
}

interface GameData {
  startingPlayer?: number
  startingNumber?: number
  didStart: boolean

  winningPlayer?: number
  tilesLeftByPlayers?: number
  tilesLeftInDeck?: number
  didFinish: boolean

  turns: number
}

class Game {
  static many(count: number, players: number) {
    return Array(count)
      .fill(0)
      .map(() => new Game(players).play().data)
  }

  players: Player[] = []
  dominoes: Domino[] = shuffle(Domino.index.flat().slice())

  turn!: number
  a!: number
  b!: number

  data: GameData = { didStart: false, didFinish: false, turns: 0 }

  constructor(players: number) {
    this.players = Array<Player>(players)
      .fill(0 as any)
      .map(() => {
        const player = new Player()
        player.dominoes = this.dominoes.splice(0, 7)
        return player
      })

    for (let i = 6; i >= 0; i--) {
      if (this.startWithDouble(i)) {
        this.data.startingNumber = i
        this.data.didStart = true
        this.data.turns = 1
        break
      }
    }
  }

  startWithDouble(n: number) {
    const domino = Domino.of(n, n)

    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i]!
      const index = player.dominoes.indexOf(domino)

      if (index !== -1) {
        this.data.startingPlayer = this.turn = i
        this.a = this.b = n
        player.dominoes.splice(index, 1)

        return true
      }
    }

    return false
  }

  play() {
    if (!this.data.didStart) return this

    for (let final = 0; final < 112 /* 28 x 4 */; final++) {
      this.turn = (this.turn + 1) % this.players.length
      const player = this.players[this.turn]!
      this.data.turns++

      let didPlay = false
      for (let i = 0; i < player.dominoes.length; i++) {
        const domino = player.dominoes[i]!

        const a = domino.against(this.a)
        if (a !== undefined) {
          this.a = a
          player.dominoes.splice(i, 1)
          didPlay = true
          break
        }

        const b = domino.against(this.b)
        if (b !== undefined) {
          this.b = b
          player.dominoes.splice(i, 1)
          didPlay = true
          break
        }
      }

      if (!didPlay) {
        if (this.dominoes.length) {
          const domino = this.dominoes.pop()!
          player.dominoes.unshift(domino)

          const a = domino.against(this.a)
          if (a !== undefined) {
            this.a = a
            player.dominoes.splice(0, 1)
            didPlay = true
          } else {
            const b = domino.against(this.b)
            if (b !== undefined) {
              this.b = b
              player.dominoes.splice(0, 1)
              didPlay = true
            }
          }
        }
      }

      if (player.dominoes.length === 0) {
        this.data.didFinish = true
        this.data.winningPlayer = this.turn

        this.data.tilesLeftByPlayers = this.players.reduce(
          (count, player) => count + player.dominoes.length,
          0
        )

        this.data.tilesLeftInDeck = this.dominoes.length

        return this
      }
    }

    return this
  }
}

export {}
