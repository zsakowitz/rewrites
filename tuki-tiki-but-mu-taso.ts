const toki = `li
mi
e
a
ni
pona
toki
la
lon
ala
sina
o
pi
tawa
jan
ona
sona
ken
seme
kama
tenpo
mute
wile
taso
ma
nimi
mu
tan
musi
sitelen
ale
pilin
ike
ilo
lili
lukin
ijo
pali
kepeken
suli
tomo
sama
ante
anu
wawa
nasin
moku
tu
pana
wan
soweli
n
lipu
jo
kulupu
nasa
kin
weka
telo
pini
luka
pakala
sin
nanpa
lawa
kalama
lape
awen
suno
en
suwi
poka
sewi
sike
waso
kasi
olin
kon
unpa
alasa
poki
insa
moli
utala
len
open
seli
kili
mama
mun
ko
linja
kute
pimeja
kiwen
kule
sijelo
kala
pan
meli
mani
anpa
uta
palisa
akesi
pipi
kijetesantakalu
esun
jaki
supa
loje
tonsi
laso
noka
sinpin
walo
monsuta
nena
mije
jelo
lete
pu
lupa
selo
namako
monsi
leko
kipisi
ku
soko
misikeke`.split("\n")

const tuki = `ilu	ilo, nasin
kati	kasi, lipu
kiku	kiwen, ma
ku	kon, pilin, kalama
lapi	lape, lete, moli
lika	linja, palisa, luka, noka
lili	lili
lupa	lupa, poki, tomo, uta, insa
muku	moku, suwi
muti	musi
paka	pakala, utala
pali	pali
puka	poka, monsi, en
taka	tawa, kama, ante, tenpo
tiki	sike, sin, tenpo
tiku	sewi, lawa, supa, suli
tilu	telo
tipi	sinpin, anu
titi	sitelen, kon, nimi
tu	tu, mute, kulupu
tuki	toki, mu, pilin
tulu	suno, seli, kule, wawa
uli	wile, wawa, nasin
upi	sin, open, tan`
  .split("\n")
  .map((a) => a.split("\t"))
  .map(
    ([tuki, tok]) =>
      [
        tuki,
        tok,
        tok
          .split(", ")
          .map((word) => toki.indexOf(word))
          .reduce((a, b) => a + b, 0) / tok.length,
      ] as const,
  )
  .sort(([, , a], [, , b]) => a - b)
  .map(([a, b]) => a + "\t" + b)
  .join("\n")
