const Complex = @import("complex.nya");

fn main() void {
    var a: f64 = 4.0;
    const x: u8 = if (a > 3.0) 7 else 8;
    @print(x);
}
