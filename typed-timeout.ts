export function setTimeout<T extends (...args: U) => void, U extends any[]>(
  handler: T,
  timeout?: number,
  ...args: U
) {
  globalThis.setTimeout(handler, timeout, ...args);
}
