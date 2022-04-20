export function once<F extends (...args: any) => any>(cb: F): F {
  let called = false;

  function wrapper(...args: any) {
    if (called) return;
    called = true;

    return cb(...args);
  }

  return wrapper as F;
}
