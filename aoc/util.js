Array.prototype.sum = function (f = (x) => +x) {
  return this.reduce((a, b) => a + f(b), 0)
}

Array.prototype.prod = function (f = (x) => +x) {
  return this.reduce((a, b) => a * f(b), 1)
}

RegExp.prototype.captures = function (text, f = (x) => x.slice(1)) {
  return text.matchAll(this).map(f).toArray()
}

String.prototype.captures = function (regex, f = (x) => x.slice(1)) {
  return this.matchAll(regex).map(f).toArray()
}
