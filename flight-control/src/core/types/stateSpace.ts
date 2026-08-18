export interface StateSpace {
  A: number[][];
  B: number[][];
  C: number[][];
  D: number[][];
  stateLabels: string[];
  inputLabels: string[];
  outputLabels: string[];
}
