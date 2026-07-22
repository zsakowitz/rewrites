// Everything here is designed for long term processing; recipes are treated as
// continuous, subdivadable objects.
//
// For instance, if one recipe is `20/s log -> 5/s charcoal`, and another recipe
// is `10/s charcoal -> 2/s diamond`, the output will calculate as `1/s diamond`,
// and will not reflect that the diamonds appear more accurately at a rate of
// two every two seconds.
//
// Second, all recipes are treated as having proportional output to input. There
// is no concept of "output increases quadratically with input", since that
// isn't relevant.

import { blue, cyan, dim, reset, yellow } from "../nyalang2/ansi"

export class Type {
    readonly name: string

    constructor(
        name: string,
        readonly type: "item" | "fluid",
    ) {
        this.name = name.replace(/(?<!^)[A-Z]/g, (x) => " " + x).toLowerCase()
    }

    toString() {
        return (this.type == "item" ? "" : blue) + this.name + reset
    }
}

export const ITEM: Record<string, Type> = new Proxy(
    {},
    {
        get(_target, p, _receiver) {
            return new Type(String(p), "item")
        },
    },
)

export const FLUID: Record<string, Type> = new Proxy(
    {},
    {
        get(_target, p, _receiver) {
            return new Type(String(p), "fluid")
        },
    },
)

export class Rate {
    constructor(
        /** In units of `items/s` or `mB/s`, depending on type. */
        readonly value: number,
    ) {}
}

export type DurationLike = `${number}s` | `${bigint}t` | Duration

export class Duration {
    static from(value: DurationLike): Duration {
        if (value instanceof Duration) {
            return value
        }

        if (value.endsWith("t")) {
            return new Duration(+value.slice(0, -1))
        }

        if (value.endsWith("s")) {
            return new Duration(+value.slice(0, -1) * 20)
        }

        throw new Error("Invalid duration-like value.")
    }

    constructor(readonly ticks: number) {}
}

export class Recipe {
    duration: Duration

    constructor(
        public name: string,
        duration: DurationLike,
        readonly input = new Map<Type, Rate>(),
        readonly output = new Map<Type, Rate>(),
    ) {
        this.duration = Duration.from(duration)

        for (const v of input.values()) {
            if (!(v.value >= 0)) {
                throw new Error(`Inputs for "${name}" must be nonnegative.`)
            }
        }

        for (const v of output.values()) {
            if (!(v.value >= 0)) {
                throw new Error(`Outputs for "${name}" must be nonnegative.`)
            }
        }
    }

    withInputRate(type: Type, rate: Rate): this {
        if (this.input.has(type)) {
            throw new Error("Duplicate input specified.")
        }

        this.input.set(type, rate)

        return this
    }

    withInput(type: Type, amountPerDuration: number): this {
        return this.withInputRate(
            type,
            new Rate((20 * amountPerDuration) / this.duration.ticks),
        )
    }

    withOutputRate(type: Type, rate: Rate): this {
        if (this.output.has(type)) {
            throw new Error("Duplicate output specified.")
        }

        this.output.set(type, rate)

        return this
    }

    withOutput(type: Type, amountPerDuration: number): this {
        return this.withOutputRate(
            type,
            new Rate((20 * amountPerDuration) / this.duration.ticks),
        )
    }

    multiply(multiplier: number): Recipe {
        const name =
            this.name + (multiplier === 1.0 ? "" : " x" + round(multiplier))

        const duration = new Duration(this.duration.ticks / multiplier)
        const input = new Map<Type, Rate>()
        const output = new Map<Type, Rate>()

        for (const [k, v] of this.input) {
            input.set(k, new Rate(v.value * multiplier))
        }

        for (const [k, v] of this.output) {
            output.set(k, new Rate(v.value * multiplier))
        }

        return new Recipe(name, duration, input, output)
    }

    toString() {
        const input = Array.from(this.input)
            .map(
                ([type, amount]) =>
                    `${yellow}${round(amount.value)}${reset} ${type.name}`,
            )
            .join(dim + ", " + reset)

        const output = Array.from(this.output)
            .map(
                ([type, amount]) =>
                    `${yellow}${round(amount.value)}${reset} ${type.name}`,
            )
            .join(dim + ", " + reset)

        return `${cyan}[${this.name}]${reset} ${input || "∅"} ${dim}->${reset} ${output || "∅"}`
    }
}

