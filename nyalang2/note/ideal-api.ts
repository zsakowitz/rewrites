declare class Type {
  private __brand
}

declare class Value {
  private __brand

  get type(): Type

  as(type: Type): Value
}

declare class API {
  private __brand

  ty(name: string): Type | null
  call(name: string, ...args: Value[]): Value // this will probably require a block
}

declare const lib: API

declare const somevaluegottenfromcalculator: Value

// idk exactly how this would work
lib.call("display", somevaluegottenfromcalculator).as(lib.ty("latex")!) // performs coercion if needed
