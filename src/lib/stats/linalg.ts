/**
 * Minimal dense linear algebra for least-squares team ratings.
 * Systems here are small (one unknown per team in a division, typically 10–80), so O(n³) is fine.
 */

export type Matrix = number[][];
export type Vector = number[];

function at(m: Matrix, i: number, j: number): number {
  return m[i]?.[j] ?? 0;
}

/** AᵀA for an m×n matrix A. */
export function gram(a: Matrix, n: number): Matrix {
  const out: Matrix = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (const row of a) {
    for (let i = 0; i < n; i++) {
      const ri = row[i] ?? 0;
      if (ri === 0) continue;
      const outRow = out[i] as number[];
      for (let j = 0; j < n; j++) outRow[j] = (outRow[j] ?? 0) + ri * (row[j] ?? 0);
    }
  }
  return out;
}

/** Aᵀb for an m×n matrix A and length-m vector b. */
export function transposeTimes(a: Matrix, b: Vector, n: number): Vector {
  const out = new Array<number>(n).fill(0);
  a.forEach((row, r) => {
    const br = b[r] ?? 0;
    for (let i = 0; i < n; i++) out[i] = (out[i] ?? 0) + (row[i] ?? 0) * br;
  });
  return out;
}

/**
 * Solves Mx = b for symmetric positive-definite M via Cholesky (M = LLᵀ).
 * Returns null if M is not (numerically) positive definite.
 */
export function choleskySolve(m: Matrix, b: Vector): Vector | null {
  const n = b.length;
  const l: Matrix = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = at(m, i, j);
      for (let k = 0; k < j; k++) sum -= at(l, i, k) * at(l, j, k);
      if (i === j) {
        if (sum <= 1e-12) return null;
        (l[i] as number[])[j] = Math.sqrt(sum);
      } else {
        (l[i] as number[])[j] = sum / at(l, j, j);
      }
    }
  }
  // Forward substitution: Ly = b
  const y = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = b[i] ?? 0;
    for (let k = 0; k < i; k++) sum -= at(l, i, k) * (y[k] ?? 0);
    y[i] = sum / at(l, i, i);
  }
  // Back substitution: Lᵀx = y
  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = y[i] ?? 0;
    for (let k = i + 1; k < n; k++) sum -= at(l, k, i) * (x[k] ?? 0);
    x[i] = sum / at(l, i, i);
  }
  return x;
}

/** Gaussian elimination with partial pivoting. Returns null for singular systems. */
export function gaussianSolve(m: Matrix, b: Vector): Vector | null {
  const n = b.length;
  const a = m.map((row, i) => [...row.slice(0, n), b[i] ?? 0]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(at(a, r, col)) > Math.abs(at(a, pivot, col))) pivot = r;
    if (Math.abs(at(a, pivot, col)) < 1e-12) return null;
    [a[col], a[pivot]] = [a[pivot] as number[], a[col] as number[]];
    const pivotRow = a[col] as number[];
    for (let r = col + 1; r < n; r++) {
      const row = a[r] as number[];
      const factor = (row[col] ?? 0) / (pivotRow[col] ?? 1);
      for (let c = col; c <= n; c++) row[c] = (row[c] ?? 0) - factor * (pivotRow[c] ?? 0);
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = at(a, i, n);
    for (let k = i + 1; k < n; k++) sum -= at(a, i, k) * (x[k] ?? 0);
    x[i] = sum / at(a, i, i);
  }
  return x;
}

/**
 * Least-squares solution of Ax ≈ b via the normal equations (AᵀA)x = Aᵀb.
 * A tiny ridge term keeps the system solvable early in an event, when some teams have
 * played only once or always with the same partner (otherwise AᵀA is singular).
 */
export function leastSquares(a: Matrix, b: Vector, n: number, ridge = 1e-6): Vector {
  const ata = gram(a, n);
  for (let i = 0; i < n; i++) (ata[i] as number[])[i] = at(ata, i, i) + ridge;
  const atb = transposeTimes(a, b, n);
  return choleskySolve(ata, atb) ?? gaussianSolve(ata, atb) ?? new Array<number>(n).fill(0);
}
