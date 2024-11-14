const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

/**
 * There are two types of encodable types: **overwritable** and **dynamically
 * sized**.
 *
 * **Overwritable** types take up a fixed amount of size once encoded. Thus, the
 * following algorithm is well-defined to overwrite `a` with `b` without
 * interfering with other data.
 *
 * 1. Record the address of the encoder
 * 2. Write the value `a` using an overwritable algorithm
 * 3. Perform any other operations
 * 4. Move to the address recorded in (1)
 * 5. Write the value `b` using the same algorithm as in (2)
 *
 * **Dynamically sized** types, on the other hand, do not use a fixed amount of
 * space. Writing a dynamically sized type twice may overwrite or corrupt other
 * data.
 */
export abstract class Encoder<T> {
  abstract addr(): T
  abstract setAddr(addr: T): void

  /** Overwritable */
  abstract bit(bit: boolean): void

  /** Overwritable */
  abstract byte(byte: number): void

  /** Overwritable when `bytes.length` is constant */
  abstract bytes(bytes: Uint8Array): void

  /** Dynamically sized */
  writeU32(val: number) {
    const buf = new ArrayBuffer(4)
    new DataView(buf).setUint32(0, val)
    const arr = new Uint8Array(buf)

    let index = arr.findIndex((x) => x != 0)
    if (index == -1) index = arr.length

    for (let i = index; i < arr.length; i++) {
      this.byte(arr[i]!)
      this.bit(true)
    }
    this.bit(false)
  }

  /** Dynamically sized */
  writeU64(val: bigint) {
    const buf = new ArrayBuffer(8)
    new DataView(buf).setBigUint64(0, val)
    const arr = new Uint8Array(buf)

    let index = arr.findIndex((x) => x != 0)
    if (index == -1) index = arr.length

    for (let i = index; i < arr.length; i++) {
      this.byte(arr[i]!)
      this.bit(true)
    }
    this.bit(false)
  }

  /** Dynamically sized */
  writeStr(val: string) {
    const bytes = textEncoder.encode(val)
    this.writeU32(bytes.length)
    this.bytes(bytes)
  }

  /** Dynamically sized */
  writeOpt<T>(val: T | null | undefined, ok: (this: this, val: T) => void) {
    if (val == null) {
      this.bit(false)
    } else {
      this.bit(true)
      ok.call(this, val)
    }
  }

  /** Dynamically sized */
  writeArr<T>(val: readonly T[], cb: (this: this, val: T) => void) {
    this.writeU32(val.length)
    for (let i = 0; i < val.length; i++) {
      cb.call(this, val[i]!)
    }
  }
}

export abstract class Decoder<T> {
  abstract bit(): boolean
  abstract byte(): number
  abstract bytes(amount: number): Uint8Array
  abstract addr(): T
  abstract setAddr(addr: T): void

  readU32() {
    let val = 0
    while (this.bit()) {
      val = (val << 8) + this.byte()
    }
    return val
  }

  readU64() {
    let val = 0n
    while (this.bit()) {
      val = (val << 8n) + BigInt(this.byte())
    }
    return val
  }

  readStr() {
    const len = this.readU32()
    const bytes = this.bytes(len)
    return textDecoder.decode(bytes)
  }

  readOpt<T>(ok: (this: this) => T): T | null {
    if (this.bit()) {
      return ok.call(this)
    } else {
      return null
    }
  }

  readArr<T>(cb: (this: this) => T): T[] {
    return Array.from({ length: this.readU32() }, cb, this)
  }
}

export class VecU8 {
  private arr
  private len = 0
  private idx = 0

  constructor(arr?: Uint8Array) {
    this.arr = arr ?? new Uint8Array()
  }

  reserve(space: number): void {
    if (this.idx + space > this.arr.length) {
      const next = new Uint8Array(
        Math.max(
          this.arr.length + space,
          this.arr.length ? 2 * this.arr.length : 1,
        ),
      )

      next.set(this.arr)

      this.arr = next
    }
  }

  push(value: number): void {
    this.reserve(1)
    this.arr[this.idx++] = value
  }

  pushAll(values: Uint8Array) {
    this.reserve(values.length)
    this.arr.set(values, this.idx)
    this.idx += values.length
  }

  peek(): number {
    return this.arr[this.idx] ?? 0
  }

  read(): number {
    return this.arr[this.idx++] ?? 0
  }

  readAll(length: number): Uint8Array {
    const value = this.arr.subarray(this.idx, this.idx + length)
    this.idx += length
    return value
  }

  addr(): number {
    return this.idx
  }

  setAddr(addr: number): void {
    this.idx = addr
  }

  data() {
    return this.arr.subarray(0, this.len)
  }
}

export class VecBit {
  private readonly vec
  private spaceLeft = 0

  constructor(arr?: Uint8Array) {
    this.vec = new VecU8(arr)
  }

  push(bit: boolean) {
    if (this.spaceLeft == 0) {
      this.vec.reserve(1)
      this.vec.push(+bit << 7)
      this.spaceLeft = 7
    } else {
      ;(this.vec as any).arr[(this.vec as any).idx - 1]! +=
        +bit << --this.spaceLeft
    }
  }

  read(): boolean {
    if (this.spaceLeft == 0) {
      this.spaceLeft = 7
      return !!(this.vec.read() & 0b1000_0000)
    }

    return !!(
      (this.vec as any).arr[(this.vec as any).idx - 1] &
      (1 << --this.spaceLeft)
    )
  }

  /** Not necessarily in increasing order. */
  addr(): number {
    return 8 * this.vec.addr() + this.spaceLeft
  }

  setAddr(addr: number) {
    this.vec.setAddr(Math.floor(addr / 8))
    this.spaceLeft = addr % 8
  }
}

export class DualArrayEncoder extends Encoder<[number, number]> {
  private readonly u8s = new VecU8()
  private readonly bits = new VecBit()

  addr(): [number, number] {
    return [this.u8s.addr(), this.bits.addr()]
  }

  setAddr(addr: [number, number]): void {
    this.u8s.setAddr(addr[0])
    this.bits.setAddr(addr[1])
  }

  bit(bit: boolean): void {
    this.bits.push(bit)
  }

  byte(byte: number): void {
    this.u8s.push(byte)
  }

  bytes(bytes: Uint8Array): void {
    this.u8s.pushAll(bytes)
  }
}

export class DualArrayDecoder extends Decoder<[number, number]> {
  private readonly u8s
  private readonly bits

  constructor(u8: Uint8Array, bits: Uint8Array) {
    super()
    this.u8s = new VecU8(u8)
    this.bits = new VecBit(bits)
  }

  addr(): [number, number] {
    return [this.u8s.addr(), this.bits.addr()]
  }

  setAddr(addr: [number, number]): void {
    this.u8s.setAddr(addr[0])
    this.bits.setAddr(addr[1])
  }

  bit(): boolean {
    return this.bits.read()
  }

  byte(): number {
    return this.u8s.read()
  }

  bytes(amount: number): Uint8Array {
    return this.u8s.readAll(amount)
  }
}
