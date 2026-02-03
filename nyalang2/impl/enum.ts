import type { IdGlobal } from "./id"
import type { Param } from "./param"
import type { Ty } from "./ty"

class Enum {
    constructor(
        readonly id: IdGlobal,
        readonly params: Param[],
        readonly fields: { name: IdGlobal; ty: Ty }[],
    ) {}
}

// enums are not allowed to have 'where' clauses, since you can always just
// specify them in function definitions themselves
function defineEnum(
    id: IdGlobal,
    params: Param[],
    fields: { name: IdGlobal; ty: Ty }[],
) {}
