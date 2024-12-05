import "../util.js"

const [a, b] = input(2024, 5).on`\n\n`
const sheets = b.lines().on`,`.num()
const rules = a.lines().on`|`.num()

const afters = {}
for (const [a, b] of rules) {
  ;(afters[a] ??= []).push(b)
}

// part 1:
sheets
  .filter((sheet) => {
    return rules.every(([a, b]) => {
      const ai = sheet.indexOf(a)
      const bi = sheet.indexOf(b)
      if (ai != -1 && bi != -1) return ai < bi
      else return true
    })
  })
  .sum((x) => x[(x.length - 1) / 2])
  .check(6949)

sheets
  .filter((sheet) => {
    return !rules.every(([a, b]) => {
      const ai = sheet.indexOf(a)
      const bi = sheet.indexOf(b)
      if (ai != -1 && bi != -1) return ai < bi
      else return true
    })
  })
  .map((x) => x.sort((a, b) => (afters[a].includes(b) ? -1 : 1)))
  .sum((x) => x[(x.length - 1) / 2])
  .check(4145)
