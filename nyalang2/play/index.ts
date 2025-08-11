import { _try } from "../impl/test"
import { scan } from "../script/scan"

const text = `
struct Complex {
  real: num,
  imag: num,
}

fn ->(x: num) -> Complex {
  Complex {
    real: x,
    imag: 0.0,
  }
}

let _complex_zero = Complex { real: 0.0, imag: 0.0 };

fn %display(z: Complex) -> latex {
  base(z.real).with_component(i, z.imag).finalize
}

fn +(z: Complex) -> Complex {
  z
}

fn +(a: Complex, b: Complex) -> Complex {
  a @+ b
}

fn -(z: Complex) -> Complex {
  @-z
}

fn -(a: Complex, b: Complex) -> Complex {
  a @- b
}

fn *(a: Complex, b: Complex) -> Complex {
  Complex {
    real: a.real * b.real - a.imag * b.imag,
    imag: a.imag * b.real + a.real * b.imag,
  }
}

fn /(a: Complex, b: Complex) -> Complex {
  Complex {
    real: a.real * b.real + a.imag * b.imag,
    imag: a.imag * b.real - a.real * b.imag,
  }
    @/ (b.real * b.real + b.imag * b.imag)
}

fn inv(a: Complex) -> Complex {
  Complex { real: a.real, imag: -a.imag } @/ (a.real * a.real + a.imag * a.imag)
}

fn ==(a: Complex, b: Complex) -> bool {
  a.real == b.real && a.imag == b.imag
}

let i = Complex { real: 0.0, imag: 1.0 };

// TODO: cplothue(complex), cplothue(point)

// TODO: cplot(point), cplot(r32abs)

fn cplot(z: Complex) -> Color {
  if !is_finite(z.real) || !is_finite(z.imag) {
    return Color { r: 0.0, g: 0.0, b: 0.0, a: 0.0 };
  }

  let angle = atan(z.imag, z.real);
  let absval_scaled = @length(z) / (@length(z) + 1.0);
  let r0 = 0.08499547839164734 * 1.28;
  let offset = 0.8936868 * 3.141592653589793;
  let rd = 1.5 * r0 * (1.0 - 2.0 * abs(absval_scaled - 0.5));

  oklab(absval_scaled, rd * cos(angle + offset), rd * sin(angle + offset), 1.0)
}

fn %plot_shader(z: Complex) -> Color {
  cplot(z)
}

// TODO: cplot on absolute value
// float absval_scaled = abs(z) / (abs(z) + 1.0);
// vec3 ok_coords = vec3(absval_scaled, 0, 0);
// vec3 rgb = _helper_oklab(ok_coords);
// return vec4(vec3(0), 1.0-rgb.real);

fn arg(z: Complex) -> num {
  // TRIG:
  atan(z.imag, z.real)
}

fn sign(z: Complex) -> Complex {
  if z.real == 0.0 && z.imag == 0.0 {
    _complex_zero
  } else {
    @norm(z)
  }
}

fn exp(z: Complex) -> Complex {
  exp(z.real) @* Complex { real: cos(z.imag), imag: sin(z.imag) }
}

fn ln(z: Complex) -> Complex {
  if z.real == 0.0 && z.imag == 0.0 {
    // limit is negative infinity
    Complex { real: neg_inf, imag: 0.0 }
  } else {
    Complex { real: ln(@length(z)), imag: atan(z.imag, z.real) }
  }
}

fn %xprody(x: Complex, y: Complex) -> Complex {
  if is_nan(y.real) || is_nan(y.imag) {
    Complex { real: nan, imag: nan }
  } else if x.real == 0.0 && x.imag == 0.0 {
    _complex_zero
  } else {
    x * y
  }
}

fn log10(z: Complex) -> Complex {
  ln(z) @/ ln(10.0)
}

fn conj(z: Complex) -> Complex {
  Complex { real: z.real, imag: -z.imag }
}

fn dot(a: Complex, b: Complex) -> num {
  @dot(a, b)
}

fn unsign(z: Complex) -> Complex {
  @abs(z)
}

fn i(z: Complex) -> num {
  z.imag
}

fn ^(a: Complex, b: Complex) -> Complex {
  if a.real == 0.0 && a.imag == 0.0 {
    _complex_zero
  } else {
    exp(ln(a) * b)
  }
}

fn %odot(a: Complex, b: Complex) -> Complex {
  a @* b
}

fn complex(a: Complex) -> Complex {
  a
}

fn abs(a: Complex) -> num {
  @length(a)
}

fn %sqrt(z: Complex) -> Complex {
  let a = atan(z.imag, z.real) / 2.0;
  Complex { real: cos(a), imag: sin(a) } @* sqrt(@length(z))
}

fn %plot_2d(cv: Canvas, p: Complex) -> CanvasPoint {
  cv.point_at(p.real, p.imag)
}

let _complex_nan = Complex {
  real: nan,
  imag: nan,
};

fn midpoint(p1: Complex, p2: Complex) -> Complex {
  (p1 + p2) / 2.0
}

fn distance(p1: Complex, p2: Complex) -> num {
  @length(p1 - p2)
}

fn is_finite(p: Complex) -> bool {
  is_finite(p.real) && is_finite(p.imag)
}

fn point(x: Complex) -> Point {
  Point {
    x: x.real,
    y: x.imag,
  }
}

expose package {
  name: complex numbers,
  default: true,
}

// TODO: debugpoint, screendistance, point
`

_try(({ ctx }) => {
  console.time()
  for (let i = 0; i < 1e4; i++) {
    scan("", text)
  }
  // 44.1us/read
  console.timeEnd()
})
