// A Stack implementation that only accepts numbers.

export class Stack {
  #stack: number[] = []

  get length() {
    return this.#stack.length
  }

  push(value: number) {
    this.#stack.push(value)
    return this.#stack
  }

  pop() {
    return this.#stack.pop()
  }

  add() {
    this.#stack.push(this.#stack.pop()! + this.#stack.pop()!)
  }

  sub() {
    const b = this.#stack.pop()!
    const a = this.#stack.pop()!

    this.#stack.push(a - b)
  }

  mul() {
    this.#stack.push(this.#stack.pop()! * this.#stack.pop()!)
  }

  div() {
    const b = this.#stack.pop()!
    const a = this.#stack.pop()!

    this.#stack.push(a / b)
  }

  mod() {
    const b = this.#stack.pop()!
    const a = this.#stack.pop()!

    this.#stack.push(a % b)
  }
}
