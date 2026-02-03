import {
    Source,
    type fieldtype,
    type func,
    type instr,
    type localidx,
    type module,
    type packtype,
    type reftype,
    type resulttype,
    type valtype,
} from "./wasm-compile"

export class Module {
    readonly t = new Types()

    readonly raw: module = {
        type: (this.t as unknown as { type: module["type"] }).type,
        import: [],
        func: [],
        mem: [],
        global: [],
        export: [],
        start: null,
        code: [],
    }

    compile() {
        return WebAssembly.compile(
            Source.export(Source.prototype.module, this["raw"]),
        )
    }

    instantiate(imports?: Record<string, any>) {
        return WebAssembly.instantiate(
            Source.export(Source.prototype.module, this["raw"]),
            imports,
        )
    }

    func() {
        return new Func(this)
    }
}

export type fieldlike = fieldtype | valtype | packtype

function fieldlike(f: fieldlike): fieldtype {
    if (typeof f == "object" && "mut" in f) {
        return f
    }
    return { mut: false, zt: f }
}

export type resultlike = resulttype | valtype | null | undefined

function resultlike(f: resultlike): resulttype {
    if (f == null) {
        return []
    } else if (Array.isArray(f)) {
        return f
    } else {
        return [f]
    }
}

class Types {
    private type: module["type"] = []
    private next = 0

    struct(...fields: fieldlike[]): reftype<number> {
        this.type.push([
            {
                final: true,
                typeuse: [],
                comptype: { k: "struct", v: fields.map(fieldlike) },
            },
        ])

        return { null: false, ht: this.next++ }
    }

    array(field: fieldlike): reftype<number> {
        this.type.push([
            {
                final: true,
                typeuse: [],
                comptype: { k: "array", v: fieldlike(field) },
            },
        ])

        return { null: false, ht: this.next++ }
    }

    func(p?: resultlike, r?: resultlike): reftype<number> {
        this.type.push([
            {
                final: true,
                typeuse: [],
                comptype: {
                    k: "func",
                    v: {
                        p: resultlike(p),
                        r: resultlike(r),
                    },
                },
            },
        ])

        return { null: false, ht: this.next++ }
    }
}

class Func {
    private func: func = { loc: [], e: [] }
    private p: resulttype = []
    private r: resulttype = []
    private _i: number

    constructor(private readonly mod: Module) {
        const reftype = mod.t.func(this.p, this.r)
        this._i = mod["raw"].func.push(reftype.ht as number) - 1
        mod["raw"].code.push(this.func)
    }

    func_param(ty: valtype) {
        if (this.func.loc.length) {
            throw new Error("cannot specify parameters after locals")
        }

        this.p.push(ty)
        return this
    }

    func_result(ty: valtype) {
        this.r.push(ty)
        return this
    }

    func_local(ty: valtype): localidx {
        this.func.loc.push(ty)
        return this.p.length + this.func.loc.length - 1
    }

    i(instr: instr) {
        this.func.e.push(instr)
        return this
    }

    func_export(name: string) {
        this.mod["raw"].export.push({
            nm: name,
            xx: {
                k: "func",
                v: this._i,
            },
        })
        return this
    }

    local_get(idx: localidx) {
        this.i({ k: "local_get", v: idx })
        return this
    }

    struct_new(type: reftype<number>, args?: instr[]) {
        this.i({ k: "struct_new", v: type.ht })
        return this
    }
}
