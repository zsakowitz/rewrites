type Extension<State> = (state: State) => void | PromiseLike<void>;

interface FacetConfig<State, Input, Output = readonly Input[]> {
  combine?(value: readonly Input[]): Output;
  compare?(a: Output, b: Output): boolean;
  compareInput?(a: Input, b: Input): boolean;
  toExtension(value: Output): Extension<State>;
  enables?: Extension<State>;
}

class Facet<State, Input, Output = readonly Input[]>
  implements FacetConfig<State, Input, Output>
{
  combine: (value: readonly Input[]) => Output;
  compare: (a: Output, b: Output) => boolean;
  compareInput: (a: Input, b: Input) => boolean;
  toExtension: (value: Output) => Extension<State>;
  enables?: Extension<State>;

  constructor(config: FacetConfig<State, Input, Output>) {
    this.combine = config.combine || ((value) => value as Output);
    this.compare = config.compare || ((a, b) => a === b);
    this.compareInput = config.compareInput || ((a, b) => a === b);
    this.toExtension = config.toExtension;
    this.enables = config.enables;
  }
}
