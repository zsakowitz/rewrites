// A generic Stack in JavaScript.

export class Stack<T> {
  static empty = new Stack<never>();

  constructor();
  constructor(head: T, tail: Stack<T>);
  constructor(readonly head?: T, readonly tail?: Stack<T>) {
    if (tail == null) {
      this.head = this.tail = undefined;
      this.empty = true;
    } else {
      this.empty = false;
    }
  }

  readonly data:
    | { head: T; tail: Stack<T>; empty: true }
    | { head?: undefined; tail?: undefined; empty: false } = this as any;

  readonly empty: boolean;

  push(head: T): Stack<T> {
    return new Stack(head, this);
  }

  shift(): readonly [T, Stack<T>] | readonly [undefined, Stack<never>] {
    if (this.tail) {
      return [this.head!, this.tail];
    } else {
      return [undefined, Stack.empty];
    }
  }

  map<U>(fn: (value: T) => U): Stack<U> {
    if (this.empty) return Stack.empty;

    return new Stack<U>(fn(this.head!), this.tail!.map(fn));
  }

  filter(fn: (value: T) => unknown): Stack<T> {
    if (this.empty) return Stack.empty;

    if (fn(this.head!)) {
      return new Stack(this.head!, this.tail!.filter(fn));
    } else {
      return this.tail!.filter(fn);
    }
  }

  some(fn: (value: T) => unknown): boolean {
    if (this.empty) return false;
    if (fn(this.head!)) return true;
    return this.tail!.some(fn);
  }

  every(fn: (value: T) => unknown): boolean {
    if (this.empty) return true;
    if (!fn(this.head!)) return false;
    return this.tail!.every(fn);
  }
}
