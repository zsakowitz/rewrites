# Core types which can be referenced by users

| type             | example values             | meaning                                                   |
| ---------------- | -------------------------- | --------------------------------------------------------- |
| any              | // any value               | used for implicitly generic functions                     |
| !                | // has no value            | never                                                     |
| void             | {}                         |                                                           |
| bool             | true, false                |                                                           |
| int              | 23, 0x48_f4                | i32                                                       |
| num              | 2.3, 4e5, 0x6.Ap7          | f64; f32 on GPUs                                          |
| str              | "world"                    | js utf16 string; GPU has only predefined string constants |
| ?T               | // coerces from T and null | optional T                                                |
| []T              | [2, 3, 4], []              | array of T                                                |
| fn(int, num) num | \|a, b\| a + b             | function                                                  |
| ADTs             | T{...}, T.world            | structs and enums declared by the user                    |

A subset of these are the so-called simple types, and have no structure beyond the outermost type.
These types can participate in user-defined coercions and operator overloading. These types are
bool, int, num, str, and ADTs. Even though ! and void fit into the general idea of "no structure
beyond the outermost type", they are not included in this list, as ! has its own coercion rules and
void should not coerce into or out of anything.

# Core types which are internal-only

| type                    | example values  | meaning                                                     |
| ----------------------- | --------------- | ----------------------------------------------------------- |
| null                    | null            | subtype of all ?T                                           |
| .tag                    | .tag            | shorthand for T.tag, where T is expected type               |
| .tag(int, num)          | .tag(32, 4.5)   | shorthand for T.tag(32, 4.5) as T, where T is expected type |
| .{a: int, b: num = 4.5} | .{a: 4, b: 3.4} | record literal                                              |

# Extended types -- possibly not included by default

| type               | example values                                     |
| ------------------ | -------------------------------------------------- |
| time.plaindate     | 2026-07-11                                         |
| time.plaindatetime | 2026-07-11T00:01:27                                |
| time.instant       | 2026-07-11T07:03:36.446Z                           |
| time.zoneddatetime | 2026-07-11T00:01:27.885-07:00[America/Los_Angeles] |
| time.duration      | PT1S                                               |
| time.calendar      | .iso8601                                           |
| file.size          | 100MiB                                             |

# Type declarations

```
struct Complex {
    re: num,
    im: num,
}

enum Calendar {
    iso8601,
    gregorian,
    japanese,
}

struct Temporal {
    struct Instant {
        nanosecondsFromEpoch: int,
    }

    enum Calendar {
        iso8601,
        // ...
    }
}
```

# Operator overloading

All arguments must be simple types.

```
fn +(a: Complex, b: Complex) Complex {
    .{...}
}
```

When calling operators, if there is an expected type T, dot-literals (.lit and .{}) used as
arguments will have an expected type of T. This is satisfactory for many real-world cases (e.g.
complex numbers). (It would be unwise to simply infer .{} as any argument from any overload matching
the expected output, as that could lead to arbitrarily complex inference cycles.)

# Coercions

All arguments and return types must be simple types.

```
fn as(a: num) Complex {
    .{re: a, im: 0.0}
}
```

The following additional coercions are built-in:

- ! to T
- null to ?T (preferred over null to ?null)
- T to ?T
- .lit to T, when T is expected; asserts that the literal is valid for T's properties and methods
- .{a: ...} to T, when T is expected; asserts that the record has the same shape as T

# Tradeoffs

It would be nice to have global functions, like `sin(2+3i)` instead of `(2+3i).sin()`. We can
probably make it so that, if `sin` is not in the current scope, `sin(2+3i)` is a special case which
acts like `(2+3i).sin()`.
