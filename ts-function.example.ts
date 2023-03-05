// #::exclude

import { Call, Function, createFunction } from "./ts-function"

const numberToString = createFunction(
  class extends Function<number> {
    x(input: this["input"]) {
      return `${input}` as const
    }
  }
)

const valueResult: "23" = numberToString(23)

type typeResult = Call<typeof numberToString, 23>
//   ^?    23
