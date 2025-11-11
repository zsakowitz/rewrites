export abstract class Group<T> {
  abstract id(): T
  abstract inv(el: T): T
  abstract mul(lhs: T, rhs: T): T
  abstract write(el: T): string
}
