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
    console.warn(`UNSAFE: ${name.toString().slice(7, -1)}`)
    DID_WARN.set(name, true)
    setTimeout(() => DID_WARN.delete(name))
  }
}

function addWarning(proto, key, sym, filter = () => true) {
  const original = proto[key]
  return function () {
    if (filter.apply(this, arguments)) {
      warn(sym)
    }
    return original.apply(this, arguments)
  }
}

Array.prototype.sby = Array.prototype.sort

addWarning(
  Array.prototype,
  "sort",
  Symbol("[...].sort without explicit sorting function"),
)
addWarning(
  Array.prototype,
  "join",
  Symbol("[...].join without explicit joiner specified; defaulting to comma"),
  function () {
    return arguments.length == 0
  },
)
addWarning(
  String.prototype,
  "split",
  Symbol("'...'.split without explicit splitter specified"),
  function () {
    return arguments.length == 0
  },
)

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

function defineNum(name, fromString, conv = (x) => Number(x)) {
  Array.prototype[name] = function () {
    return this.map((x) => x[name]())
  }

  Iterator.prototype[name] = function () {
    return this.map((x) => x[name]())
  }

  Number.prototype[name] = function () {
    return conv(this)
  }

  BigInt.prototype[name] = function () {
    return conv(this)
  }

  String.prototype[name] = function () {
    return this.match(fromString)?.map(conv) || []
  }

  const regexp = function (text) {
    return this.matchAll(text).map((x) => x[name]())
  }

  Object.defineProperty(RegExp.prototype, name, {
    configurable: true,
    get() {
      return regexp.bind(this)
    },
  })
}

defineNum("num", /^.*$/)
defineNum("bigint", /^.*$/, BigInt)

defineNum("nums", /-?\d+(?:\.\d+)?/g)
defineNum("ints", /-?\d+/g)
defineNum("uints", /\d+/g)
defineNum("digits", /\d/g)
const symdigitnames = Symbol(
  "digitnames does not give the same order forwards and backwards; `23twone` is parsed as `232`, not `231`. be aware",
)
defineNum(
  "digitnames",
  /\d|one|two|three|four|five|six|seven|eight|nine/g,
  (x) => {
    warn(symdigitnames)
    return [
      null,
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
    ]
      .indexOf(x)
      .m1(() => Number(x))
  },
)
defineNum(
  "digitnamesrev",
  /\d|one|two|three|four|five|six|seven|eight|nine/g,
  (x) =>
    [
      null,
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
    ]
      .indexOf(x)
      .m1(() => Number(x)),
)

String.prototype.digitnamesrev = function () {
  return (
    this.reverse().match(/\d|enin|thgie|neves|xis|evif|ruof|eerht|owt|eno/g) ||
    []
  ).map((x) => x.reverse())
}

String.prototype.reverse = function () {
  return this.chars().reverse().join("")
}

String.prototype.digit = function () {
  return [
    Symbol(),
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
  ]
    .indexOf(this)
    .m1(() => Number(this))
}

Number.prototype.m1 = function (f) {
  if (this == -1) {
    return f()
  } else {
    return this
  }
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

Iterator.prototype.sum = function (f = (x) => +x) {
  return this.reduce((a, b) => a + f(b), 0)
}

Iterator.prototype.prod = function (f = (x) => +x) {
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

Object.prototype.log = function (...args) {
  console.log(this, ...args)
  return this
}

Number.prototype.max = function (...args) {
  return Math.max(this, ...args)
}

Number.prototype.min = function (...args) {
  return Math.min(this, ...args)
}

const CLAMP_WARN = Symbol("using .clamp() with max<min")
Number.prototype.clamp = function (min, max) {
  if (max < min) {
    warn(CLAMP_WARN)
  }
  if (this < min) return min
  if (this > max) return max
  return this
}

Number.prototype.floor = function () {
  return Math.floor(this)
}

Number.prototype.ceil = function () {
  return Math.ceil(this)
}

Number.prototype.abs = function () {
  return Math.abs(this)
}

String.prototype.count = function (arg) {
  if (typeof arg == "string") {
    return (this.length - this.replaceAll(arg, "").length) / arg.length
  }
}

String.prototype.chars = function () {
  return this.split("")
}

Number.prototype.sub = function (b) {
  return this - b
}

Object.prototype.do = function (f) {
  return f(this)
}

globalThis.kbr = (f) => {
  class Break {
    v
  }

  const lastBr = globalThis.br
  try {
    globalThis.br = function (v) {
      const br = new Break()
      br.v = v
      throw br
    }
    return f()
  } catch (error) {
    if (error instanceof Break) {
      return error.v
    } else {
      throw error
    }
  } finally {
    globalThis.br = lastBr
  }
}

Array.prototype.reduceRaw = Array.prototype.reduce
Array.prototype.reduceRightRaw = Array.prototype.reduceRight

Array.prototype.reduce = function (f, acc) {
  return kbr(() =>
    arguments.length == 1 ? this.reduceRaw(f) : this.reduceRaw(f, acc),
  )
}

Array.prototype.reduceRight = function (f, acc) {
  return kbr(() =>
    arguments.length == 1
      ? this.reduceRightRaw(f)
      : this.reduceRightRaw(f, acc),
  )
}

globalThis.PointRaw = class Point {
  x
  y
  z

  constructor(x, y, z) {
    this.x = x
    this.y = y
    this.z = z
  }

  fn() {
    return (x) => this.eq(x)
  }

  eq(other) {
    return (
      this.x === other.x &&
      this.y === other.y &&
      (this.z === undefined || this.z === other.z)
    )
  }

  /** Index in a grid like
   *
   * ```
   * 1 3 6 10
   * 2 5 9
   * 4 8
   * 7
   * ```
   */
  idxbrbrbr() {
    return ((this.y + this.x - 1) * (this.y + this.x - 2)) / 2 + this.x
  }
}

globalThis.pt =
  globalThis.Pt =
  globalThis.point =
  globalThis.Point =
    function (x, y, z) {
      return new PointRaw(x, y, z)
    }

pt.prototype = PointRaw.prototype

Object.defineProperty(Array.prototype, "last", {
  configurable: true,
  get() {
    return this[this.length - 1]
  },
  set(v) {
    this[this.length - 1] = v
  },
})

const warngcd = Symbol("calling 'gcd' with zero arguments returns NaN")
globalThis.gcd = function (a, b, ...rest) {
  if (arguments.length == 0) {
    warn(warngcd)
    return NaN
  }
  if (arguments.length == 1) return a
  if (rest.length) return gcd(gcd(a, b), ...rest)
  while (b != 0) [a, b] = [b, a % b]
  return a
}

const warnlcm = Symbol("calling 'lcm' with zero arguments returns NaN")
globalThis.lcm = function (a, b, ...rest) {
  if (arguments.length == 0) {
    warn(warnlcm)
    return NaN
  }
  if (arguments.length == 1) return a
  if (rest.length) return lcm(lcm(a, b), ...rest)
  if (a > b) return (a / gcd(a, b)) * b
  else return (b / gcd(a, b)) * a
}

Number.prototype.gcd = function (...args) {
  return gcd(this, ...args.nums())
}

Number.prototype.lcm = function (...args) {
  return lcm(this, ...args.nums())
}

Array.prototype.gcd = function (...args) {
  return gcd(...this, ...args.nums())
}

Array.prototype.lcm = function (...args) {
  return lcm(...this, ...args.nums())
}
