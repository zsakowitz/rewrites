"use strict"

const colors = {
  black: "\u001b[30m",
  blue: "\u001b[34m",
  cyan: "\u001b[36m",
  dim: "\u001b[2m",
  green: "\u001b[32m",
  magenta: "\u001b[35m",
  red: "\u001b[31m",
  reset: "\u001b[0m",
  white: "\u001b[37m",
  yellow: "\u001b[33m",
}

let /** @type {import("node:fs")} */ fs
let /** @type {import("node:path")} */ path
if (typeof process == "object") {
  fs = await import("node:fs")
  path = await import("node:path")
}

const DID_WARN = new WeakMap()
function warn(name) {
  if (!DID_WARN.get(name)) {
    const label = `WARN: ${name.toString().slice(7, -1)}`

    if (typeof process == "undefined") {
      console.warn(label)
    } else {
      const error = new Error(label)
      let [msg, ...stack] = error.stack.lines()
      stack = stack.join("\n")
      if (stack) stack = "\n" + stack
      console.warn(colors.red + msg + colors.dim + stack + colors.reset)
    }

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

const symsum = Symbol(".sum() returned a non-number")

Array.prototype.sum = function (f = (x) => +x) {
  const val = this.reduce((a, b, i, arr) => a + f(b, i, arr), 0)
  if (typeof val != "number") warn(symsum)
  return val
}

Array.prototype.prod = function (f = (x) => +x) {
  return this.reduce((a, b, i, arr) => a * f(b, i, arr), 1)
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

function defineNum(name, fromString, single = false, conv = (x) => Number(x)) {
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
    if (single) return conv(this)
    return this.match(fromString)?.map(conv) || []
  }

  if (single) {
    const sym = Symbol(`using singular .${name} on a regex`)

    Object.defineProperty(RegExp.prototype, name, {
      configurable: true,
      get() {
        warn(sym)
        return (text) => conv(text)
      },
    })
  } else {
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
}

defineNum("num", /^.*$/, true)
defineNum("bigint", /^.*$/, true, BigInt)

defineNum("nums", /-?\d+(?:\.\d+)?/g)
defineNum("ints", /-?\d+/g)
defineNum("uints", /\d+/g)
defineNum("digits", /\d/g)

defineNum(
  "digitnamesfwd",
  /\d|one|two|three|four|five|six|seven|eight|nine/g,
  false,
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
defineNum(
  "digitnamesrev",
  /\d|one|two|three|four|five|six|seven|eight|nine/g,
  false,
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
  ).map((x) => x.reverse().digitnamesfwd())
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

Iterator.prototype.count = function (val) {
  return this.filter(val).reduce((a) => a + 1, 0)
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
    return Number.isSafeInteger(x) && min <= x && x < max
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

const symsumtoomanyargs = Symbol(
  "called Iterator.sum with more than 1 expected parameter",
)
Iterator.prototype.sum = function (f = (x) => +x) {
  if (f.length > 1) warn(symsumtoomanyargs)
  return this.reduce((a, b) => a + f(b), 0)
}

const symprodtoomanyargs = Symbol(
  "called Iterator.prod with more than 1 expected parameter",
)
Iterator.prototype.prod = function (f = (x) => +x) {
  if (f.length > 1) warn(symprodtoomanyargs)
  return this.reduce((a, b) => a * f(b), 1)
}

Number.prototype.check = function (expected) {
  if (this !== expected) {
    throw new Error(
      `${colors.red}FAILED: expected ${expected} but got ${this}${colors.reset}`,
    )
  } else {
    console.log(`${colors.green}PASSED: ${expected}${colors.reset}`)
  }
  return this
}

const symstringcheck = Symbol(
  "calling .check() on a string; pass 'YESIMSURE' as second arg to hide warning",
)
String.prototype.check = function (expected, yesimsure) {
  if (yesimsure !== "YESIMSURE") {
    warn(symstringcheck)
  }

  if (this !== expected) {
    throw new Error(
      `${colors.red}FAILED: expected ${expected} but got ${this}${colors.reset}`,
    )
  } else {
    console.log(`${colors.green}PASSED: ${expected}${colors.reset}`)
  }

  return this
}

Object.prototype.check = function (expected) {
  console.error(this)
  throw new Error(
    `${colors.red}FAILED: expected ${expected} but got the above (TOTALLY DIFFERENT DATA TYPES)${colors.reset}`,
  )
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
  return arg.counttarget(this)
}

String.prototype.counttarget = function (source) {
  return (source.length - source.replaceAll(this, "").length) / this.length
}

RegExp.prototype.counttarget = function (source) {
  return source.matchAll(this).count(() => 1)
}

Array.prototype.counttarget = function (source) {
  return this.sum((target) => target.counttarget(source))
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

// Array.prototype.reduceRaw = Array.prototype.reduce
// Array.prototype.reduceRightRaw = Array.prototype.reduceRight
//
// Array.prototype.reduce = function (f, acc) {
//   return kbr(() =>
//     arguments.length == 1 ? this.reduceRaw(f) : this.reduceRaw(f, acc),
//   )
// }
//
// Array.prototype.reduceRight = function (f, acc) {
//   return kbr(() =>
//     arguments.length == 1
//       ? this.reduceRightRaw(f)
//       : this.reduceRightRaw(f, acc),
//   )
// }

const symtltrblbr = Symbol(
  "using Point.[tb][lr] is not recommended as it does not match the x-y order or arguments; use Point.[lr][tb] instead",
)

globalThis.PointRaw = class Point {
  x
  y
  z
  g

  get r() {
    return this.y
  }

  get c() {
    return this.x
  }

  get i() {
    return this.y
  }

  get j() {
    return this.x
  }

  constructor(x, y, z, g) {
    this.x = x
    this.y = y
    this.z = z
    this.g = g
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

  add(p) {
    return pt(
      this.x + p.x,
      this.y + p.y,
      this.z === undefined ? undefined : this.z + p.z,
      this.g,
    )
  }

  t() {
    return this.add(pt(0, -1, 0))
  }

  b() {
    return this.add(pt(0, 1, 0))
  }

  l() {
    return this.add(pt(-1, 0, 0))
  }

  r() {
    return this.add(pt(1, 0, 0))
  }

  get tl() {
    warn(symtltrblbr)
    return this.lt
  }

  get tr() {
    warn(symtltrblbr)
    return this.rt
  }

  get bl() {
    warn(symtltrblbr)
    return this.lb
  }

  get br() {
    warn(symtltrblbr)
    return this.rb
  }

  lt() {
    return this.add(pt(-1, -1, 0))
  }

  rt() {
    return this.add(pt(1, -1, 0))
  }

  lb() {
    return this.add(pt(-1, 1, 0))
  }

  rb() {
    return this.add(pt(1, 1, 0))
  }

  get v() {
    if (!this.g) {
      throw new Error("Cannot get value of `Point` without owner.")
    }
    return this.g[this.i]?.[this.j]
  }

  set v(v) {
    if (!this.g) {
      throw new Error("Cannot set value of `Point` without owner.")
    }
    if (!this.g[this.i]) {
      throw new Error("`Point` is out of bounds; cannot set its value.")
    }
    this.g[this.i][this.j] = v
  }

  diag(x, y) {
    if (!this.g) {
      throw new Error(
        "Cannot get points along a diagonal from a `Point` without an owner.",
      )
    }

    return this.g.diag(this, x, y)
  }

  dful(x, y) {
    if (!this.g) {
      throw new Error(
        "Cannot get points along a diagonal from a `Point` without an owner.",
      )
    }

    return this.g.dful(this, x, y)
  }
}

globalThis.pt =
  globalThis.Pt =
  globalThis.point =
  globalThis.Point =
    function () {
      return new PointRaw(...arguments)
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

const symfetchinginput = Symbol("fetching input... will return promise")
const symimplicitinput = Symbol(
  "using implicit arguments for 'input()' will break tomorrow",
)
globalThis.input = function (year = today()[0], day = today()[1]) {
  if (
    typeof year != "number" ||
    !ri(2015, 20000).has(year) ||
    !ri(1, 25).has(day)
  ) {
    throw new Error("Invalid year or day.")
  }

  const code = `ilowi/${year}/${day}/input`
  const url = `https://adventofcode.com/${year}/day/${day}/input`

  if (typeof process == "object") {
    if (arguments.length != 2) {
      warn(symimplicitinput)
    }
    const file = new URL(
      "./.aoc/" + code,
      new URL("file://" + process.env.PWD + "/"),
    ).pathname
    if (fs.existsSync(file)) {
      return fs.readFileSync(file, "utf8")
    }

    warn(symfetchinginput)
    return fetch(url, {
      headers: { cookie: process.env.SAKAWITOOLS_AOC_COOKIE },
    })
      .then((response) => {
        if (response.ok) return response.text()
        throw new Error(`Failed to fetch input for ${year}/${day}.`)
      })
      .then(async (text) => {
        if (text.endsWith("\n")) text = text.slice(0, -1)
        await fs.promises.mkdir(path.dirname(file), { recursive: true })
        fs.writeFileSync(file, text)
        return text
      })
  }

  if (typeof localStorage == "object") {
    const value = localStorage.getItem(code)
    if (value) {
      return value
    }
  }

  const req = new XMLHttpRequest()

  console.log(url)
  req.open("GET", url, false)
  req.send()
  if (req.status == 200) {
    localStorage.setItem(code, req.response)
    return req.response
  } else {
    throw new Error("getting input failed", req.response)
  }
}

globalThis.today = function () {
  const today = new Date(
    Date.now() + // now
      new Date().getTimezoneOffset() * 60 * 1000 - // move to UTC
      5 * 60 * 60 * 1000, // move to EST
  )

  return [today.getFullYear(), today.getDate()]
}

Array.prototype.by = function (other) {
  other = other.toArray()
  return this.flatMap((x) => other.map((y) => [x, y]))
}

Iterator.prototype.by = function (other) {
  other = other.toArray()
  return this.flatMap((x) => other.map((y) => [x, y]))
}

Array.prototype.toArray = function () {
  return this
}

Object.prototype.kbr = function (f) {
  return kbr(() => f(this))
}

Array.prototype.rbr = function (f, acc) {
  return kbr(() => this.reduce(f, acc))
}

String.prototype.tx = function () {
  return this.lines()
    .map((x) => x.chars())
    .tx()
    .map((x) => x.join(""))
    .join("\n")
}

String.prototype.grid = function () {
  return this.lines()
    .map((x) => x.chars())
    .grid()
}

globalThis.Grid = class Grid extends Array {
  arr() {
    this.__proto__ = Array.prototype
    return this
  }

  str() {
    return this.map((x) => x.join("")).join("\n")
  }

  *v() {
    for (let i = 0; i < this.length; i++) {
      const row = this[i]
      for (let j = 0; j < row.length; j++) {
        yield row[j]
      }
    }
  }

  *k() {
    for (let i = 0; i < this.length; i++) {
      const row = this[i]
      for (let j = 0; j < row.length; j++) {
        yield pt(j, i, undefined, this)
      }
    }
  }

  get(v) {
    return this[v.i]?.[v.j]
  }

  has(v) {
    return rx(0, this.length).has(v.i) && rx(0, this[v.i].length).has(v.j)
  }

  col(i) {
    return this.map((row) => row[i])
  }

  diag(pt, x, y) {
    if (Math.abs(x) != Math.abs(y)) {
      throw new Error("Called .diag() with values of different sizes")
    }
    if (!this.has(pt)) {
      return []
    }
    const row = [this.get(pt)]
    if (x < 0) {
      for (const v of ri(1, -x)) {
        const o = pt.add(point(-v, v * Math.sign(y)))
        if (this.has(o)) row.push(this.get(o))
        else return row
      }
    } else if (x > 0) {
      for (const v of ri(1, x)) {
        const o = pt.add(point(v, v * Math.sign(y)))
        if (this.has(o)) row.push(this.get(o))
        else return row
      }
    }
    return row
  }

  dful(pt, x, y) {
    if (Math.abs(x) != Math.abs(y)) {
      throw new Error("Called .diag() with values of different sizes")
    }
    if (!this.has(pt)) {
      return null
    }
    const row = [this.get(pt)]
    if (x < 0) {
      for (const v of ri(1, -x)) {
        const o = pt.add(point(v, -v * Math.sign(y)))
        if (this.has(o)) row.push(this.get(o))
        else return null
      }
    } else {
      for (const v of ri(1, x)) {
        const o = pt.add(point(v, v * Math.sign(y)))
        if (this.has(o)) row.push(this.get(o))
        else return null
      }
    }
    return row
  }
}

Array.prototype.grid = function () {
  this.__proto__ = Grid.prototype
  return this
}

String.prototype.is = function (arg) {
  return arg.stringis(this)
}

String.prototype.stringis = function (self) {
  return self == this
}

Array.prototype.stringis = function (self) {
  return this.some((x) => x.stringis(self))
}

RegExp.prototype.stringis = function (self) {
  return this.test(self)
}

String.prototype.mx = function () {
  return [this, this.reverse()]
}

const symnbbadoffset = Symbol("offset to '...'.nb() is positive")
const symnbcharnotfound = Symbol(
  "character passed to '...'.nb() is not in digits list",
)
const symnooffset = Symbol("implicitly using 0 as offset to .nb()")
String.prototype.nb = function (base, offset) {
  if (offset === undefined) {
    warn(symnooffset)
    offset = 0
  }

  const digits = base.asnumberbase()

  return this.chars()
    .map((char) =>
      digits.indexOf(char).m1(() => {
        warn(symnbcharnotfound)
        return false
      }),
    )
    .filter((x) => x !== false)
    .map((x) => x + offset)
    .reduce((a, b) => digits.length * a + b, 0)
}

const symnbalbadbase = Symbol("123.nbal() expects an odd numbered base")
Number.prototype.nbal = function (base) {
  const digits = base.asnumberbase()

  if (!Number.isSafeInteger(digits.length) || !(digits.length % 2)) {
    warn(symnbalbadbase)
  }

  const offset = (1 - digits.length) / 2

  let o = ""
  let n = this

  while (n != 0) {
    const m5 = Math.round(n / digits.length) * digits.length
    const diff = n - m5
    o = digits[diff - offset] + o
    n = m5 / digits.length
  }

  return o
}

String.prototype.asnumberbase = function () {
  return this.split("")
}

Number.prototype.asnumberbase = function () {
  return Array.from({ length: base }, (_, i) => "" + i)
}

Array.prototype.asnumberbase = function () {
  return this.map((x) => "" + x)
}

addWarning(
  Array.prototype,
  "toString",
  Symbol("implicitly converting array to string"),
)
addWarning(
  Object.prototype,
  "toString",
  Symbol("implicitly converting object to string"),
)
addWarning(
  Function.prototype,
  "toString",
  Symbol("implicitly converting function to string"),
)

const symnbisactuallynbal = Symbol(
  "if calling 123.nb(), you either want .toString(base) for normal bases or .nbal(base) for a balanced base; defaulting to .nbal()",
)
Object.defineProperty(Number.prototype, "nb", {
  configurable: true,
  get() {
    warn(symnbisactuallynbal)
    return this.nbal
  },
})
