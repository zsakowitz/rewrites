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

export type WithCallSignature<
  T extends object,
  S extends (this: any, ...args: any[]) => any
> = {
  [K in keyof T as ((this: any, ...args: any[]) => any) extends T[K]
    ? never
    : K]: T[K];
} & S;

export function addCallSignature<
  T extends object,
  S extends (this: any, ...args: any[]) => any
>(
  target: T,
  signature: S,
  addCallApplyBind: boolean | (keyof CallableFunction)[] = true
): {
  [K in keyof T as ((this: any, ...args: any[]) => any) extends T[K]
    ? never
    : K]: T[K];
} & Omit<S, "bind"> {
  if (addCallApplyBind) {
    if (Array.isArray(addCallApplyBind)) {
      addCallApplyBind = [...addCallApplyBind];
    }

    const isFnKey = (p: string) =>
      (fnKeys as any).indexOf(p) !== -1 &&
      (addCallApplyBind === true || (addCallApplyBind as any).indexOf?.(p));

    return new Proxy(target, {
      apply(_, thisArg, argArray) {
        return Reflect.apply(signature, thisArg, argArray);
      },
      get(target, p, receiver) {
        if (typeof p === "string" && isFnKey(p)) {
          return Reflect.get(signature, p, receiver);
        }

        return Reflect.get(target, p, receiver);
      },
      defineProperty(target, p, attributes) {
        if (typeof p === "string" && isFnKey(p)) {
          return Reflect.defineProperty(signature, p, attributes);
        }

        return Reflect.defineProperty(target, p, attributes);
      },
      deleteProperty(target, p) {
        if (typeof p === "string" && isFnKey(p)) {
          return Reflect.deleteProperty(signature, p);
        }

        return Reflect.deleteProperty(target, p);
      },
      getOwnPropertyDescriptor(target, p) {
        if (typeof p === "string" && isFnKey(p)) {
          return Reflect.getOwnPropertyDescriptor(signature, p);
        }

        return Reflect.getOwnPropertyDescriptor(target, p);
      },
      has(target, p) {
        if (typeof p === "string" && isFnKey(p)) {
          return Reflect.has(signature, p);
        }

        return Reflect.has(target, p);
      },
      ownKeys(target) {
        const result = Reflect.ownKeys(target);

        if (isFnKey("arguments")) result.push("arguments");
        if (isFnKey("caller")) result.push("caller");
        if (isFnKey("length")) result.push("length");
        if (isFnKey("name")) result.push("name");
        if (isFnKey("prototype")) result.push("prototype");

        return result;
      },
      set(target, p, value, receiver) {
        if (typeof p === "string" && isFnKey(p)) {
          return Reflect.set(signature, p, value, receiver);
        }

        return Reflect.set(target, p, value, receiver);
      },
    }) as any;
  } else {
    return new Proxy(target, {
      apply(_, thisArg, argArray) {
        return Reflect.apply(signature, thisArg, argArray);
      },
    }) as any;
  }
}

const d = addCallSignature({ a: 23 }, () => 23);

() => void 0;
