import { Rate, Recipe, RecipeSet, Type } from "."

const Log = new Type("Log", "item")
const Charcoal = new Type("Charcoal", "item")
const CharcoalDust = new Type("Charcoal Dust", "item")

const set = new RecipeSet([
    new Recipe("smelt logs", "10s").withInput(Log, 1).withOutput(Charcoal, 1),

    new Recipe("macerate charcoal", "1s")
        .withInput(Charcoal, 1)
        .withOutput(CharcoalDust, 1),
])

console.log(set.sort())
