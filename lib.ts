declare global {
    interface ArrayShared<T> {
        minBy(score: (value: T, index: number, array: this) => number): T
        maxBy(score: (value: T, index: number, array: this) => number): T
        mapc<const U extends readonly unknown[] | unknown>(
            f: (value: T, index: number, array: this) => U,
        ): U[]
        sumsq(this: readonly number[]): number
        sortBy(key: (value: T) => number): T[]
    }

    interface ReadonlyArray<T> extends ArrayShared<T> {}
    interface Array<T> extends ArrayShared<T> {}

    interface MapShared<K, V> {
        reduce<T>(f: (previous: T, value: V, key: K) => T, initial: T): T
        k(): K[]
        v(): V[]
    }

    interface ReadonlyMap<K, V> extends MapShared<K, V> {}
    interface Map<K, V> extends MapShared<K, V> {}
}

Array.prototype.minBy = function (score) {
    return this.map((el) => [el, score]).reduce((a, b) =>
        a[1] < b[1] ? a : b,
    )[0]
}

Array.prototype.maxBy = function (score) {
    return this.map((el) => [el, score]).reduce((a, b) =>
        a[1] > b[1] ? a : b,
    )[0]
}

Array.prototype.mapc = Array.prototype.map

Array.prototype.sumsq = function () {
    return this.reduce((a, b) => a + b * b, 0)
}

Array.prototype.sortBy = function (f) {
    return this.map((k) => [k, f(k)])
        .sort((a, b) => a[1] - b[1])
        .map((x) => x[0])
}

Map.prototype.k = function () {
    return Array.from(this.keys())
}

Map.prototype.v = function () {
    return Array.from(this.values())
}

Map.prototype.reduce = function (f, initial) {
    for (const [k, v] of this) {
        initial = f(initial, k, v)
    }
    return initial
}
