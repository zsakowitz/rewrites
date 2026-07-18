import { dim, green, red, reset } from "../nyalang2/ansi"

export class Type {
    constructor(
        readonly name: string,
        readonly kind: "item" | "fluid",
    ) {}

    get suffix() {
        return this.kind === "item" ? "" : "s"
    }
}

export type DurationLike = Duration | `${number}s` | `${bigint}t`

export class Duration {
    static from(value: DurationLike) {
        if (value instanceof Duration) {
            return value
        }

        if (value.endsWith("t")) {
            return new Duration(BigInt(value.slice(0, -1)))
        }

        if (value.endsWith("s")) {
            return new Duration(BigInt(Number(value.slice(0, -1)) * 20))
        }

        throw new Error("Invalid duration.")
    }

    constructor(readonly ticks: bigint) {
        if (ticks <= 0n) {
            throw new Error("Duration must be strictly positive.")
        }
    }

    get seconds() {
        return Number(this.ticks) / 20
    }

    toString() {
        return (Number(this.ticks) / 20).toFixed(2) + "s"
    }
}

export class Amount {
    constructor(
        /**
         * Positive values are produced, negative values are consumed.
         *
         * For items, the unit is "number of items". For fluids, the unit is
         * "mB", millibuckets.
         */
        readonly value: number,
    ) {}

    add(rhs: Amount) {
        return new Amount(this.value + rhs.value)
    }

    multiply(count: number | bigint) {
        return new Amount(this.value * Number(count))
    }
}

export class Recipe {
    constructor(
        readonly name: string,
        readonly duration: Duration,
        readonly ingredients: ReadonlyMap<Type, Amount>,
    ) {}

    /** Multiplies the number of ingredients used and produced by this recipe. */
    multiply(count: number) {
        const items = new Map(this.ingredients)
        for (const [k, v] of items) items.set(k, v.multiply(count))

        return new Recipe(
            this.name + ` (${count}x)`,
            this.duration,
            new Map(this.ingredients),
        )
    }

    /**
     * Adds an ingredient to this recipe. If the ingredient is already
     * specified, their values are combined.
     */
    add(item: Type, amount: Amount) {
        const items = new Map(this.ingredients)

        if (this.ingredients.has(item)) {
            items.set(item, this.ingredients.get(item)!.add(amount))
        } else {
            items.set(item, amount)
        }

        return new Recipe(this.name, this.duration, items)
    }

    /** Prints the rates for each ingredient of this recipe. */
    print() {
        let ret = ""

        for (const [item, amount] of this.ingredients) {
            const amountPerSec = amount.value / this.duration.seconds
            if (amountPerSec === 0) {
                ret += `\n    0 ${item.suffix} ${item.name}`
                continue
            }

            ret += `\n    ${amountPerSec > 0 ? green + "+" : red + "-"}${Math.abs(amountPerSec).toFixed(2)}${item.suffix}/s ${item.name}${reset}`
        }

        console.log(`${this.name}${ret || "\n    (no ingredients)"}`)
    }

    rename(name: string) {
        return new Recipe(name, this.duration, this.ingredients)
    }
}

export function recipe(name: string, duration: DurationLike) {
    return new Recipe(name, Duration.from(duration), new Map())
}

function gcd(a: bigint, b: bigint): bigint {
    return b === 0n ? a : gcd(b, a % b)
}

function lcm(a: bigint, b: bigint): bigint {
    return (a * b) / gcd(a, b)
}

export function join(recipes: Recipe[]): Recipe {
    if (recipes.length === 0) {
        throw new Error("Must join at least one recipe.")
    }

    const duration = new Duration(
        recipes.map((x) => x.duration.ticks).reduce(lcm),
    )

    const ingredients: Map<Type, Amount> = new Map()

    for (const recipe of recipes) {
        const multiplier = duration.ticks / recipe.duration.ticks

        for (const [type, amountRaw] of recipe.ingredients) {
            const amount = amountRaw.multiply(multiplier)

            if (ingredients.has(type)) {
                ingredients.set(type, ingredients.get(type)!.add(amount))
            } else {
                ingredients.set(type, amount)
            }
        }
    }

    return new Recipe(
        recipes.map((x) => x.name).join(" && "),
        duration,
        ingredients,
    )
}
