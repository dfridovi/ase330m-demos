const T0 = 288.15; // K, sea-level standard temperature
const P0 = 101325; // Pa, sea-level standard pressure
const LAPSE_RATE = 0.0065; // K/m, troposphere lapse rate
const R_SPECIFIC = 287.05; // J/(kg K), specific gas constant for dry air
export const GRAVITY = 9.80665; // m/s^2

/** ISA air density (troposphere model, valid below ~11 km). */
export function airDensity(altitude: number): number {
  const temperature = T0 - LAPSE_RATE * altitude;
  const pressure = P0 * Math.pow(temperature / T0, GRAVITY / (R_SPECIFIC * LAPSE_RATE));
  return pressure / (R_SPECIFIC * temperature);
}
