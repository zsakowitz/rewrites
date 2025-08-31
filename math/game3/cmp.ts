export abstract class Cmp {
  abstract le(rhs: this): boolean

  ge(rhs: this): boolean {
    return rhs.le(this)
  }

  lt(rhs: this): boolean {
    return this.le(rhs) && !this.ge(rhs)
  }

  gt(rhs: this): boolean {
    return this.ge(rhs) && !this.le(rhs)
  }

  eq(rhs: this): boolean {
    return this.le(rhs) && this.ge(rhs)
  }

  ne(rhs: this): boolean {
    return !this.eq(rhs)
  }

  fz(rhs: this): boolean {
    return !(this.lt(rhs) || this.gt(rhs) || this.eq(rhs))
  }

  lf(rhs: this): boolean {
    return this.lt(rhs) || this.fz(rhs)
  }

  gf(rhs: this): boolean {
    return this.gt(rhs) || this.fz(rhs)
  }
}
