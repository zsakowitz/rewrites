class MemoryRaw {
    private raw: number[] = []

    byte(byte: number) {
        this.raw.push(byte)
    }

    bytes(bytes: Uint8Array) {
        this.raw.push(...bytes)
    }

    export() {
        return new Uint8Array(this.raw)
    }

    export16() {
        return Array.from(this.export())
            .map((x) => x.toString(16).padStart(2, "0"))
            .join(" ")
    }
}

const encoder = new TextEncoder()

class Memory {
    readonly raw = new MemoryRaw()

    byte(v: number) {
        this.raw.byte(v)
    }

    bytes(v: Uint8Array) {
        this.raw.bytes(v)
    }

    //! https://en.wikipedia.org/wiki/LEB128#JavaScript_code
    int(v: number | bigint) {
        v = BigInt(v)
        while (true) {
            const low = Number(v & 0x7fn)
            v >>= 7n

            if ((!v && !(low & 0x40)) || (v === -1n && low & 0x40)) {
                this.byte(low)
                return
            }
            this.byte(low | 0x80)
        }
    }

    list<T>(v: T[], encode: (this: Memory, value: T) => void) {
        this.int(v.length)

        for (let i = 0; i < v.length; i++) {
            encode.call(this, v[i]!)
        }
    }

    f32(v: number) {
        const mem = new DataView(new ArrayBuffer(4))
        mem.setFloat32(0, v, true)
        this.bytes(new Uint8Array(mem.buffer))
    }

    f64(v: number) {
        const mem = new DataView(new ArrayBuffer(8))
        mem.setFloat64(0, v, true)
        this.bytes(new Uint8Array(mem.buffer))
    }

    name(v: string) {
        const ret = encoder.encode(v)
        this.bytes(ret)
    }

    numtype(v: numtype) {
        this.byte(
            {
                f64: 0x7c,
                f32: 0x7d,
                i64: 0x7e,
                i32: 0x7f,
            }[v],
        )
    }

    vectype(v: vectype) {
        this.byte(0x7b)
    }

    absheaptype(v: absheaptype) {
        this.byte(
            {
                exn: 0x69,
                array: 0x6a,
                struct: 0x6b,
                i31: 0x6c,
                eq: 0x6d,
                any: 0x6e,
                extern: 0x6f,
                func: 0x70,
                none: 0x71,
                noextern: 0x72,
                nofunc: 0x73,
                noexn: 0x74,
            }[v],
        )
    }

    heaptype(v: heaptype) {
        if (typeof v == "number") {
            this.int(v)
        } else {
            this.absheaptype(v)
        }
    }

    reftype(v: reftype) {
        if (v.null && typeof v.ht == "string") {
            this.absheaptype(v.ht)
        } else {
            this.byte(v.null ? 0x63 : 0x64)
            this.heaptype(v.ht)
        }
    }

    valtype(v: valtype) {
        if (v == "v128") {
            this.vectype(v)
        } else if (typeof v == "string") {
            this.numtype(v)
        } else {
            this.reftype(v)
        }
    }

    resulttype(v: resulttype) {
        this.list(v, this.valtype)
    }

    mut(v: boolean) {
        this.byte(v ? 0x01 : 0x00)
    }

    comptype(v: comptype) {
        switch (v.k) {
            case "array":
                this.byte(0x5e)
                this.fieldtype(v.v)
                break

            case "struct":
                this.byte(0x5f)
                this.list(v.v, this.fieldtype)
                break

            case "func":
                this.byte(0x60)
                this.resulttype(v.v.p)
                this.resulttype(v.v.r)
        }
    }

    fieldtype(v: fieldtype) {
        this.storagetype(v.zt)
        this.mut(v.mut)
    }

    storagetype(v: valtype | packtype) {
        if (v == "i8" || v == "i16") {
            this.packtype(v)
        } else {
            this.valtype(v)
        }
    }

    packtype(v: packtype) {
        this.byte(
            {
                i16: 0x77,
                i8: 0x78,
            }[v],
        )
    }
}

type numtype = "i32" | "i64" | "f32" | "f64"

type vectype = "v128"

type absheaptype =
    | "exn"
    | "array"
    | "struct"
    | "i31"
    | "eq"
    | "any"
    | "extern"
    | "func"
    | "none"
    | "noextern"
    | "nofunc"
    | "noexn"

type heaptype = absheaptype | typeidx

type typeidx = number

type reftype = {
    null: boolean
    ht: heaptype
}

type valtype = numtype | vectype | reftype

type resulttype = valtype[]

type comptype =
    | { k: "array"; v: fieldtype }
    | { k: "struct"; v: fieldtype[] }
    | { k: "func"; v: { p: resulttype; r: resulttype } }

type fieldtype = {
    mut: boolean
    zt: valtype | packtype
}

type packtype = "i8" | "i16"