function round(value: number) {
    if (value === 1 / 0) {
        return `∞`
    }

    const p = value.toPrecision(2)

    if (/^\d\.\de\+\d+$/.test(p)) {
        return p.charAt(0) + p.charAt(2) + "0".repeat(+p.slice(5) - 1)
    }

    return p
}

export function createSource(type: Type, rate: Rate) {
    return new Recipe(
        `Limitless source: ${type.name}`,
        new Duration(0),
    ).withOutputRate(type, rate)
}

export class RecipeSet {
    constructor(readonly recipes: readonly Recipe[]) {
        if (new Set(recipes).size !== recipes.length) {
            throw new Error(
                "Recipe array passed to RecipeSet must not contain duplicates. Use `Recipe.multiply` to multiply recipe rates.",
            )
        }

        this.recipes = this.sort()
    }

    private byInput(): Map<Type, Recipe[]> {
        const ret = new Map<Type, Recipe[]>()

        for (const el of this.recipes) {
            for (const input of el.input.keys()) {
                ret.getOrInsert(input, []).push(el)
            }
        }

        return ret
    }

    /**
     * Sorts recipes topologically.
     *
     * The first returned recipe requires no inputs, the second recipe requires
     * only items produced by the first recipe, the third requires inputs
     * created by the previous two, and so on.
     *
     * Throws if loops are detected.
     */
    private sort(): Recipe[] {
        //! https://en.wikipedia.org/wiki/Topological_sorting#:~:text=Depth%2Dfirst%20searchedit

        const byInput = this.byInput()

        const ret: Recipe[] = []
        const unvisited = new Set<Recipe>(this.recipes)
        const currentlyVisiting = new Set<Recipe>()

        while (unvisited.size) {
            visit(unvisited.values().next().value!)
        }

        function visit(recipe: Recipe) {
            if (currentlyVisiting.has(recipe)) {
                throw new Error(`Loop detected at "${recipe.name}".`)
            }

            if (!unvisited.has(recipe)) {
                return
            }

            unvisited.delete(recipe)
            currentlyVisiting.add(recipe)

            for (const output of recipe.output.keys()) {
                for (const recipient of byInput.get(output) ?? []) {
                    visit(recipient)
                }
            }

            currentlyVisiting.delete(recipe)
            ret.push(recipe)
        }

        ret.reverse()

        return ret
    }

    toString() {
        return this.recipes.join("\n")
    }

    calculate(): {
        rates: Map<Type, number>
        set: RecipeSet
    } {
        const recipes: Recipe[] = []

        // Output rates so far. `number` is `Rate.value`.
        const rates = new Map<Type, number>()

        for (const recipe of this.recipes) {
            // The percentage speed at which this recipe can run
            let efficiency = 1.0

            // Find the limiting input
            for (const [input, expectedRate] of recipe.input) {
                const actualRate = rates.get(input) ?? 0
                efficiency = Math.min(
                    efficiency,
                    actualRate / expectedRate.value,
                )
            }

            // Adjust current input rates
            for (const [input, expectedRate] of recipe.input) {
                rates.set(
                    input,
                    (rates.get(input) ?? 0) - efficiency * expectedRate.value,
                )
            }

            // Adjust current output rates
            for (const [output, expectedRate] of recipe.output) {
                rates.set(
                    output,
                    (rates.get(output) ?? 0) + efficiency * expectedRate.value,
                )
            }

            recipes.push(recipe.multiply(efficiency))
        }

        return { rates, set: new RecipeSet(recipes) }
    }

    printExcess() {
        const { rates } = this.calculate()

        const entries = Array.from(rates)
            .sort(
                ([a, av], [b, bv]) =>
                    a.type.localeCompare(b.type)
                    || av - bv
                    || a.name.localeCompare(b.name),
            )
            .filter((x) => x[1] >= 0.001)

        const maxTypeLength = entries.reduce(
            (a, b) => Math.max(a, b[0].name.length),
            0,
        )

        console.log(
            entries
                .map(
                    ([k, v]) =>
                        `${k}${" ".repeat(maxTypeLength - k.name.length)}    ${round(v)}`,
                )
                .join("\n"),
        )
    }
}
