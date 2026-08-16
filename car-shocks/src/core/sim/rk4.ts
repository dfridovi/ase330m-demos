export type Derivative<S> = (t: number, state: S) => S;
export type Combine<S> = (a: S, b: S, scale: number) => S;

// Generic single-step RK4: state_{n+1} = state_n + (dt/6)(k1 + 2k2 + 2k3 + k4).
// `combine(a, b, scale)` must return `a + scale * b` for the state type S.
export function rk4Step<S>(
  deriv: Derivative<S>,
  t: number,
  state: S,
  dt: number,
  combine: Combine<S>,
): S {
  const k1 = deriv(t, state);
  const k2 = deriv(t + dt / 2, combine(state, k1, dt / 2));
  const k3 = deriv(t + dt / 2, combine(state, k2, dt / 2));
  const k4 = deriv(t + dt, combine(state, k3, dt));

  // k1 + 2*k2 + 2*k3 + k4
  const sum = combine(combine(combine(k1, k2, 2), k3, 2), k4, 1);
  return combine(state, sum, dt / 6);
}
