// Tests for parser-5.

// @ts-nocheck

// reinstall jest for this script to work properly

import { isDeepStrictEqual } from "util"
import * as Z from "./parser-5"
import { expect } from "@jest/globals"

// #region toBeOk, toBeErrored, toBeOkWith, toBeAt
expect.extend({
  toBeOk: function (actual: unknown) {
    if (
      typeof actual != "object" ||
      actual == null ||
      !("index" in actual) ||
      typeof actual.index != "number" ||
      !("source" in actual) ||
      typeof actual.source != "string" ||
      !("ok" in actual) ||
      typeof actual.ok != "boolean" ||
      !("value" in actual)
    ) {
      throw new Error("The passed state must be a State!")
    }

    if (actual.ok) {
      return {
        message: () =>
          `expected State.Ok(${this.utils.printReceived(
            actual.value
          )}) to be errored`,
        pass: true,
      }
    } else {
      return {
        message: () =>
          `expected State.Error(${this.utils.printReceived(
            actual.value
          )}) to be ok`,
        pass: false,
      }
    }
  },
  toBeErrored: function (actual: unknown) {
    if (
      typeof actual != "object" ||
      actual == null ||
      !("index" in actual) ||
      typeof actual.index != "number" ||
      !("source" in actual) ||
      typeof actual.source != "string" ||
      !("ok" in actual) ||
      typeof actual.ok != "boolean" ||
      !("value" in actual)
    ) {
      throw new Error("The passed state must be a State!")
    }

    if (actual.ok) {
      return {
        message: () =>
          `expected State.Ok(${this.utils.printReceived(
            actual.value
          )}) to be errored`,
        pass: false,
      }
    } else {
      return {
        message: () =>
          `expected State.Error(${this.utils.printReceived(
            actual.value
          )}) to be ok`,
        pass: true,
      }
    }
  },
  toBeOkWith: function (actual: unknown, value: unknown) {
    if (
      typeof actual != "object" ||
      actual == null ||
      !("index" in actual) ||
      typeof actual.index != "number" ||
      !("source" in actual) ||
      typeof actual.source != "string" ||
      !("ok" in actual) ||
      typeof actual.ok != "boolean" ||
      !("value" in actual)
    ) {
      throw new Error("The passed state must be a State!")
    }

    if (actual.ok && isDeepStrictEqual(actual.value, value)) {
      return {
        message: () =>
          `expected State.Ok(${this.utils.printReceived(
            actual.value
          )}) to be errored or have a value other than ${this.utils.printExpected(
            value
          )}`,
        pass: true,
      }
    } else {
      return {
        message: () =>
          `expected State.Error(${this.utils.printReceived(
            actual.value
          )}) to be State.Ok(${this.utils.printExpected(value)})`,
        pass: false,
      }
    }
  },
  toBeAt: function (actual: unknown, index: unknown) {
    if (
      typeof actual != "object" ||
      actual == null ||
      !("index" in actual) ||
      typeof actual.index != "number" ||
      !("source" in actual) ||
      typeof actual.source != "string" ||
      !("ok" in actual) ||
      typeof actual.ok != "boolean" ||
      !("value" in actual)
    ) {
      throw new Error("The passed state must be a State!")
    }

    if (typeof index != "number") {
      throw new Error("The passed index must be a number!")
    }

    if (actual.ok && actual.index == index) {
      return {
        message: () =>
          `expected State.${
            actual.ok ? "Ok" : "Error"
          }(#${this.utils.printReceived(
            actual.index
          )}) to have an index other than #${this.utils.printExpected(
            actual.index
          )}`,
        pass: true,
      }
    } else {
      return {
        message: () =>
          `expected State.${
            actual.ok ? "Ok" : "Error"
          }(#${this.utils.printReceived(
            actual.index
          )}) to have an index of #${this.utils.printExpected(actual.index)}`,
        pass: false,
      }
    }
  },
})

declare module "expect" {
  interface AsymmetricMatchers {
    toBeOk(): void
    toBeErrored(): void
    toBeOkWith(value: unknown): void
    toBeAt(index: number): void
  }

  interface Matchers<R> {
    toBeOk(): R
    toBeErrored(): R
    toBeOkWith(value: unknown): R
    toBeAt(index: number): R
  }
}
// #endregion

describe("Z.initial", () => {
  test("creates an Ok state", () => {
    expect(Z.initial("")).toBeOk()
    expect(Z.initial("Hello world!")).toBeOk()
  })

  test("with no value", () => {
    expect(Z.initial("")).toBeOkWith(undefined)
    expect(Z.initial("Hello world!")).toBeOkWith(undefined)
  })

  test("at index 0", () => {
    expect(Z.initial("")).toBeAt(0)
    expect(Z.initial("Hello world!")).toBeAt(0)
  })
})

describe("Z.char", () => {
  describe("matches any character", () => {
    test("successfully", () => {
      expect(Z.char().parse("coding")).toBeOk()
      expect(Z.char().parse("Hello world!")).toBeOk()
    })

    test("with the character as its value", () => {
      expect(Z.char().parse("coding")).toBeOkWith("c")
      expect(Z.char().parse("Hello world!")).toBeOkWith("H")
    })

    test("at index 1", () => {
      expect(Z.char().parse("coding")).toBeAt(1)
      expect(Z.char().parse("Hello world!")).toBeAt(1)
    })
  })

  test("fails on empty strings", () => {
    expect(Z.char().parse("")).toBeErrored()
  })
})

describe("Z.text", () => {
  describe("matches the specified text", () => {
    test("successfully", () => {
      expect(Z.text("cod").parse("coding")).toBeOk()
      expect(Z.text("Hello").parse("Hello world!")).toBeOk()
    })

    test("with the text as its value", () => {
      expect(Z.text("cod").parse("coding")).toBeOkWith("cod")
      expect(Z.text("Hello").parse("Hello world!")).toBeOkWith("Hello")
    })

    test("case sensitively", () => {
      expect(Z.text("cod").parse("Coding")).toBeErrored()
      expect(Z.text("Hello").parse("hello world!")).toBeErrored()
    })

    test("at the beginning", () => {
      expect(Z.text("cod").parse("I like coding")).toBeErrored()
      expect(Z.text("hello").parse("I shall say, hello world!")).toBeErrored()
    })
  })

  test("fails on empty strings", () => {
    expect(Z.char().parse("")).toBeErrored()
  })
})
