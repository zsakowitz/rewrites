// Experiments with ECMAScript decorators, as they are now stage 3!

function log<P, T extends readonly any[], R>(
  originalMethod: (this: P, ...args: T) => R,
  context: ClassMethodDecoratorContext
) {
  return function (this: P, ...args: T) {
    console.log("LOG: Entering method.")

    const result = originalMethod.call(this, ...args)

    if (result instanceof Promise) {
      return result.finally(() => console.log("LOG: Exiting method."))
    }

    console.log("LOG: Exiting method.")
    return result
  }
}

function bound<This>(_: unknown, context: ClassMethodDecoratorContext<This>) {
  console.log(context.name)
  // const methodName = context.name

  // context.addInitializer(function () {
  //   this[methodName] = this[methodName].bind(this)
  // })
}

class Person {
  @log
  abc() {}
}

const person = new Person()

export {}
