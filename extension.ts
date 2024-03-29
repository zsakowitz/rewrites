// An implementation of the new Facet library for CodeMirror v6. #rewrite

export interface Extension<State> {
  (state: State): void | PromiseLike<void>
}

export interface FacetConfig<State, Input, Output = readonly Input[]> {
  combine?(value: readonly Input[]): Output
  compare?(a: Output, b: Output): boolean
  compareInput?(a: Input, b: Input): boolean
  toExtension(value: Output): Extension<State>
  enables?: Extension<State>
}

export class Facet<State, Input, Output = readonly Input[]> {
  combine: (values: readonly Input[]) => Output
  compare: (a: Output, b: Output) => boolean
  compareInput: (a: Input, b: Input) => boolean
  toExtension: (value: Output) => Extension<State>
  enables?: Extension<State>

  constructor(config: FacetConfig<State, Input, Output>) {
    this.combine = config.combine || ((values) => values as unknown as Output)
    this.compare = config.compare || ((a, b) => a === b)
    this.compareInput = config.compareInput || ((a, b) => a === b)
    this.toExtension = config.toExtension
    this.enables = config.enables
  }

  of(value: Input): Extension<State> {
    return this.toExtension(this.combine([value]))
  }

  compute(
    deps: (Facet<State, any, any> | Field<State, any>)[],
    get: (state: State) => Input,
  ): Extension<State> {
    return (state) => {}
  }
}

export class Field<State, Value> {}
