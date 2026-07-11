import {
    ALL_AFFILIATIONS,
    ALL_CONFIGURATIONS,
    ALL_ESSENCES,
    ALL_EXTENSIONS,
    ALL_PERSPECTIVES,
    caToIthkuil,
    geminateCa,
} from "@zsnout/ithkuil/generate"

const all = ALL_AFFILIATIONS.flatMap((affiliation) =>
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

for (const el of all) {
    console.log(Object.values(el).join(".") + " " + geminateCa(caToIthkuil(el)))
}
