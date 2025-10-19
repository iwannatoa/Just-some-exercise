function hasChanged(x: unknown, y: unknown): boolean {
  if (x === y) {
    // +0/-0
    return x === 0 && 1 / x !== 1 / y;
  } else {
    // NaN
    return !Number.isNaN(x) || !Number.isNaN(y);
  }
}
