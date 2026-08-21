/** Central-difference Jacobian of f at x, used only to cross-check analytic Jacobians in tests --
 * see the plan's two-level Jacobian verification (analytic vs. FD of the continuous dynamics,
 * and the composed discrete step vs. FD of the whole RK4 step). Never used inside the solver
 * itself, which uses the analytic Jacobians for speed. */
export function fdJacobian(f: (v: number[]) => number[], x: number[], h = 1e-6): number[][] {
  const n = x.length;
  const cols: number[][] = [];
  for (let j = 0; j < n; j++) {
    const xPlus = [...x];
    const xMinus = [...x];
    xPlus[j] += h;
    xMinus[j] -= h;
    const fPlus = f(xPlus);
    const fMinus = f(xMinus);
    cols.push(fPlus.map((v, i) => (v - fMinus[i]) / (2 * h)));
  }
  const m = cols[0].length;
  return Array.from({ length: m }, (_, i) => cols.map((col) => col[i]));
}

/** Central second-difference Hessian of a scalar function f at x -- for cross-checking analytic
 * cost Hessians (lxx, luu) directly against the cost value, independent of the analytic
 * gradient. */
export function fdHessian(f: (v: number[]) => number, x: number[], h = 1e-3): number[][] {
  const n = x.length;
  const H = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const pp = [...x];
      pp[i] += h;
      pp[j] += h;
      const pm = [...x];
      pm[i] += h;
      pm[j] -= h;
      const mp = [...x];
      mp[i] -= h;
      mp[j] += h;
      const mm = [...x];
      mm[i] -= h;
      mm[j] -= h;
      H[i][j] = (f(pp) - f(pm) - f(mp) + f(mm)) / (4 * h * h);
    }
  }
  return H;
}
