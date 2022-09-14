export type TypeSafeLinkedList<T> =
  | {
      empty: true;
      head: never;
      tail: never;
    }
  | {
      empty: false;
      head: T;
      tail: LinkedList<T>;
    };

export type LinkedListLike<T> = {
  empty: boolean;
  head?: T;
  tail?: LinkedList<T>;
};

export class LinkedList<T> {
  static toIterable<T>(value: LinkedListLike<T>) {
    return LinkedList.prototype[Symbol.iterator].call(value);
  }

  static from<T>(value: LinkedListLike<T>) {
    return LinkedList.of(...LinkedList.toIterable(value));
  }

  static fromIterable<T>(value: Iterable<T>) {
    return LinkedList.of(...value);
  }

  static of<T>(...values: T[]) {
    return new LinkedList<T>().pushAll(...values);
  }

  readonly empty: boolean;
  readonly length: number;

  get data(): TypeSafeLinkedList<T> {
    return this as any;
  }

  constructor();
  constructor(head: T, tail: LinkedList<T>);
  constructor(readonly head?: T, readonly tail?: LinkedList<T>) {
    this.empty = !tail;
    this.length = (tail?.length || 0) + 1;
  }

  at(index: number): T | undefined {
    if (index < 0) {
      index = this.length + index;
    }

    if (index === 0) {
      return this.head;
    } else {
      return this.tail?.at(index - 1);
    }
  }

  filter<U extends T>(
    fn: (head: T, tail: LinkedList<T>) => head is U
  ): LinkedList<U>;
  filter(fn: (head: T, tail: LinkedList<T>) => unknown): LinkedList<T>;
  filter(fn: (head: T, tail: LinkedList<T>) => unknown): LinkedList<T> {
    const { empty, head, tail } = this.data;

    if (empty) {
      return this;
    }

    if (fn(head, tail)) {
      return new LinkedList<T>(head, tail.filter(fn));
    } else {
      return tail.filter(fn);
    }
  }

  forEach(fn: (head: T, tail: LinkedList<T>) => void): void {
    let list = this.data;

    while (!list.empty) {
      fn(list.head, list.tail);
      list = list.tail.data;
    }
  }

  map<U>(fn: (head: T, tail: LinkedList<T>) => U): LinkedList<U> {
    const { empty, head, tail } = this.data;

    if (empty) {
      return new LinkedList<U>();
    }

    return new LinkedList<U>(fn(head, tail), tail.map(fn));
  }

  pop(): LinkedList<T> {
    return this.tail || this;
  }

  push(element: T): LinkedList<T> {
    return new LinkedList<T>(element, this);
  }

  pushAll(...elements: T[]): LinkedList<T> {
    let list: LinkedList<T> = this;

    for (const el of elements.reverse()) {
      list.push(el);
    }

    return list;
  }

  reduce<U>(fn: (value: U, head: T, tail: LinkedList<T>) => U, value: U): U {
    const { empty, head, tail } = this.data;

    if (empty) {
      return value;
    }

    return tail.reduce<U>(fn, fn(value, head, tail));
  }

  reverse(): LinkedList<T> {
    let list: LinkedList<T> = this;
    let result = new LinkedList<T>();

    while (!list.empty) {
      result = new LinkedList<T>(list.head!, result);
      list = list.tail!;
    }

    return result;
  }

  *[Symbol.iterator](this: LinkedListLike<T>): Generator<T> {
    let list = this;

    while (!list.empty) {
      yield list.head!;
      list = list.tail!;
    }
  }

  toArray(): T[] {
    const result: T[] = [];
    let list: LinkedList<T> = this;

    while (!list.empty) {
      result.push(list.head!);
      list = list.tail!;
    }

    return result;
  }
}
