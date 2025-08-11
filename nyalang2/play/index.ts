import { scan } from "../script/scan"

const text = `use "2d/point";
use "2d/geo/arc";
use "2d/geo/ray";

// Special syntax to declare multiple structs with the exact same layout.
// Especially useful for geometry functions, which are polymorphic over the
// various types of line and angle.
struct Line, Vector, Segment, Ray {
  p1: Point,
  p2: Point,
}

type AnyLine = Line | Segment | Ray;
type AnySlope = Line | Vector | Segment | Ray;

fn line(p1: Point, p2: Point) -> Line {
  Line { p1, p2 }
}

fn vector(p1: Point, p2: Point) -> Vector {
  Vector { p1, p2 }
}

fn segment(p1: Point, p2: Point) -> Segment {
  Segment { p1, p2 }
}

fn ray(p1: Point, p2: Point) -> Ray {
  Ray { p1, p2 }
}

struct Angle, DirectedAngle {
  p1: Point,
  p2: Point,
  p3: Point,
}

type AnyAngle = Angle | DirectedAngle;

fn angle(p1: Point, p2: Point, p3: Point) -> Angle {
  Angle { p1, p2, p3 }
}

fn directed_angle(p1: Point, p2: Point, p3: Point) -> DirectedAngle {
  DirectedAngle { p1, p2, p3 }
}

//! https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
fn distance(l: Line, p: Point) -> num {
  let x1 = l.p1.x;
  let y1 = l.p1.y;
  let x2 = l.p2.x;
  let y2 = l.p2.y;

  let x0 = p.x;
  let y0 = p.y;

  abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1)
    / distance(l.p1, l.p2)
}

fn distance(p: Point, l: Line) -> num {
  distance(l, p)
}

fn length(s: Segment | Vector) -> num {
  distance(s.p1, s.p2)
}

fn start(v: Vector) -> Point {
  v.p1
}

fn end(v: Vector) -> Point {
  v.p2
}

fn angle_bisector(v: AnyAngle) -> Ray {
  Ray {
    p1: v.p2,
    p2: @norm(@norm(v.p1 @- v.p2) @+ @norm(v.p3 @- v.p2)) @+ v.p2,
  }
}

fn midpoint(s: Segment) -> Point {
  @mix(s.p1, s.p2, 0.5)
}

struct Circle {
  center: Point,
  radius: num,
}

fn circle(center: Point, radius: num) -> Circle {
  Circle { center, radius }
}

fn circle(center: Point, point_on_radius: Point) -> Circle {
  Circle { center, radius: distance(center, point_on_radius) }
}

fn parallel(l: Line | Segment | Vector | Ray, p: Point) -> Line {
  Line { p1: p, p2: p @+ l.p2 @- l.p1 }
}

fn perpendicular(l: AnySlope, p: Point) -> Line {
  Line {
    p1: p,
    p2: Point { x: p.x + l.p2.y - l.p1.y, y: p.y + l.p1.x - l.p2.x },
  }
}

fn intersection(l1: AnyLine, l2: AnyLine) -> Point {
  _isec_line(l1.p1, l1.p2, l2.p1, l2.p2)
}

//! https://stackoverflow.com/a/37225895
// \`which\` should be -1 | 1
fn _intersection(l: AnyLine, c: Circle, which: num) -> Point {
  let cx = c.center.x;
  let cy = c.center.y;
  let r = c.radius;

  let x1 = l.p1.x;
  let y1 = l.p1.y;
  let x2 = l.p2.x;
  let y2 = l.p2.y;

  let v1 = l.p2 @- l.p1;
  let v2 = l.p1 @- c.center;

  let b = -2.0 * (v1.x * v2.x + v1.y * v2.y);
  let c = 2.0 * (v1.x * v1.x + v1.y * v1.y);
  let d = sqrt(b * b - 2.0 * c * (v2.x * v2.x + v2.y * v2.y - r * r));

  if is_nan(d) {
    %point(nan, nan)
  } else {
    l.p1 @+ v1 @* ((b + which * d) / c)
  }
}

// \`which\` should be -1 | 1
fn _intersection(c1: Circle, c2: Circle, which: num) -> Point {
  let x0 = c1.center.x;
  let y0 = c1.center.y;
  let r0 = c1.radius;

  let x1 = c2.center.x;
  let y1 = c2.center.y;
  let r1 = c2.radius;

  let dx = x1 - x0;
  let dy = y1 - y0;
  // TODO: dot product
  let d = sqrt(dx * dx + dy * dy);

  // circles do not intersect
  if d > r0 + r1 || d < abs(r0 - r1) || d == 0 && r0 == r1 {
    %point(nan, nan)
  } else {
    // dot product
    let a = (r0 * r0 - r1 * r1 + d * d) / (2 * d);
    let h = sqrt(r0 * r0 - a * a);
    c1.center @+ %point(-dy, dx) @* (which * h / d) @+ %point(dx, dy) @* (a / d)
  }
}

fn perpendicular_bisector(p1: Point, p2: Point) -> Line {
  let l1a = midpoint(p1, p2);
  let l1b = %point(l1a.x + (p2.y - p1.y), l1a.y - (p2.x - p1.x));
  Line { p1: l1a, p2: l1b }
}

fn perpendicular_bisector(s: Segment) -> Line {
  perpendicular_bisector(s.p1, s.p2)
}

fn circle(arc: Arc) -> Circle {
  let p1 = arc.p1;
  let p2 = arc.p2;
  let p3 = arc.p3;

  let c = intersection(
    perpendicular_bisector(p1, p2),
    perpendicular_bisector(p3, p2),
  );

  Circle { center: c, radius: @length(c @- p1) }
}

fn intersection(c: Circle, l: AnyLine) -> Point {
  _intersection(l, c, 1)
}

fn intersection(l: AnyLine, c: Circle) -> Point {
  _intersection(l, c, -1)
}

fn intersection(a: Circle, b: Circle) -> Point {
  _intersection(a, b, 1)
}

fn glider(a: Circle, at: num) -> Point {
  let at = 2 * pi * clamp(at, 0.0, 1.0);
  Point {
    x: a.center.x + a.radius * cos(at),
    y: a.center.y + a.radius * sin(at),
  }
}

fn glider(l: Line, at: num) -> Point {
  @mix(l.p1, l.p2, at)
}

fn glider(l: Ray, at: num) -> Point {
  @mix(l.p1, l.p2, max(0.0, at))
}

fn glider(l: Segment, at: num) -> Point {
  @mix(l.p1, l.p2, clamp(at, 0.0, 1.0))
}

// "glider"
// "intersection"
// "polygon"
// "segments"
// "vertices"
// "angles"
// "directed angles"
// "translate"
// "rotate"
// "dilate"
// "reflect"
// "perimeter"

fn %plot_2d(cv: Canvas, p: Circle) -> PathStyled {
  path
    .ellipse(
      cv.point_at(p.center.x, p.center.y),
      cv.delta_by(p.radius, p.radius),
    )
    .color(dcg_green.r, dcg_green.g, dcg_green.b)
}

fn %plot_2d(cv: Canvas, l: Segment) -> Path {
  path
    .move_to(cv.point_at(l.p1.x, l.p1.y))
    .line_to(cv.point_at(l.p2.x, l.p2.y))
}

fn %plot_2d(cv: Canvas, l: Line) -> Path {
  _plot_2d_line(cv, l.p1, l.p2)
}

fn %plot_2d(cv: Canvas, l: Ray) -> Path {
  _plot_2d_ray(cv, l.p1, l.p2)
}

fn %plot_2d(cv: Canvas, l: Vector) -> PathStyled {
  // vector head size
  let size = 12;

  // vector width ratio
  let w = 0.4;

  let o1 = cv.point_at(l.p1.x, l.p1.y);
  let o2 = cv.point_at(l.p2.x, l.p2.y);
  if (
    !(is_finite(o1.x) && is_finite(o1.y) && is_finite(o2.x) && is_finite(o2.y))
  ) {
    return path.styled;
  }

  let dx = o2.x - o1.x;
  let dy = o2.y - o1.y;
  let nx = size * dx / @length(dx, dy);
  let ny = size * dy / @length(dx, dy);
  let ox = o2.x - nx;
  let oy = o2.y - ny;

  path
    .move_to(o1)
    .line_to(o2)
    .move_to(o2)
    .line_to(point_at_raw(ox + w * ny, oy - w * nx))
    .line_to(point_at_raw(ox - w * ny, oy + w * nx))
    .line_to(o2)
    .fill_opacity(1.0)
    .color(dcg_blue.r, dcg_blue.g, dcg_blue.b)
}

fn ->(a: Angle) -> num {
  let measure = (
    atan(a.p1.x - a.p2.x, a.p1.y - a.p2.y)
      - atan(a.p3.x - a.p2.x, a.p3.y - a.p2.y)
  )
    % (2 * pi);

  if measure > pi {
    2.0 * pi - measure
  } else {
    measure
  }
}

fn ->(a: DirectedAngle) -> num {
  let measure = (
    atan(a.p1.x - a.p2.x, a.p1.y - a.p2.y)
      - atan(a.p3.x - a.p2.x, a.p3.y - a.p2.y)
      + 2 * pi
  )
    % (2 * pi);

  if measure > pi {
    measure - 2 * pi
  } else {
    measure
  }
}

expose package {
  name: "2D geometry",
  default: true,
}
`

console.time()
for (let i = 0; i < 1e4; i++) {
  scan(text)
}
console.timeEnd()
// 80us/run (10% slower than nyalang1)
