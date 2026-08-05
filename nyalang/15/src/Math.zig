const Self = @This();

xml: str,
is_single: bool,

fn mn_int(value: comptime_int) Self = .{
    .xml = "<mn>" + value.into_str() + "</mn>",
    .is_single = true,
};

fn mi(variable: str) Self = .{
    // TODO: xss protection
    .xml = "<mi>" + variable + "</mi>",
    .is_single = true,
};

fn mo(operator: str) Self = .{
    // TODO: xss protection
    .xml = "<mo>" + operator + "</mo>",
    .is_single = true,
};

const Accents = struct {
    sub: ?Self = null,
    sup: ?Self = null,
};

fn xml_as_single(self: Self) str =
    if (self.is_single)
        self.xml
    else
        "<mrow>" + self.xml + "</mrow>";

fn attach(self: Self, accents: Accents) Self = .{
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
