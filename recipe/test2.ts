import { Recipe, RecipeSet, Type } from "."

const Redstone = new Type("Redstone", "item")
const DarkOakLog = new Type("DarkOakLog", "item")
const Charcoal = new Type("Charcoal", "item")
const StoneDust = new Type("StoneDust", "item")
const RawCoal = new Type("RawCoal", "item")
const RawGold = new Type("RawGold", "item")
const RawSodalite = new Type("RawSodalite", "item")
const RawPentalandite = new Type("RawPentalandite", "item")
const RawRealgar = new Type("RawRealgar", "item")
const RawSilver = new Type("RawSilver", "item")
const CrushedLepidolite = new Type("CrushedLepidolite", "item")
const CrushedPyrochlore = new Type("CrushedPyrochlore", "item")
const CrushedPyrolusite = new Type("CrushedPyrolusite", "item")
const CrushedMagnesite = new Type("CrushedMagnesite", "item")
const ChromiteSludgeDust = new Type("ChromiteSludgeDust", "item")
const RareEarthSludgeDust = new Type("RareEarthSludgeDust", "item")
const VanadiumMagnetiteSludgeDust = new Type(
    "VanadiumMagnetiteSludgeDust",
    "item",
)
const CobaltiteSludeDust = new Type("CobaltiteSludeDust", "item")
const CrushedBeryllium = new Type("CrushedBeryllium", "item")
const CrushedZavaritskite = new Type("CrushedZavaritskite", "item")

const Creosote = new Type("Creosote", "fluid")
const Lubricant = new Type("Lubricant", "fluid")
const DrillingFluid = new Type("DrillingFluid", "fluid")
const RareOreResidue = new Type("RareOreResidue", "fluid")
const RawOreSlurry = new Type("RawOreSlurry", "fluid")
const MixedMineralResidue = new Type("MixedMineralResidue", "fluid")
const MoltenOreMixture = new Type("MoltenOreMixture", "fluid")
const Water = new Type("Water", "fluid")
const OxygeneousMineralMixture = new Type("OxygeneousMineralMixture", "fluid")
const SulfuricMineralMixture = new Type("SulfuricMineralMixture", "fluid")

const recipes = new RecipeSet([
    new Recipe("Source", "0s")
        .withOutput(Redstone, 1)
        .withOutput(DarkOakLog, 1)
        .withOutput(Charcoal, 1)
        .withOutput(StoneDust, 1)
        .withOutput(Water, 1),

    new Recipe("Pyrolyse Oven", "10.65s")
        .withInput(DarkOakLog, 16)
        .withOutput(Charcoal, 20)
        .withOutput(Creosote, 4000),

    new Recipe("Brewery", "3.2s")
        .withInput(Creosote, 1000)
        .withInput(Redstone, 1)
        .withOutput(Lubricant, 1000),

    new Recipe("Mixer", "16t")
        .withInput(StoneDust, 1)
        .withInput(Lubricant, 20)
        .withInput(Water, 4980)
        .withOutput(DrillingFluid, 5000),

    new Recipe("Void Extractor", "8s")
        .withInput(DrillingFluid, 5000)
        .withOutput(RawCoal, 1)
        .withOutput(RawGold, 1)
        .withOutput(RawSodalite, 1)
        .withOutput(RawPentalandite, 1)
        .withOutput(RawRealgar, 1)
        .withOutput(RawSilver, 1)
        .withOutput(RareOreResidue, 400)
        .withOutput(RawOreSlurry, 600)
        .multiply(8),

    new Recipe("Centrifuge", "3s")
        .withInput(RawOreSlurry, 1000)
        .withOutput(MixedMineralResidue, 750)
        .withOutput(MoltenOreMixture, 250)
        .withOutput(CrushedLepidolite, 1)
        .withOutput(CrushedPyrochlore, 1)
        .withOutput(CrushedPyrolusite, 1)
        .withOutput(CrushedMagnesite, 1),

    new Recipe("Electrolyzer A", "1.5s")
        .withInput(RareOreResidue, 1000)
        .withOutput(RawOreSlurry, 250)
        .withOutput(ChromiteSludgeDust, 1)
        .withOutput(RareEarthSludgeDust, 1)
        .withOutput(VanadiumMagnetiteSludgeDust, 1)
        .withOutput(CobaltiteSludeDust, 1),

    new Recipe("Electrolyzer B", "12s")
        .withInput(MixedMineralResidue, 1000)
        .withOutput(CrushedBeryllium, 1)
        .withOutput(CrushedZavaritskite, 1)
        .withOutput(SulfuricMineralMixture, 400)
        .withOutput(OxygeneousMineralMixture, 600),
])

console.log(recipes.asLimited().toString())
