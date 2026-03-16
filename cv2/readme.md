# Coordinate Systems

We use a few different coordinate systems within `cv2`.

**Offset space.** Offset space is defined relative to some HTML element `el`.
For it, `(0, 0)` means the top-left of the element's padding box, and
`(el.offsetWidth, el.offsetHeight)` means the bottom-right of the element's
padding box.

**Unit space.** Unit space is defined relative to some HTML element `el`. It
defines `(0, 0)` to be the center of the element, and
`(-el.offsetWidth / el.offsetHeight, -1)` to be the top-left corner of the
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

// More constructors
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

// More constructors
fn circle(Point, Point, Point) -> Circle
fn sphere(Point, Point, Point, Point) -> Sphere // tbd: does this actually work?
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
fn plane(normal: Vector, distance_from_origin: num) -> Plane
fn plane(normal: Vector, member: Point) -> Plane
fn normal(Circle|Plane) -> Vector

// Measurements
fn length(Vector) -> num
fn norm(Vector) -> Vector
fn center(Circle|Sphere) -> Point
fn radius(Circle|Sphere) -> num
```
