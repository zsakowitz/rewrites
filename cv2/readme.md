# Coordinate Systems

We use a few different coordinate systems within `cv2`.

**Offset space.** Offset space is defined relative to some HTML element `el`.
For it, `(0, 0)` means the top-left of the element's padding box, and
`(el.offsetWidth, el.offsetHeight)` means the bottom-right of the element's
padding box.

**Unit space.** Unit space is defined relative to some HTML element `el`. It
defines `(0, 0)` to be the center of the element, and
`(-1, -el.offsetHeight / el.offsetWidth)` to be the top-left corner of the
element.

Offset space and unit space follow the DOM convention that more positive
Y-coordinates are further down the page.

Offset space and unit space are both zoom-square spaces. That is, `(0, 0)` and
`(1, 1)` lie on a 45-degree line heading towards the bottom-right of the screen.
This is very convenient for scaling.

**Local space.** Local space is like the coordinate space you normally interact
with in Desmos or project nya -- it's the system that the user defines objects
in.

2D local space follows the mathematical convention that more positive
Y-coordinates are further up the page.

If a transformation is stored in a variable, we might name it `ul` if it
converts from unit space to local space, or `lo` if it converts from local space
to offset space.

# 2D Geometry

Here is a list of 2D geometric functions we hope to eventually support. For
simplicity, we only include a few core shapes, and omit gliders.

```rust
// Direct constructors
fn point(num, num) -> Point
fn line(Point, Point) -> Line
fn vector(Point, Point) -> Vector
fn circle(Point, num) -> Circle
type Curve = Line | Vector | Circle;

// Multipoint constructors
fn circle(Point, Point) -> Circle // center, point on edge
fn circle(Point, Point, Point) -> Circle // circumcircle

// Intersections, parallels, and perpendiculars
fn isec(Line|Circle, Line|Circle) -> Point
fn parallel(Line|Vector, Point) -> Line
fn perpendicular(Line|Vector, Point) -> Line
fn normal(Line) -> Vector

// Measurements
fn length(Vector) -> num
fn norm(Vector) -> Vector
fn center(Circle) -> Point
fn radius(Circle) -> Circle
```

Eventually, we will also want segments, rays, angles, bisectors of all kinds
(midpoint of segment, perpendicular bisector as line, angle bisector as ray),
transformations, and polygons (including area, perimeter, points, and angles).

# 3D Geometry

Here is a list of 3D geometric functions we hope to eventually support. For
simplicit, we only include a few core shapes, and omit gliders.

```rust
// Direct constructors
fn point(num, num, num) -> Point
fn line(Point, Point) -> Line
fn vector(Point, Point) -> Vector
type Circle; // no obvious default constructor
fn sphere(Point, num) -> Sphere
type Plane; // no obvious default constructor

// Multipoint constructors
fn circle(Point, Point, Point) -> Circle
fn sphere(Point, Point, Point, Point) -> Sphere
fn plane(Point, Point, Point) -> Circle

// Intersections
fn isec(Plane, Plane) -> Line
fn isec(Plane|Sphere, Plane|Sphere) -> Circle
fn isec(Plane|Sphere, Line|Circle) -> Point
fn isec(Line|Circle, Plane|Sphere) -> Point

// Parallel constructs
fn circle(parallel_plane: Plane, center: Point, radius: num) -> Circle
fn parallel(Line|Vector, Point) -> Line
fn parallel(Plane, Point) -> Plane

// Perpendicular constructs
fn circle(normal: Vector, center: Point, radius: num) -> Circle
fn normal(Circle|Plane) -> Vector
fn perpendicular(Line|Vector, Point) -> Plane
fn perpendicular(Plane, Point) -> Line

// Measurements
fn length(Vector) -> num
fn norm(Vector) -> Vector
fn center(Circle|Sphere) -> Point
fn radius(Circle|Sphere) -> num
```

