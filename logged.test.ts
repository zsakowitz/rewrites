// A test file for the @logged decorator.

import { logged } from "./logged"

@logged
export class Person {
  @logged
  field = ""

  @logged
  accessor accessor = ""

  @logged
  method() {}

  @logged
  get getter() {
    return undefined
  }

  @logged
  set setter(value: unknown) {}
}
