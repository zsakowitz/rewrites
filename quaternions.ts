interface QuaternionLike {
  n: number;
  i: number;
  j: number;
  k: number;
}

type QuaternionTuple = [n: number, i: number, j: number, k: number];

export class Quaternion implements QuaternionLike {
  static from(like: QuaternionLike | QuaternionTuple) {
    if (Array.isArray(like)) {
      return new Quaternion(like[0], like[1], like[2], like[3]);
    }
  }

  static of(text: string) {
    let n = 0;
    let i = 0;
    let j = 0;
    let k = 0;

    for (let part of text.split(/(?=[+-])/g)) {
      part = part.replace(/\s+/g, "");
      const numeric = parseFloat(part);

      if (Number.isNaN(numeric)) {
        continue;
      }

      if (part.endsWith("i")) {
        i = numeric;
      } else if (part.endsWith("j")) {
        j = numeric;
      } else if (part.endsWith("k")) {
        k = numeric;
      } else {
        n = numeric;
      }
    }

    return new Quaternion(n, i, j, k);
  }

  constructor(readonly n = 0, readonly i = 0, readonly j = 0, readonly k = 0) {}

  plus({ n, i, j, k }: QuaternionLike) {
    return new Quaternion(this.n + n, this.i + i, this.j + j, this.k + k);
  }

  minus({ n, i, j, k }: QuaternionLike) {
    return new Quaternion(this.n - n, this.i - i, this.j - j, this.k - k);
  }

  times({ n: on, i: oi, j: oj, k: ok }: QuaternionLike) {
    const { n, i, j, k } = this;

    return new Quaternion(
      n * on - i * oi - j * oj - k * ok,
      n * oi + i * on + j * ok - k * oj,
      n * oj + j * on + k * oi - i * ok,
      n * ok + k * on + i * oj - j * oi
    );
  }

  abs() {
    return Math.hypot(this.n, this.i, this.j, this.k);
  }

  scale(v: number) {
    return new Quaternion(v * this.n, v * this.i, v * this.j, v * this.k);
  }

  normalize() {
    return this.scale(this.abs());
  }
}
