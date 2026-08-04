fn Complex(T: type) type {
    return struct {
        const Self = @This();

        re: T,
        im: T,

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

        fn conj(self: Self) Self {
            return .{
                .re = self.re.conj(),
                .im = -self.im,
            };
        }
    };
}

const Q = Complex(Complex(comptime_int));

test Q;
