// A typed setTimeout function and class. #rewrite

export function setTimeout<T extends (...args: any) => any>(
  handler: T,
  timeout?: number,
  ...args: Parameters<T>
): number {
  let timer = globalThis.setTimeout(handler, timeout, ...(args as any))

  if (typeof timer == "number") return timer
  return timer[Symbol.toPrimitive]()
}

export class Timeout<T extends (...args: any) => any> {
  readonly id: number

  constructor(readonly handler: T, timeout: number, ...params: Parameters<T>) {
    this.id = setTimeout(handler, timeout, ...params)
  }

  cancel() {
    clearTimeout(this.id)
  }
}

let t = new Timeout((a: string) => 23, 90, "abc")
