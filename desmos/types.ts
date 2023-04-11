export const SINGLE_CHARACTER_VARIABLES =
  /^Pi|Xi|mp|mu|nu|pi|pm|xi|Phi|Psi|chi|div|eta|mid|phi|psi|rho|tau|beta|iota|perp|zeta|Delta|Gamma|Omega|Sigma|Theta|alpha|delta|gamma|infty|kappa|omega|sigma|theta|times|varpi|Lambda|lambda|varphi|varrho|Upsilon|digamma|epsilon|upsilon|varkappa|varsigma|vartheta|nparallel|varepsilon/

// Typings are in this format:
//   fn_name arg1 arg2 -> return_type
//
// Types can be any of the following:
//   R      real number
//   C      complex number
//   D      distribution
//   Q      color
//   P      polygon
//   LR     list of real numbers
//   LC     list of complex numbers
//   LD     list of distributions
//   LQ     list of colors
//   LP     list of polygons
//   X      display only (cannot be used in other operations)
//
// Note that any function whose inputs are all
// real or complex numbers will automatically
// have an overload where each argument is a list.
//
// For example,
//   arccos R -> R
// automatically has these overloads available:
//   arccos LR -> LR
//
// To note the presence of a complex alternative,
// such as c_sin or c_cos, mark the alternative
// with a "+" sign at the beginning of its name.
// The alternative's name is assumed to be "c_...".

const TYPINGS_SOURCE = `
arccos R -> R

arccosh R -> R

arccot R -> R

arccoth R -> R

arccsc R -> R

arccsch R -> R

arcsec R -> R

arcsech R -> R

arcsin R -> R

arcsinh R -> R

arctan R -> R
arctan R R -> R

arctanh R -> R

binomialdist R -> D
binomialdist R R -> D

boxplot LR -> X

cdf D R -> R

ceil R -> R

corr LR LR -> R

cos R -> R
+cos C -> C

cosh R -> R

cot R -> R

coth R -> R

cov LR LR -> R

covp LR LR -> R

csc R -> R
+csc C -> C

csch R -> R

distance C C -> R

dotplot LR -> X

exp R -> R
+exp C -> C

floor R -> R

gcd R -> R
gcd R R -> R

histogram LR -> R
histogram LR R -> R

hsv R R R -> Q

inversecdf LR -> R
inversecdf LR R -> R

ittest LR LR -> X

join R R -> LR
join C C -> LC
join D D -> LD
join Q Q -> LQ

lcm R -> R
lcm R R -> R

length LR -> R
length LC -> R
length LD -> R
length LQ -> R
length LP -> R

ln R -> R
+ln C -> C

log R -> R
+log C -> C

mad LR -> R

max LR -> R

mean LR -> R
+mean LC -> C

median LR -> R

midpoint C C -> C

min LR -> R

mod R R -> R

normaldist -> D
normaldist R -> D
normaldist R R -> D

pdf D R -> R

poissondist R -> D

polygon C C -> P
polygon LC -> P

quantile LR R -> R

quartile LR R -> R

random -> R
random R -> LR
random R R -> LR

rgb R R R -> Q

round R -> R

sec R -> R
+sec C -> C

sech R -> R

shuffle LR -> LR
shuffle LC -> LC
shuffle LD -> LD
shuffle LQ -> LQ
shuffle LP -> LP

sign R -> R
+sign C -> C

sin R -> R
+sin C -> C

sinh R -> R

sort LR -> LR

spearman LR LR -> R

stats LR -> X

stddev LR -> R

stddevp LR -> R

stdev LR -> R

stdevp LR -> R

tan R -> R
+tan C -> C

tanh R -> R

tdist R -> D

total LR -> R
total LC -> C

tscore LR R -> R

ttest LR -> X

uniformdist -> D
uniformdist R -> D
uniformdist R R -> D

unique LR -> LR
unique LC -> LC
unique LD -> LD
unique LQ -> LQ
unique LP -> LP

var LR -> R
`.trim()

export const BUILT_INS_WITH_COMPLEX_ALTERNATIVES = TYPINGS_SOURCE.split("\n")
  .filter((x): x is typeof x & `+${string}` => x.startsWith("+"))
  .map((x) => x.split(" ", 1)[0].slice(1))

export const BUILT_INS = TYPINGS_SOURCE.split("\n")
  .map((row) => row.split(" ")[0])
  .filter((x): x is Exclude<typeof x, ""> => x != "")
  .filter((x): x is Exclude<typeof x, `+${string}`> => !x.startsWith("+"))
  .filter((item, index, array) => array.indexOf(item) == index)

export const IMPLICIT_FUNCTION_BUILT_INS =
  "arccos arccosh arccot arccoth arccsc arccsch arcsec arcsech arcsin arcsinh arctan arctanh cos cosh cot coth csc csch distance dotplot ln log sec sech sin sinh tan tanh".split(
    " ",
  )
