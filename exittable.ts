// Runs function that can be exited from using an early return mechanism
// powered by exceptions.

class ExitNotice {
  constructor(readonly key: symbol, readonly value: any) {}
}

export function createExittable<T>(fn: (exit: (value: T) => T) => T): T {
  const key = Symbol()

  try {
    return fn((value) => {
      throw new ExitNotice(key, value)
    })
  } catch (error) {
    if (error instanceof ExitNotice && error.key == key) {
      return error.value
    } else {
      throw error
    }
  }
}
