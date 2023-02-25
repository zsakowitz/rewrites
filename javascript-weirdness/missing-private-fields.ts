// Creates a class object with only one of the private fields it's supposed to have.

class Abc {
  static #createWithAge = false
  static #instance?: Abc

  static create(withAge: boolean) {
    Abc.#createWithAge = withAge

    try {
      return new Abc()
    } catch {
      return Abc.#instance!
    }
  }

  #name = "Zachary"

  _ = ((Abc.#instance = this), void 0)

  #age = Abc.#createWithAge
    ? 48
    : ((): never => {
        throw new Error()
      })()

  private constructor() {}

  hasName() {
    return #name in this
  }

  hasAge() {
    return #age in this
  }

  getName() {
    return this.#name
  }

  getAge() {
    return this.#age
  }

  setName(value: string) {
    this.#name = value
  }

  setAge(value: number) {
    this.#age = value
  }
}

const withoutAge = Abc.create(false)
const withAge = Abc.create(true)

export {}
