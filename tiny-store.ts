// A simple signal, effect, memo, and computed library based on SolidJS.

let currentScope: Effect;

class Effect {
  constructor(readonly u: () => void) {}

  r() {
    const parent = currentScope;
    currentScope = this;
    this.u();
    currentScope = parent;
  }
}

export function createEffect(update: () => void) {
  new Effect(update).r();
}

export function createSignal<T>(value: T) {
  const tracking = new Set<Effect>();

  const get = () => {
    if (currentScope) {
      tracking.add(currentScope);
    }

    return value;
  };

  const set = (val: T) => {
    value = val;

    tracking.forEach((effect) => effect.r());
  };

  return [get, set] as const;
}

export function createMemo<T>(compute: () => T) {
  const [get, set] = createSignal(null! as T);
  createEffect(() => set(compute()));
  return get;
}

export function createComputed<T>(value: T, compute: (oldValue: T) => T) {
  const [get, set] = createSignal(null! as T);
  createEffect(() => set((value = compute(value))));
  return get;
}
