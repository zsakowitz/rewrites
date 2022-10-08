// Separates call and construct signatures of an object using proxies. #proxy

const fnKeys = [
  "apply",
  "arguments",
  "bind",
  "call",
  "caller",
  "length",
  "name",
  "prototype",
  "toString",
] as const;

const fnOwnProps = [
  "arguments",
  "caller",
  "length",
  "name",
  "prototype",
] as const;

function isFnKey(p: unknown): p is string {
  return (fnKeys as any).indexOf(p) !== -1;
}

export function addCallSignature<
  T extends object,
  S extends (this: any, ...args: any[]) => any
>(
  target: T,
  signature: S
): Exclude<
  T,
  ((this: any, ...args: any[]) => any) | (abstract new (...args: any[]) => any)
> &
  S {
  return new Proxy(target, {
    apply(_, thisArg, argArray) {
      return Reflect.apply(signature, thisArg, argArray);
    },
    get(target, p, receiver) {
      if (isFnKey(p)) return Reflect.get(signature, p, receiver);

      return Reflect.get(target, p, receiver);
    },
    defineProperty(target, p, attributes) {
      if (isFnKey(p)) return Reflect.defineProperty(signature, p, attributes);

      return Reflect.defineProperty(target, p, attributes);
    },
    deleteProperty(target, p) {
      if (isFnKey(p)) return Reflect.deleteProperty(signature, p);

      return Reflect.deleteProperty(target, p);
    },
    getOwnPropertyDescriptor(target, p) {
      if (isFnKey(p)) return Reflect.getOwnPropertyDescriptor(signature, p);

      return Reflect.getOwnPropertyDescriptor(target, p);
    },
    has(target, p) {
      if (isFnKey(p)) return Reflect.has(signature, p);

      return Reflect.has(target, p);
    },
    ownKeys(target) {
      const result = Reflect.ownKeys(target);
      result.push(...fnOwnProps);

      return result;
    },
    set(target, p, value, receiver) {
      if (isFnKey(p)) return Reflect.set(signature, p, value, receiver);

      return Reflect.set(target, p, value, receiver);
    },
  }) as any;
}

const d = addCallSignature(
  {
    a: 23,
    b() {
      return 45;
    },
  },
  () => 23
);
