export class Stack {
  #stack: number[] = [];

  get length() {
    return this.#stack.length;
  }

  push(value: number) {
    this.#stack.push(value);
  }

  pop() {
    return this.#stack.pop();
  }

  add() {
    this.#stack.push(this.#stack.pop()! + this.#stack.pop()!);
  }
}
