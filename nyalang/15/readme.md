This is heavily inspired by Zig.

# Expressions

```
// Types, primitive

never
void
bool
i32
u32
f64
str
type

// Types, compound primitive

?i32
[]i32
[2]i32
fn(i32, i32) i32

// Types, compound

struct { i32, u32 }
struct { a: i32, b: i32, ... }

enum { a, b, c }
enum(u8) { a, b, c }

union { a: i32, b: i32, c, ... }

// Expressions, constructors for primitive types

unreachable
{}
true
false
23
23.4e-7

// Expressions, constructors for compounds primitive

null
@as(23, ?i32)
.{2, 3, 4}

// Expressions, constructors for compounds

.{2, -3}
.{a: 2, b: 3}
.a

// Expressions, based on type inference

.init(3, 4) // when inferring as type T, calls T.init(3, 4)
.(3, 4) // when inferring as type T, calls T.(3, 4)

// Expressions, operators

2 + 3
2 +% 3
2 - 3
2 -% 3
2 * 3
2 *% 3
2 / 3
2 % 3 // modulus, not remainder

!true
~23
2 ~ 3
2 & 3
2 | 3
2 << 3
2 >> 3

a == b
a != b
a < b
a > b
a <= b
a >= b
a == null
a != null

// Expressions, control flow

a and b
a or b
a orelse b // if a is some(v), some(v). else, b

if (a) 2 else 3 // a: bool
if (a) |x| 2 else 3 // a: ?anytype
switch (a) { .a => 4, .b => 5 } // a: enum
switch (a) { .a => |x| 4, .b => |y| 5 } // b: union
for (a, b) |x, y| { ... } // returns a new array; operands are []T, tuples, and ranges
while (a) { ... } // a: bool; ranges are allowed as operands

break
break 23
break :hi
break :hi 23

continue
continue :hi

return
return 23

// Expressions, data access

a.? // asserts a is some(v), and returns v
a[3] // a must be an array
a[3]? // a must be an array; returns ?(type of a's elements)
a.b // field access

// Expressions, function call variants

a(2, 3)
a.b(2, 3)
.(2, 3) // when result type is `T`, calls `T.(2, 3)`

// Expressions,
```

# Declarations

```
i32, // tuple field, enum key, or union key with type `void`

a: i32, // struct or union field

fn world(a: i32, b: u32) u32 {} // normal function declaration
fn (a: i32, b: u32) u32 {} // constructor declaration
fn +(a: self, b: i32) i32 {} // operator overload

let A = ... // constant declaration
let A: T = ... // constant declaration

var A = ... // variable declaration
var A: T = ... // constant declaration

test "world" { ... }
```

# Built-in functions

```
@as(comptime T: type, x: T) T
@compileError(message: str) never
@compileLog(message: str) never
@import(path: str) anytype // `path` points to `.nya`, `.json`
@embedFile(path: str) str
@panic(message: str) never

// Reflection
@TypeOf
@typeInfo
@field
@structInit
@unionInit
@tupleInit
@arrayInit
@Tuple
@Struct
@Enum
@Union
@Int
@Float
@DotLiteral

// Type conversions
@enumFromTag(x: str) anytype
@tagName(x: anytype) str
@intFromFloat(x: f64) int
@floatFromInt(x: int) f64
@intFromBool(x: bool) int
@floatFromBool(x: bool) f64
// no @boolFromInt, use `x != 0` instead
@bitCast(x: anytype) anytype // enum -> int, int -> enum, i32 -> f32, etc.
@truncate(x: int) int

// float -> float
@sin
@cos
@tan
@sinh
@cosh
@tanh
@asin
@acos
@atan
@asinh
@acosh
@atanh
@atan2
@cbrt
@sqrt
@pow
@rem
@exp
@log
@exp2
@log2
@exp10
@log10
@logp1
@expm1
@floor
@ceil
@trunc

// float -> float, int -> int
@sign
@abs

// f64, f64, ... -> f64
// int, int, ... -> int
@hypot
@max
@min

// f64 -> int
@intFromFloor
@intFromCeil
@intFromTrunc
```

# Extended expressions for everyday types

```
type name                        example value
------------------------------------------------------------------
instant (epoch nanoseconds)      2021-08-01T12:34:56.789Z
duration (# of seconds)          234.8s
plaindate (date)                 2021-08-01
plaindatetime (date, time)       2021-08-01T12:34:56
zoneddatetime                    2021-08-01T12:34:56-04:00[America/New_York] // todo: this looks like an array access
calendarduration                 P1H // todo: this is a legal identifier and therefore cannot be a different value
filesize (# of bytes)            2mb
```

# Mapping to external JavaScript values

Many JavaScript values are plain arrays, numbers, strings, booleans, and
bigints. These map to `[]T`, various number types, `str`, `bool`, `u64` (for a
bigint of appropriate size).

Trickier values are `null` and `undefined`, since they are usually in a union
with some other type. My preferred solution is an annotation like
`?extern(.null) T` and `?extern(.undefined) T`, but those seem a bit complicated
and would require assertions to ban `?extern(.null) ?extern(.null) T`. But these
will be necessary anyway.

The other kind of values are complex objects. Here is an example in TypeScript
syntax:

```ts
namespace Temporal {
    class Instant {
        static compare(instant1: Instant, instant2: Instant): -1 | 0 | 1

        static from(other: Instant): Instant
        static from(iso: string): Instant

        constructor(epochNanoseconds: bigint): Instant

        readonly epochNanoseconds: bigint

        until(future: Instant): Duration
    }

    // made-up array-like API to be annoying
    class InstantArray {
        [x: number]: Instant
        length: number;
        [Symbol.iterator](): ArrayIterator<Instant>
    }
}
```

What would the diagram look like if we implemented this in nyalang? I'll drop
function bodies for now.

```zig
// This is all living inside a giant `let Temporal = struct { ... }`.

let Instant = struct {
    fn compare(instant1: Instant, instant2: Instant) enum(i8) { lt = -1, eq = 0, gt = 1 }
    fn from_instant(other: Instant) Instant
    fn from_str(iso: str) Instant

    epoch_nanoseconds: u64,
    fn until(self, future: Instant): Duration
}

let InstantArray = struct {
    fn [](self, index: u32) Instant
    len: u32,
    extern(.{name: .symbol_iterator}) fn iterator(self) struct {
        fn next(self) ?Instant
    }
}
```

For now I'm not going to worry about this. We'll have JS interop somehow,
eventually.
