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

function warn(name, f) {
  let didWarn = false
  return function () {
    if (!didWarn) {
      console.warn(`using ${name} is BAD BAD BAD BAD DIE SAKAWI BAIIIII`)
      setTimeout(() => (didWarn = false))
    }
    return f.apply(this, arguments)
  }
}

globalThis.fnify = function (x) {
  if (Symbol.fnify in x) {
    return x[Symbol.fnify]()
  }

  if (typeof x == "function") {
    return x
  }

  if (x instanceof RegExp) {
    return (text) => x.test(text)
  }

  return (y) => x === y
}

Symbol.fnify ??= Symbol("fnify")

Array.prototype.sby = Array.prototype.sort

Array.prototype.sort = warn("Array.prototype.sort", Array.prototype.sort)

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

Array.prototype.is = function (val) {
  return this.filter(fnify(val))
}

Array.prototype.count = function (val) {
  return this.is(val).length
}

Array.prototype.w = function (size) {
  return Array.from({ length: this.length - size }, (_, i) =>
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

globalThis.rangeTo = function (min, max) {
  return Object.assign(
    (function* () {
      for (let i = min; i < max; i++) {
        yield i
      }
    })(),
    {
      [Symbol.fnify]() {
        return function (x) {
          return x % 1 === 0 && min <= x && x < max
        }
      },
      has(x) {
        return x % 1 === 0 && min <= x && x < max
      },
    },
  )
}

globalThis.rx = function (min, max) {
  return typeof max == "undefined" ? rangeTo(0, min) : rangeTo(min, max)
}

globalThis.ri = function (min, max) {
  return typeof max == "undefined" ? rangeTo(0, min + 1) : rangeTo(min, max + 1)
}

Object.prototype.iter = function () {
  return this[Symbol.iterator]()
}

Array.prototype.everyany = Array.prototype.everyAny = function (...fns) {
  return fns.reduce((a, fn) => a || this.every(fn), false)
}

Array.prototype.everyFn = Array.prototype.every

Array.prototype.every = function (f = (x) => x) {
  return this.everyFn(fnify(f))
}

Array.prototype.someFn = Array.prototype.some

Array.prototype.some = function (f = (x) => x) {
  return this.someFn(fnify(f))
}

Array.prototype.none = function (f) {
  return !this.some(f)
}

Array.prototype.wo = function (idx) {
  return this.toSpliced(idx, 1)
}

Array.prototype.idxs = Array.prototype.indexes = function (f) {
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
