export type Vector = number[];
export type Derivative = (t: number, x: Vector) => Vector;

function addScaled(a: Vector, b: Vector, scale: number): Vector {
  return a.map((v, i) => v + b[i] * scale);
}

/** Single fixed-step RK4 update, x(t+dt) from x(t). */
export function rk4Step(f: Derivative, t: number, x: Vector, dt: number): Vector {
  const k1 = f(t, x);
  const k2 = f(t + dt / 2, addScaled(x, k1, dt / 2));
  const k3 = f(t + dt / 2, addScaled(x, k2, dt / 2));
  const k4 = f(t + dt, addScaled(x, k3, dt));
  return x.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

export interface Trajectory {
  t: number[];
  x: Vector[];
}

/** Fixed-step RK4 integration over [t0, t1]. */
export function integrate(f: Derivative, x0: Vector, t0: number, t1: number, dt: number): Trajectory {
  const steps = Math.max(1, Math.ceil((t1 - t0) / dt));
  const t: number[] = [t0];
  const x: Vector[] = [x0];
  let tCurrent = t0;
  let xCurrent = x0;
  for (let i = 0; i < steps; i++) {
    const stepDt = Math.min(dt, t1 - tCurrent);
    xCurrent = rk4Step(f, tCurrent, xCurrent, stepDt);
    tCurrent += stepDt;
    t.push(tCurrent);
    x.push(xCurrent);
  }
  return { t, x };
}
