import {
    ALL_AFFILIATIONS,
    ALL_CONFIGURATIONS,
    ALL_ESSENCES,
    ALL_EXTENSIONS,
    ALL_PERSPECTIVES,
    affiliationToIthkuil,
    caToIthkuil,
    configurationToIthkuil,
    extensionToIthkuil,
    fillInDefaultCAValues,
    perspectiveAndEssenceToIthkuil,
} from "@zsnout/ithkuil/generate/index.js"

const allCAs = ALL_AFFILIATIONS.flatMap((affiliation) =>
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

const unallomorphed = allCAs.map((ca) => {
    const configuration = configurationToIthkuil(ca.configuration)

    const extension = extensionToIthkuil(
        ca.extension,
        ca.configuration == "UPX",
    )

    const affiliation = affiliationToIthkuil(
        ca.affiliation,

        configuration == ""
            && extension == ""
            && ca.perspective == "M"
            && ca.essence == "NRM",
    )

    const perspectiveAndEssence = perspectiveAndEssenceToIthkuil(
        ca.perspective,
        ca.essence,
        affiliation == "" && configuration == "" && extension == "",
        !!(affiliation + configuration + extension).match(/[kpt]$/),
    )

    const core = affiliation + configuration + extension + perspectiveAndEssence
})