Eventually, we will also want segments, rays, angles, bisectors of all kinds
(midpoint of segment, perpendicular bisector as plane, angle bisector as ray),
transformations, and triangles (including area, perimeter, points, angles, and
intersections).

# Automatic Differentiation

Some symbols derivatives for reference:

```
d/dx int(f(t) dt | a(t)..b(t))
===> b'(x) f(b(x)) - a'(x) f(a(x))

d/dx int(f(x,t) dt | a(x)..b(x))
===> b'(x) f(x,b(x)) - a'(x) f(x,a(x)) + int(d/dx f(x,t) dt, a(x)..b(x))

d/dx f g
===> f' g + f g'

d/dx f^g
===> f^(g-1) (g f' + f (ln∘f) g')
```

How do we do multiple derivatives? In theory, we can just take the derivative of
a program, then do it again. Does this work in practice? There's no reason why
it wouldn't...

Say we have this base program.

```
01 Var x
02 Pow 01 <const 4>
```

Now we differentiate it.

```
01 Var x
02 Const 1
03 Const 4
04 Pow 01 <const 3>
05 Mul 03 04
06 Mul 02 05
```

And simplify.

```
01 Var x
02 Const 4
03 Pow 01 <const 3>
04 Mul 02 03
```

# Language Operations

Somewhat expansive list of standard operations.

```
i32.const <i32> :: -> i32
i32.{neg,not} :: i32 -> i32
i32.{add,sub,mul,div,rem,mod,and,or,xor} :: i32 i32 -> i32
i32.{le,lt,ge,gt,eq,ne} :: i32 i32 -> bool
i32.from_num :: num -> i32
i32.from_bool :: bool -> i32

num.const <rat/f64/inf/nan> :: -> num
num.{add,sub,mul,div,rem,mod,pow} :: num num -> num
num.{sin,sinh,asin,asinh,cos,cosh} :: num -> num
num.{acos,acosh,tan,tanh,atan,atanh} :: num -> num
num.{exp,log,exp10,log10,exp2,log2} :: num -> num
num.{inv,isqrt,sqrt,square} :: num -> num
num.{floor,ceil,trunc,round,fract,abs,sign} :: num -> num
num.{le,lt,ge,gt,eq,ne} :: num num -> bool
num.from_i32 :: i32 -> num
num.from_bool :: bool -> num

bool.const <bool> :: -> bool
bool.{eq,ne,and,or,xor} :: bool bool -> bool
bool.not :: bool -> bool

local.get $x :: -> T
local.set $x :: T ->

struct.new $x :: T* -> U
struct.get $x <n> :: U -> T

select <T*> :: T* T* bool -> T*
```

Most of these are simple functions, so we should consider unifying them into a
single represntation, like Desmos's NativeFunction.

```
i32.const <i32>
num.const <num>
bool.const <bool>

call.native $name :: T* -> U*

tuple.new $x :: T* -> U
tuple.get $x <n> :: U -> T

select <T*> :: T* T* bool -> T*
```

Native functions:

```
i32.{neg,not} :: i32 -> i32
i32.{add,sub,mul,div,rem,mod,and,or,xor} :: i32 i32 -> i32
i32.{le,lt,ge,gt,eq,ne} :: i32 i32 -> bool
i32.from_num :: num -> i32
i32.from_bool :: bool -> i32

num.{add,sub,mul,div,rem,mod,pow} :: num num -> num
num.{sin,sinh,asin,asinh,cos,cosh} :: num -> num
num.{acos,acosh,tan,tanh,atan,atanh} :: num -> num
num.{exp,log,exp10,log10,exp2,log2} :: num -> num
num.{inv,isqrt,sqrt,square} :: num -> num
num.{floor,ceil,trunc,round,fract,abs,sign} :: num -> num
num.{le,lt,ge,gt,eq,ne} :: num num -> bool
num.from_i32 :: i32 -> num
num.from_bool :: bool -> num

bool.{eq,ne,and,or,xor} :: bool bool -> bool
bool.not :: bool -> bool
```
