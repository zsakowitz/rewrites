// Declares modules without @types/... declarations.

declare module "es-observable-tests"

declare module "promises-aplus-tests" {
  export type PromisesAPlusTestable = {
    deferred(): PromiseLike<any>
    resolve?<T>(value: T): PromiseLike<T>
    reject?(reason?: any): PromiseLike<any>
  }

  const tests: (
    deferred: PromisesAPlusTestable,
    error: typeof console.error
  ) => unknown

  export default tests
}
