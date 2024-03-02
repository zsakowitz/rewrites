const array = `mi
li
e
pona
toki
ni
a
la
ala
lon
sina
jan
tawa
sona
seme
pi
tenpo
ona
mute
taso
wile
o
pilin
kama
ken
ike
lili
tan
nimi
pali
ma
musi
sitelen
kepeken
tomo
ale
lukin
jo
kin
pini
ilo
anu
ante
lape
moku
sama
suli
kalama
suno
telo
kulupu
nasa
sina
lipu
pana
pakala
ijo
soweli
tu
nasin
lawa
en
wawa
weka
wan
mu
awen
nanpa
olin
suwi
kon
seli
sewi
kute
mama
sike
moli
pimeja
lete
kasi
luka
sijelo
uta
poka
kala
jaki
insa
utala
mani
linja
open
len
waso
pan
ko
esun
kili
pipi
supa
kiwen
poki
palisa
kule
laso
noka
loje
walo
unpa
anpa
mun
nena
akesi
alasa
sinpin
selo
jelo
monsi
lupa
meli
mije
tonsi
namako
kijetesantakalu
pu
ku
leko
monsuta
n`.split("\n")

export interface Pair {
  a: string
  b: string
  ac: string
  bc: string
}

export function find(data: readonly string[]) {
  const pairs: Pair[] = []

  for (const a of data) {
    for (const b of data) {
      if (a.length != b.length || a == b) {
        continue
      }

      const differenceIndices = a
        .split("")
        .map((x, i) => [x, i] as const)
        .filter(([a, i]) => b[i] != a)

      if (differenceIndices.length != 1) {
        continue
      }

      const index = differenceIndices[0]![1]

      pairs.push({ a, b, ac: a[index]!, bc: b[index]! })
    }
  }

  return pairs
}

const pairs = find(array)
  .map(({ a, b, ac, bc }) => `${a}\t${b}\t${ac}\t${bc}`)
  .join("\n")

export function reduce(rawData: readonly string[]) {
  const data = rawData.filter((x, i, a) => a.indexOf(x) == i).sort()

  const chars = data
    .join("")
    .split("")
    .filter((x, i, a) => a.indexOf(x) == i)
    .sort()

  const output = []

  for (let i = 0; i < chars.length; i++) {
    const a = chars[i]!

    for (const b of chars) {
      if (a == b) {
        continue
      }

      const next = data.map((x) => x.replaceAll(a, b))

      const merged = next
        .map((x, i) => [x, i] as const)
        .filter(([x, i]) => next.indexOf(x) != i)
        .map(([, i]) => i)

      output.push(
        `${a} -> ${b}\t${merged.length}\t${merged
          .map((index) => `${data[next.indexOf(next[index]!)]}/${data[index]}`)
          .join(", ")}`,
      )
    }
  }

  return output.join("\n")
}
