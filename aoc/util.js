"use strict"

if (typeof process != "undefined") {
  const fs = await import("fs")
  globalThis.input = (x) =>
    fs.readFileSync(new URL("./" + x, import.meta.url).pathname, "utf8")
}

globalThis.check = (actual, expected) => {
  if (actual !== expected) {
    throw new Error(`expected ${expected} but got ${actual}`)
  } else {
    console.log(`everythings fine with ${expected}`)
  }
}

const DID_WARN = new WeakMap()
function warn(name) {
  if (!DID_WARN.get(name)) {
    console.warn(`${name} IS A CRIME AND MAY RESULT IN INCORRECT BEHAVIOR`)
    DID_WARN.set(name, true)
    setTimeout(() => DID_WARN.delete(name))
  }
}

function addWarning(proto, key, sym) {
  const original = proto[key]
  return function () {
    warn(sym)
    return original.apply(this, arguments)
  }
}

Array.prototype.sby = Array.prototype.sort

addWarning(Array.prototype, "sort", Symbol("Array.prototype.sort"))

Array.prototype.sum = function (f = (x) => +x) {
  return this.reduce((a, b) => a + f(b), 0)
}

Array.prototype.prod = function (f = (x) => +x) {
  return this.reduce((a, b) => a * f(b), 1)
}

RegExp.prototype.captures = function (text, f = (x) => x.slice(1)) {
  return text.matchAll(this).map(f).toArray()
}

String.prototype.captures = function (regex, f = (x) => x.slice(1)) {
  return this.matchAll(regex).map(f).toArray()
}

Array.prototype.tx = function () {
  return Array.from(
    { length: this.reduce((a, b) => Math.max(a, b.length), 0) },
    (_, i) => this.map((x) => x[i]),
  )
}

Array.prototype.key = function (key) {
  if (typeof key == "function") {
    return this.map(key)
  } else {
    return this.map((x) => x[key])
  }
}

Array.prototype.num = function () {
  return this.map((x) => x.num())
}

String.prototype.num = function () {
  return +this
}

Number.prototype.num = function () {
  return this
}

BigInt.prototype.num = function () {
  return Number(this)
}

Array.prototype.bigint = function () {
  return this.map((x) => x.bigint())
}

String.prototype.bigint = function () {
  return BigInt(this)
}

Number.prototype.bigint = function () {
  return BigInt(this)
}

BigInt.prototype.bigint = function () {
  return this
}

String.prototype.lines = function () {
  return this.split("\n")
}

Array.prototype.sws = function () {
  return this.map((x) => x.sws())
}

String.prototype.sws = function () {
  return this.split(/\s+/g)
}

Array.prototype.s = function () {
  return this.sby((a, b) => a - b)
}

Number.prototype.ud = function (other) {
  return Math.abs(this - other)
}

Number.prototype.sd = function (other) {
  return this - other
}

Array.prototype.filterByFnRaw = Array.prototype.filter

Array.prototype.filter = function (val) {
  return this.filterByFnRaw(val.fn())
}

Array.prototype.count = function (val) {
  return this.filter(val).length
}

Array.prototype.w = function (size) {
  return Array.from({ length: this.length - size + 1 }, (_, i) =>
    Array.from({ length: size }, (_, j) => this[i + j]),
  )
}

Array.prototype.ud = function () {
  return this.w(2).map(([a, b]) => a.ud(b))
}

Array.prototype.sd = function () {
  return this.w(2).map(([a, b]) => a.sd(b))
}

Array.prototype.abs = function () {
  return this.map((x) => x.abs())
}

Number.prototype.abs = function () {
  return Math.abs(this)
}

Number.prototype.ispos = function () {
  return this > 0
}

Number.prototype.isneg = function () {
  return this < 0
}

Array.prototype.ispos = function () {
  return this.every((x) => x.ispos())
}

Array.prototype.isneg = function () {
  return this.every((x) => x.isneg())
}

const WARN_RANGE_TO_INVERTED = Symbol("passed an inverted range to 'rangeTo'")
globalThis.rangeTo = function (min, max) {
  if (max < min) {
    warn()
  }

  function has(x) {
    return x % 1 === 0 && min <= x && x < max
  }

  return Object.assign(
    (function* () {
      for (let i = min; i < max; i++) {
        yield i
      }
    })(),
    {
      fn: () => has,
      has,
    },
  )
}

globalThis.rx = function (min, max, step) {
  return typeof max == "undefined" ? rangeTo(0, min) : rangeTo(min, max)
}

globalThis.ri = function (min, max, step) {
  return typeof max == "undefined" ? rangeTo(0, min + 1) : rangeTo(min, max + 1)
}

Object.prototype.iter = function () {
  return this[Symbol.iterator]()
}

Array.prototype.everyany = Array.prototype.everyAny = function (...fns) {
  for (const fn of fns) {
    if (this.every(fn)) return true
  }
  return false
}

Array.prototype.everyFn = Array.prototype.every

Array.prototype.every = function (f = (x) => x) {
  return this.everyFn(f.fn())
}

Array.prototype.someFn = Array.prototype.some

Array.prototype.some = function (f = (x) => x) {
  return this.someFn(f.fn())
}

Array.prototype.none = function (f) {
  return !this.some(f)
}

Array.prototype.wo = function (idx) {
  return this.toSpliced(idx, 1)
}

Array.prototype.idxs = Array.prototype.indexes = function (f = (x) => x) {
  return this.map((_value, index, array) => f(index, array))
}

Array.prototype.all = Array.prototype.every
Array.prototype.any = Array.prototype.some

String.prototype.wo = function (wo) {
  return this.replaceAll(wo, "")
}

Iterator.prototype.sum = function (f = (x) => x.num()) {
  return this.reduce((a, b) => a + f(b), 0)
}

Iterator.prototype.prod = function (f = (x) => x.num()) {
  return this.reduce((a, b) => a * f(b), 1)
}

Number.prototype.check = function (expected) {
  check(this, expected)
  return this
}

Function.prototype.fn = function () {
  return this
}

Number.prototype.fn = function () {
  return (x) => x === this
}

String.prototype.fn = function () {
  return (x) => (x instanceof RegExp ? this.test(x) : x === this)
}

RegExp.prototype.fn = function () {
  return (x) => this.test(x)
}

Object.prototype.log = function () {
  console.log(this)
  return this
}
