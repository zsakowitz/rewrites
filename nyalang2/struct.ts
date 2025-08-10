import type { IdGlobal } from "./id"
import type { Param } from "./param"
import type { Ty } from "./ty"

// structs are not allowed to have 'where' clauses, since you can always just
// specify them in function definitions themselves
function defineStruct(
  id: IdGlobal,
  params: Param[],
  fields: { name: IdGlobal; ty: Ty }[],
) {}
