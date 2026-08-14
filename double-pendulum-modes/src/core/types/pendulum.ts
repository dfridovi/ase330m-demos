/** Physical parameters of a double pendulum: two point masses on massless rods. */
export interface PhysicalParams {
  m1: number; // kg, mass of the first (inner) bob
  m2: number; // kg, mass of the second (outer) bob
  l1: number; // m, length of the first rod
  l2: number; // m, length of the second rod
  g: number; // m/s^2, gravitational acceleration
}
