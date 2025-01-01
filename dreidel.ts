export class Game {
  turn = 0

  constructor(readonly players: number[], public pot: number) {
    for (let i = 0; i < this.players.length; i++) {
      this.players[i]!--
      this.pot++
    }
  }

  roll() {
    const tag = Math.floor(Math.random() * 4)

    switch (tag) {
      // nil
      case 0:
        break

      // +50%
      case 1:
        const taken = Math.floor(this.pot / 2)
        this.players[this.turn]! += taken
        this.pot -= taken
        break

      // -1
      case 2:
        if (this.players[this.turn]!) {
          this.players[this.turn]!--
          this.pot++
        }
        break

      // +100%
      case 3:
        this.players[this.turn]! += this.pot
        this.pot++
        for (const [key, count] of this.players.entries()) {
          if (count) {
            this.players[key]!--
            this.pot++
          }
        }
        break
    }
  }

  go() {
    this.roll()
    this.turn = (this.turn + 1) % this.players.length
  }

  round() {
    for (const _ of this.players) {
      this.go()
    }
  }

  rounds(n: number) {
    for (let i = 0; i < n; i++) {
      this.round()
    }
  }
}

export function avg(
  games: number,
  rounds: number,
  initialPlayers: number[],
  initialPot: number,
) {
  const wins = Array.from({ length: initialPlayers.length }, () => 0)
  const total = Array.from({ length: initialPlayers.length }, () => 0)

  for (let i = 0; i < games; i++) {
    const game = new Game(initialPlayers.slice(), initialPot)
    game.rounds(rounds)
    for (let j = 0; j < total.length; j++) {
      total[j]! += game.players[j]!
    }
    const max = Math.max(...game.players)
    const winners = game.players
      .map((x, i) => [x, i] as const)
      .filter(([x]) => x == max)
      .map(([, i]) => i)
    for (const winner of winners) {
      wins[winner]! += 1 / winners.length
    }
  }

  return {
    totals: total.map((x) => x / games),
    wins,
  }
}

console.time()
console.log(
  avg(
    1000000,
    1,
    Array.from({ length: 10 }, () => 10),
    40,
  ),
)
console.timeEnd()
