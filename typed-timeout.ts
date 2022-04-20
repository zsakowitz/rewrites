export function setTimeout<T extends (...args: any) => any>(
  handler: T,
  timeout?: number,
  ...args: Parameters<T>
): number {
  return globalThis.setTimeout(handler, timeout, ...(args as any));
}

export class Timeout<T extends (...args: any) => any> {
  readonly id: number;

  constructor(readonly handler: T, timeout: number, ...params: Parameters<T>) {
    this.id = setTimeout(handler, timeout, ...params);
  }

  cancel() {
    clearTimeout(this.id);
  }
}

let t = new Timeout((a: string) => 23, 90, "abc");
