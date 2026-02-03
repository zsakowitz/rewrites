export type Degree = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export type Value = {
    readonly degree: Degree
    readonly description: string
    readonly extendedDescription?: string
}

export type Affix = {
    readonly name: string
    readonly letter: string
    readonly notes?: string
    readonly values: readonly [
        Value,
        Value,
        Value,
        Value,
        Value,
        Value,
        Value,
        Value,
        Value,
    ]
}
