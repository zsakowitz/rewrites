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

        fn @"1/"(rhs: Self) Self {
            const denom = rhs.re * rhs.re + rhs.im * rhs.im;

            return .{
                .re = rhs.re / denom,
                .im = -rhs.im / denom,
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
