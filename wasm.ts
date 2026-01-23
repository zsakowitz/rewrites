class Memory {
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

export class Source {
    static export<T>(body: (this: Source, value: T) => void, value: T) {
        const self = new Source()
        body.call(self, value)
        return self.memory.export()
    }

    static exportList<T>(body: (this: Source, value: T) => void, value: T[]) {
        const self = new Source()
        self.list(value, body)
        return self.memory.export()
    }

    readonly memory = new Memory()

    byte(v: number) {
        this.memory.byte(v)
    }

    bytes(v: Uint8Array) {
        this.memory.bytes(v)
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

    list<T>(v: T[], encode: (this: Source, value: T) => void) {
        this.int(v.length)

        for (let i = 0; i < v.length; i++) {
            encode.call(this, v[i]!)
        }
    }

    many<T>(v: T[], encode: (this: Source, value: T) => void) {
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

    rectype(v: rectype) {
        if (v.length == 1) {
            this.subtype(v[0]!)
            return
        }

        this.byte(0x4e)
        this.list(v, this.subtype)
    }

    subtype(v: subtype) {
        if (v.final && v.typeuse.length == 0) {
            this.comptype(v.comptype)
            return
        }

        this.byte(v.final ? 0x4f : 0x50)
        this.list(v.typeuse, this.int)
        this.comptype(v.comptype)
    }

    limits(a: addrtype, v: limits) {
        this.byte(
            v.max == null ?
                { i32: 0x00, i64: 0x04 }[a]
            :   { i32: 0x01, i64: 0x05 }[a],
        )

        this.int(v.min)
        if (v.max != null) this.int(v.max)
    }

    tagtype(v: tagtype) {
        this.byte(0x00)
        this.int(v)
    }

    globaltype(v: globaltype) {
        this.valtype(v.type)
        this.mut(v.mut)
    }

    memtype(v: memtype) {
        this.limits(v.at, v.lim)
    }

    tabletype(v: tabletype) {
        this.reftype(v.rt)
        this.limits(v.at, v.lim)
    }

    externtype(v: externtype) {
        switch (v.k) {
            case "func":
                this.byte(0x00)
                this.int(v.v)
                break

            case "table":
                this.byte(0x01)
                this.tabletype(v.v)
                break

            case "mem":
                this.byte(0x02)
                this.memtype(v.v)
                break

            case "global":
                this.byte(0x03)
                this.globaltype(v.v)
                break

            case "tag":
                this.byte(0x04)
                this.tagtype(v.v)
                break
        }
    }

    blocktype(v: blocktype) {
        if (v == null) {
            this.byte(0x40)
        } else if (typeof v == "number") {
            this.int(v)
        } else {
            this.valtype(v)
        }
    }

    instr(v: instr) {
        ;(instr_encoders[v.k] as any).call(this, v.v)
    }

    insts(v: expr) {
        this.many(v, this.instr)
    }

    expr(v: expr) {
        this.many(v, this.instr)
        this.byte(0x0b)
    }

    externidx(v: externidx) {
        this.byte(
            {
                func: 0x00,
                table: 0x01,
                memory: 0x02,
                global: 0x03,
                tag: 0x04,
            }[v.k],
        )
        this.int(v.v)
    }

    section(id: number, body: Uint8Array) {
        this.int(id)
        this.int(body.length)
        this.bytes(body)
    }

    typesec(v: rectype[]) {
        this.section(1, Source.exportList(this.rectype, v))
    }

    importsec(v: import_[]) {
        this.section(2, Source.exportList(this.import, v))
    }

    import(v: import_) {
        this.name(v.nm1)
        this.name(v.nm2)
        this.externtype(v.xt)
    }

    funcsec(v: typeidx[]) {
        this.section(3, Source.exportList(this.int, v))
    }

    memsec(v: mem[]) {
        this.section(5, Source.exportList(this.memtype, v))
    }

    globalsec(v: global[]) {
        this.section(6, Source.exportList(this.global, v))
    }

    global(v: global) {
        this.globaltype(v.gt)
        this.expr(v.e)
    }

    exportsec(v: export_[]) {
        this.section(7, Source.exportList(this.export, v))
    }

    export(v: export_) {
        this.name(v.nm)
        this.externidx(v.xx)
    }

    startsec(v: start) {
        this.section(8, Source.export(this.int, v))
    }

    codesec(v: code[]) {
        this.section(10, Source.exportList(this.code, v))
    }

    code(v: code) {
        const code = Source.export(this.func, v)
        this.int(code.length)
        this.bytes(code)
    }

    func(v: func) {
        this.list(v.loc, this.local)
        this.expr(v.e)
    }

    local(local: valtype) {
        this.int(1)
        this.valtype(local)
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

type rectype = subtype[]

type subtype = {
    final: boolean
    typeuse: typeuse[]
    comptype: comptype
}

type typeuse = typeidx

type addrtype = "i32" | "i64"

type limits = {
    min: bigint
    max: bigint | null
}

type tagtype = typeidx

type globaltype = {
    mut: boolean
    type: valtype
}

type memtype = {
    at: addrtype
    lim: limits
}

type tabletype = {
    at: addrtype
    lim: limits
    rt: reftype
}

type externtype =
    | { k: "func"; v: typeidx }
    | { k: "table"; v: tabletype }
    | { k: "mem"; v: memtype }
    | { k: "global"; v: globaltype }
    | { k: "tag"; v: tagtype }

type blocktype = valtype | typeidx | null

type tagidx = number

type labelidx = number

type funcidx = number

type localidx = number

type globalidx = number

type instr =
    // parametric instructions
    | { k: "unreachable" | "nop" | "drop"; v: null }

    // control instructions
    | { k: "select"; v: valtype[] | null }
    | { k: "block" | "loop"; v: { bt: blocktype; in: expr } }
    | { k: "if"; v: { bt: blocktype; if: expr; else: expr } }
    | { k: "throw"; v: tagidx }
    | { k: "br" | "br_if"; v: labelidx }
    | { k: "return"; v: null }
    | { k: "call"; v: funcidx }

    // variable instructions
    | { k: "local_get" | "local_set" | "local_tee"; v: localidx }
    | { k: "global_get" | "global_set"; v: globalidx }

    // table instructions
    // memory instructions
    // reference instructions

    // aggregate instructions
    | { k: "struct_new"; v: typeidx }
    // | { k: "struct_get" | "struct_set"; v: { ty: typeidx; i: number } }
    // | { k: "array_new"; v: typeidx }

    // numeric instructions
    // vector instructions
    // expressions
    | never

type expr = instr[]

const instr_encoders: {
    [K in instr["k"]]: (this: Source, arg: (instr & { k: K })["v"]) => void
} & { __proto__: never } = {
    __proto__: null!,

    unreachable() {
        this.byte(0x00)
    },
    nop() {
        this.byte(0x01)
    },
    drop() {
        this.byte(0x1a)
    },
    select(ty) {
        if (ty == null) {
            this.byte(0x1b)
        } else {
            this.byte(0x1c)
            this.list(ty, this.valtype)
        }
    },

    block(v) {
        this.byte(0x02)
        this.blocktype(v.bt)
        this.insts(v.in)
        this.byte(0x0b)
    },
    loop(v) {
        this.byte(0x03)
        this.blocktype(v.bt)
        this.insts(v.in)
        this.byte(0x0b)
    },
    if(v) {
        this.byte(0x04)
        this.blocktype(v.bt)
        this.insts(v.if)
        if (v.else.length) {
            this.byte(0x05)
            this.insts(v.else)
        }
        this.byte(0x0b)
    },
    throw(v) {
        this.byte(0x08)
        this.int(v)
    },
    br(v) {
        this.byte(0x0c)
        this.int(v)
    },
    br_if(v) {
        this.byte(0x0c)
        this.int(v)
    },
    return() {
        this.byte(0x0f)
    },
    call(v) {
        this.byte(0x10)
        this.int(v)
    },

    local_get(arg) {
        this.byte(0x20)
        this.int(arg)
    },
    local_set(arg) {
        this.byte(0x21)
        this.int(arg)
    },
    local_tee(arg) {
        this.byte(0x22)
        this.int(arg)
    },
    global_get(arg) {
        this.byte(0x23)
        this.int(arg)
    },
    global_set(arg) {
        this.byte(0x24)
        this.int(arg)
    },

    struct_new(arg) {
        this.byte(0xfb)
        this.int(0)
        this.int(arg)
    },
}

type externidx =
    | { k: "func"; v: funcidx }
    | { k: "table"; v: tableidx }
    | { k: "memory"; v: memidx }
    | { k: "global"; v: globalidx }
    | { k: "tag"; v: tagidx }

type tableidx = number

type memidx = number

type import_ = {
    nm1: string
    nm2: string
    xt: externtype
}

type mem = memtype

type global = {
    gt: globaltype
    e: expr
}

type export_ = {
    nm: string
    xx: externidx
}

type start = funcidx

type func = {
    loc: valtype[]
    e: expr
}

type code = func
