export function logged(value: any, context: DecoratorContext): any {
  const name = String(context.name)
  console.group(`${context.kind} decorator on ${name}`)

  try {
    switch (context.kind) {
      case "class":
        return class Class extends value {
          constructor(...args: any[]) {
            console.group(`constructing ${name}`)

            try {
              super(...args)
            } finally {
              console.groupEnd()
            }
          }
        }

      case "method":
      case "getter":
        if (typeof value == "function") {
          return function (this: any, ...args: any[]) {
            console.group(
              `${
                {
                  method: "calling",
                  getter: "getting",
                  setter: "setting",
                }[context.kind]
              } ${name}`
            )

            try {
              return value.call(this, ...args)
            } finally {
              console.groupEnd()
            }
          }
        } else break

      case "setter":
        if (typeof value == "function") {
          return function (this: any, newValue: any) {
            console.group(`setting ${name} to ${newValue}`)

            try {
              return value.call(this, newValue)
            } finally {
              console.groupEnd()
            }
          }
        } else break

      case "field":
        return (initializedValue: any) => {
          console.log(`initializing field ${name}`)
          return initializedValue
        }

      case "accessor":
        return {
          get() {
            console.group(`getting ${name}`)

            try {
              return value.get.call(this)
            } finally {
              console.groupEnd()
            }
          },
          set(newValue) {
            console.group(`setting ${name} to ${String(newValue)}`)

            try {
              return value.set.call(this, newValue)
            } finally {
              console.groupEnd()
            }
          },
          init(value) {
            console.group(`initializing ${name} to ${String(value)}`)
            console.groupEnd()
            return value
          },
        } satisfies ClassAccessorDecoratorResult<any, any>

      default:
        throw new Error("Unsupported decorator type:" + (context as any).type)
    }
  } finally {
    console.groupEnd()
  }
}
