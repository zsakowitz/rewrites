// Declares modules without @types/... declarations.

declare module "es-observable-tests" {
  export const runTests: any
}

declare module "promises-aplus-tests" {
  export type PromisesAPlusTestable = {
    pending(): PromiseLike<any>
    resolve?<T>(value: T): PromiseLike<T>
    reject?(reason?: any): PromiseLike<any>
  }

  const tests: (deferred: PromisesAPlusTestable) => unknown

  export default tests
}
