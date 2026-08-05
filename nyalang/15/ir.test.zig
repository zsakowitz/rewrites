fn Complex(T: type) type {
    return struct {
        const Self = @This();

        re: T,
        im: T,

        const i: Self = .{ .re = 0, .im = 1 };

        fn from_literal(value: T) Self {
            return .{ .re = value, .im = 0 };
        }
        fn init(re: T, im: T) Self {
            return .{ .re = re, .im = im };
        }
        fn @"0-"(self: Self) Self {
            return .{
                .re = -self.re,
                .im = -self.im,
            };
        }
        fn @"+"(lhs: Self, rhs: Self) Self {
            return .{
                .re = lhs.re + rhs.re,
                .im = lhs.im + rhs.im,
            };
        }
        fn @"-"(lhs: Self, rhs: Self) Self {
            return .{
                .re = lhs.re - rhs.re,
                .im = lhs.im - rhs.im,
            };
        }
        fn @"*"(lhs: Self, rhs: Self) Self {
            return .{
                .re = lhs.re * rhs.re - rhs.im.conj() * lhs.im,
                .im = rhs.im * lhs.re + lhs.im * rhs.re.conj(),
            };
        }
        fn @"/"(lhs: Self, rhs: Self) Self {
            const top = lhs * rhs.conj();
            const denom = rhs.re * rhs.re + rhs.im * rhs.im;

            return .{
                .re = top.re / denom,
                .im = top.im / denom,
            };
        }
        fn conj(self: Self) Self {
            return .{
                .re = self.re.conj(),
                .im = -self.im,
            };
        }
    };
}

const ComplexFloat = Complex(comptime_float);

test @as(ComplexFloat, (2 * .i + 3) / (5 + 4 * .i));

fn Zn(n: comptime_int) type {
    if (n <= 0) @compileError("group must have at least one item");

    return struct {
        const Self = @This();

        repr: comptime_int,

        fn from_literal(repr: comptime_int) Self {
            if (repr < 0) @compileError("use a representative in the range 0..n");
            if (repr >= n) @compileError("use a representative in the range 0..n");

            return .{ .repr = repr };
        }
        fn @"+"(lhs: Self, rhs: Self) Self {
            return .{ .repr = (lhs.repr + rhs.repr) % n };
        }
        fn @"0-"(self: Self) Self {
            return .{ .repr = n - self.repr };
        }
        fn @"-"(lhs: Self, rhs: Self) Self {
            return .{ .repr = .mod(lhs.repr - rhs.repr, n) };
        }
    };
}

const MyGroup = Zn(5);

test @as(MyGroup, 3 + 4);
test @as(MyGroup, 2 - 3);
test @as(MyGroup, 1 - 1);

const Math = struct {
    xml: str,

    fn from_int(value: comptime_int) Math {
        return .{ .xml = "<mn>" + value.into_str() + "</mn>" };
    }
};

test @as(Math, .from_int(23));
