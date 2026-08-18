import { EigenvalueDecomposition, Matrix } from 'ml-matrix';

export interface Complex {
  re: number;
  im: number;
}

export interface EigenDecomposition {
  /** Eigenvalues in the order returned by the underlying real-Schur decomposition. */
  eigenvalues: Complex[];
  /** Column i is the (possibly complex, encoded as re/im columns) eigenvector for eigenvalues[i]. */
  eigenvectorMatrixReal: number[][];
  /** For a complex-conjugate pair at indices i, i+1, this holds the imaginary part of the
   * eigenvector for index i (and its negation for i+1); zero for real eigenvalues. */
  eigenvectorMatrixImag: number[][];
}

/** Eigendecomposition of a small real, possibly non-symmetric, square matrix. */
export function eigenDecompose(matrix: number[][]): EigenDecomposition {
  const decomposition = new EigenvalueDecomposition(new Matrix(matrix));
  const n = matrix.length;
  const realParts = decomposition.realEigenvalues;
  const imagParts = decomposition.imaginaryEigenvalues;
  const eigenvalues: Complex[] = realParts.map((re, i) => ({ re, im: imagParts[i] }));

  const vReal = decomposition.eigenvectorMatrix.to2DArray();
  const vImag: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  // ml-matrix packs complex-conjugate eigenvector pairs as [Re(v), Im(v)] in adjacent
  // columns (standard real-Schur convention): column i holds Re(v), column i+1 holds Im(v),
  // and eigenvalues[i+1] = conj(eigenvalues[i]).
  for (let i = 0; i < n; i++) {
    if (imagParts[i] > 0) {
      for (let row = 0; row < n; row++) {
        vImag[row][i] = vReal[row][i + 1];
        vImag[row][i + 1] = -vReal[row][i + 1];
        vReal[row][i + 1] = vReal[row][i];
      }
    }
  }

  return { eigenvalues, eigenvectorMatrixReal: vReal, eigenvectorMatrixImag: vImag };
}
