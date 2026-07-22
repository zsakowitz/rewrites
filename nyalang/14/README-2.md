# Type System

Primitive types:

- never (has no values)
- void (has exactly one value)
- bool
- i32
- u32
- num (f64 for JS/Wasm, f32 for GLSL, general algebraic expressions for that case)
- str (string for JS, externref for Wasm, i32 for GLSL but only for comptime-known strings)
- type (compile-time known type)

Compound types:

- [T] (list of T)
- ?T (Rust Option<T>, TS {x:T}|null, Zig ?T, Haskell Maybe T)
- null (the "none" part of ?T)
- fn(a, b) c (closure)

Dot literals:

- dotprop (`.abc`, `.abc(23)`)
- dotrecord (`.{a: 2, b: 3}`, `.{2, 3}`)

User-defined types:

- struct (`struct { hi: i32 }`)
- struct tuples (`struct { i32 }`)
- enum (`enum { hi, bye: i32 }`)

# Declarations

```
fn my_func(a: i32) i32 { ... }

const X = ...;

let x: i32 = ...;
let x = ...;
let mut x: i32 = ...;
let mut x = ...;
```

# Expressions

| expr            | return type | inferred argument types           |
| --------------- | ----------- | --------------------------------- |
| [T]             | type        | T: type                           |
| ident           | unknown     |                                   |
| null            | typeof null |                                   |
| true, false     | boolean     |                                   |
| inf, nan        | num         |                                   |
| expr.prop       | unknown     |                                   |
| expr.f(x, ...)  | unknown     | x: first param of (typeof expr).f |
| expr as T       | T           | expr: T                           |
| 23              | i32         |                                   |
| 23.5            | f32         |                                   |
| .hi             | T           |                                   |
| .hi(x, ...)     | T           | x: first param of T.hi            |
| .{a: x}         | T           | x: typeof T.a                     |
| .{x}            | T           | x: typeof T[0]                    |
| struct { a: x } | type        | x: type                           |
| enum { a: x }   | type        | x: type                           |
