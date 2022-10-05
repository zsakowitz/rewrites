// By using == null, we cover null and undefined.

export class Queue<T> {
  static empty = new Queue<never>();

  constructor();
  constructor(head: T, tail: Queue<T>);
  constructor(readonly head?: T, readonly tail?: Queue<T>) {
    if (tail == null) {
      this.head = this.tail = undefined;
      this.empty = true;
    } else {
      this.empty = false;
    }
  }

  readonly data:
    | { head: T; tail: Queue<T>; empty: true }
    | { head?: undefined; tail?: undefined; empty: false } = this as any;

  readonly empty: boolean;

  push(head: T): Queue<T> {
    return new Queue(head, this);
  }

  shift(): readonly [T, Queue<T>] | readonly [undefined, Queue<never>] {
    if (this.tail) {
      return [this.head!, this.tail];
    } else {
      return [undefined, Queue.empty];
    }
  }

  map<U>(fn: (value: T) => U): Queue<U> {
    if (this.empty) return Queue.empty;

    return new Queue<U>(fn(this.head!), this.tail!.map(fn));
  }

  filter(fn: (value: T) => unknown): Queue<T> {
    if (this.empty) return Queue.empty;

    if (fn(this.head!)) {
      return new Queue(this.head!, this.tail!.filter(fn));
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
