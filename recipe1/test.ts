import { Amount, join, recipe, Type } from "."

const DarkOakLog = new Type("Dark Oak Log", "item")
const Charcoal = new Type("Charcoal", "item")
const CharcoalDust = new Type("Charcoal Dust", "item")

const smeltLog = recipe("Furnace", "10s")
    .add(DarkOakLog, new Amount(-1))
    .add(Charcoal, new Amount(1))

smeltLog.print()

const macerateCharcoal = recipe("Macerator", "1s")
    .add(Charcoal, new Amount(-1))
    .add(CharcoalDust, new Amount(1))

macerateCharcoal.print()

join([smeltLog, macerateCharcoal]).print()
