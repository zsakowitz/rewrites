import "../util.js"

const [a, b] = input(2024, 5).on`\n\n`
const sheets = b.lines().on`,`.num()
const rules = a.lines().on`|`.num()

const afters = {}
for (const [a, b] of rules) {
  ;(afters[a] ??= []).push(b)
}

function ok(sheet) {
  return rules.every(([a, b]) => {
    const ai = sheet.i(a)
    const bi = sheet.i(b)
    if (ai != -1 && bi != -1) return ai < bi
    else return true
  })
}

// part 1:
sheets
  .filter(ok)
  .sum((x) => x.mid())
  .check(6949)

sheets
  .filter(ok.inv())
  .map((x) => x.sby((a, b) => afters[a].includes(b).s()))
  .sum((x) => x.mid())
  .check(4145)
