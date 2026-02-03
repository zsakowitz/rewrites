// Another validator. This one doesn't really support anything.

export type Transformer<I, O> = (value: I) => O

export class Validator<T = unknown> {
    #transformers: readonly Transformer<any, any>[] = []

    parse(value: unknown): T {
        let output: any = value

        for (const transformer of this.#transformers) {
            output = transformer(output)
        }

        return output
    }

    parseSafe(value: unknown) {
        try {
            return { ok: true, value: this.parse(value) } as const
        } catch (reason) {
            return { ok: false, reason } as const
        }
    }

    map<U>(mapFn: Transformer<T, U>): Validator<U> {
        const next = new Validator<U>()
        next.#transformers = this.#transformers.concat(mapFn)
        return next
    }

    refine(
        refiner: (value: T) => unknown,
        reason = "Refinement failed.",
    ): Validator<T> {
        return this.map((value) => {
            if (!refiner(value)) {
                throw new TypeError(reason, { cause: value })
            }

            return value
        })
    }
}
