// A Map implementation that stores its values as symbols. #rewrite #symbol

export class zMap<K, V> implements Map<K, V> {
  private static readonly key: unique symbol = Symbol("zMap.key");

  static getKeyOf(object: any): symbol {
    if (typeof object == "number") return Symbol.for(`number-${object}`);
    if (typeof object == "string") return Symbol.for(`string-${object}`);
    if (typeof object == "boolean") return Symbol.for(`boolean-${object}`);
    if (typeof object == "bigint") return Symbol.for(`bigint-${object}`);
    if (typeof object == "undefined") return Symbol.for("undefined");
    if (object === null) return Symbol.for("null");
    if (typeof object == "symbol") return object;

    let key: symbol = object[zMap.key];
    if (typeof key == "symbol") return key;

    key = object[zMap.key] = Symbol("zMap.key");
    return key;
  }

  private k: Record<symbol, K> = Object.create(null);
  private v: Record<symbol, V> = Object.create(null);

  get(key: K): V | undefined {
    return this.v[zMap.getKeyOf(key)];
  }

  set(key: K, value: V): this {
    this.v[zMap.getKeyOf(key)] = value;
    return this;
  }

  delete(key: K): boolean {
    delete this.k[zMap.getKeyOf(key)];
    return delete this.v[zMap.getKeyOf(key)];
  }

  has(key: K): boolean {
    return zMap.getKeyOf(key) in this.v;
  }

  clear(): void {
    this.v = Object.create(null);
  }

  entries(): IterableIterator<[K, V]> {
    let symbols = Object.getOwnPropertySymbols(this.k);

    return symbols
      .map<[K, V]>((symbol) => [this.k[symbol], this.v[symbol]])
      .values();
  }

  keys(): IterableIterator<K> {
    let symbols = Object.getOwnPropertySymbols(this.k);

    return symbols.map<K>((symbol) => this.k[symbol]).values();
  }

  values(): IterableIterator<V> {
    let symbols = Object.getOwnPropertySymbols(this.k);

    return symbols.map<V>((symbol) => this.v[symbol]).values();
  }

  forEach(
    callbackfn: (value: V, key: K, map: Map<K, V>) => void,
    thisArg?: any
  ): void {
    let symbols = Object.getOwnPropertySymbols(this.k);

    symbols.forEach((symbol) => {
      callbackfn.call(thisArg, this.v[symbol], this.k[symbol], this);
    });
  }

  get size() {
    return Object.getOwnPropertySymbols(this.k).length;
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.entries();
  }

  [Symbol.toStringTag] = "zMap";
}
