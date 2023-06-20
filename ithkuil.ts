import {
  ALL_AFFILIATIONS,
  ALL_CONFIGURATIONS,
  ALL_ESSENCES,
  ALL_EXTENSIONS,
  ALL_PERSPECTIVES,
  caToIthkuil,
  geminateCA,
} from "@zsnout/ithkuil"

console.log(`Ca slot              Form     Geminate    Full Ca slot
-----------------    ----     --------    -----------------`)

for (const affiliation of ALL_AFFILIATIONS) {
  for (const configuration of ALL_CONFIGURATIONS) {
    for (const essence of ALL_ESSENCES) {
      for (const extension of ALL_EXTENSIONS) {
        for (const perspective of ALL_PERSPECTIVES) {
          const result = caToIthkuil({
            affiliation,
            configuration,
            essence,
            extension,
            perspective,
          })

          console.log(
            (
              [
                affiliation == "CSL" ? "" : affiliation,
                configuration == "UPX" ? "" : configuration,
                extension == "DEL" ? "" : extension,
                perspective == "M" ? "" : perspective,
                essence == "NRM" ? "" : essence,
              ]
                .filter((x) => x)
                .join("-") || "[default Ca]"
            ).padEnd(20, " "),

            result.padEnd(8, " "),
            geminateCA(result).padEnd(12, " "),

            [affiliation, configuration, extension, perspective, essence].join(
              "-",
            ),
          )
        }
      }
    }
  }
}
