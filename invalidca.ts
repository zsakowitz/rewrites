import {
  ALL_AFFILIATIONS,
  ALL_CONFIGURATIONS,
  ALL_ESSENCES,
  ALL_EXTENSIONS,
  ALL_PERSPECTIVES,
  attemptGemination,
  caToIthkuil,
  geminatedCAToIthkuil,
  isLegalConsonantForm,
  type CA,
} from "@zsnout/ithkuil/generate/index.js"

const allCAs: CA[] = ALL_AFFILIATIONS.flatMap((affiliation) =>
  ALL_CONFIGURATIONS.flatMap((configuration) =>
    ALL_EXTENSIONS.flatMap((extension) =>
      ALL_PERSPECTIVES.flatMap((perspective) =>
        ALL_ESSENCES.map((essence) => ({
          affiliation,
          configuration,
          extension,
          perspective,
          essence,
        })),
      ),
    ),
  ),
)

const forms = allCAs.map((ca) => {
  const ungem = caToIthkuil(ca)
  const attempt = attemptGemination(ungem)
  const gem = geminatedCAToIthkuil(ca)
  return {
    ca,
    ungem,
    gem,
    ok: {
      diff: attempt != ungem,
      ungem: isLegalConsonantForm(ungem),
      gem: isLegalConsonantForm(gem),
    },
  }
})

function dump({ ca, gem, ok, ungem }: (typeof forms)[number]) {
  let label = `${ca.affiliation}.${ca.configuration}.${ca.extension}.${ca.perspective}.${ca.essence}`
  label += `  ${ok.ungem ? "✅" : "❌"}${ungem.padEnd(5)}`
  label += `  ${ok.diff && ok.gem ? "✅" : "❌"}${gem}`
  console.log(label)
}

console.log("<<INVALID UNGEMINATED CA FORMS>>\n")
forms.filter((x) => !x.ok.ungem).forEach(dump)
console.log("\n<<ALL ERRORS>>\n")
forms.filter((x) => !(x.ok.diff && x.ok.gem && x.ok.ungem)).forEach(dump)
console.log("\n<<ALL CA VALUES>>\n")
forms.forEach(dump)
