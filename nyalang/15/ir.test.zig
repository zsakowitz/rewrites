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
    is_single: bool,

    fn mn_int(value: comptime_int) Math = .{
        .xml = "<mn>" + value.into_str() + "</mn>",
        .is_single = true,
    };

    fn mi(variable: str) Math = .{
        // TODO: xss protection
        .xml = "<mi>" + variable + "</mi>",
        .is_single = true,
    };

    fn mo(operator: str) Math = .{
        // TODO: xss protection
        .xml = "<mo>" + operator + "</mo>",
        .is_single = true,
    };

    const Accents = struct {
        sub: ?Math = null,
        sup: ?Math = null,
    };

    fn xml_as_single(self: Math) str =
        if (self.is_single)
            self.xml
        else
            "<mrow>" + self.xml + "</mrow>";

    fn attach(self: Math, accents: Accents) Math = .{
        .xml =
            if (accents.sub) |sub|
                if (accents.sup) |sup|
                    "<msubsup>" + self.xml_as_single()
                        + sub.xml_as_single() + sup.xml_as_single()
                        + "</msubsup>"
                else
                    "<msub>" + self.xml_as_single() + sub.xml_as_single() + "</msub>"
            else
                if (accents.sup) |sup|
                    "<msup>" + self.xml_as_single() + sup.xml_as_single() + "</msup>"
                else
                    self.xml_as_single()
        ,
        .is_single = true,
    };
};

test comptime @as(Math,
    .attach(
        .mi("x"),
        .{ .sub = .mn_int(4) }
    )
);
