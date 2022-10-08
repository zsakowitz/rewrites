// Lambda calculus functions in JavaScript. #untyped

/** identity */
const I = x => x

/** compose unary */
const B = f => g => x => f(g(x))

/** compose binary */
const B1 = f => g => a => b => f(g(a)(b))

/** kestrel */
const K = k => _ => k

const T = x => y => x
const F = x => y => y

const not = x => x(F)(T)
const and = x => y => x(y)(F)
const or = x => y => x(T)(y)

const pair = a => b => f => f(a)(b)
const fst = p => p(T)
const snd = p => p(F)
const phi = p => pair(snd(p))(succ(snd(p)))

const succ = n => s => B(s)(n(s))
const prev = n => fst(n(phi)(pair(n0)(n0)))
const n0 = s => z => z
const n1 = succ(n0)
const n2 = succ(n1)
const n3 = succ(n2)
const n4 = succ(n3)
const n5 = succ(n4)

const jsnum = n => n(x => x + 1)(0)
const lcnum = n => (n ? succ(lcnum(n - 1)) : n0)
const add = a => b => a(succ)(b)
const sub = a => b => a(prev)(b)
const mult = B
const pow = x => y => y(x)
const isZero = n => n(K(F))(T)

const leq = x => y => isZero(sub(x)(y))
const eq = x => y => and(leq(x)(y))(leq(y)(x))
const gt = B1(not)(leq)

export {}
