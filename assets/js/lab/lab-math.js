// ==========================================================================
// MATRIZANDO — Núcleo Matemático do Laboratório de Matrizes (Corpo ℝ)
// ==========================================================================

window.MatrixLabMath = (() => {
  const clone = A => A.map(row => [...row]);
  const fmt = n => (Math.abs(n) < 1e-10 ? '0' : Number(n.toFixed(5)).toString());

  const assertMatrix = A => {
    if (!Array.isArray(A) || !A.length || !Array.isArray(A[0]) || !A[0].length) {
      throw new Error('Informe uma matriz válida.');
    }
    const cols = A[0].length;
    if (!A.every(r => Array.isArray(r) && r.length === cols && r.every(Number.isFinite))) {
      throw new Error('A matriz possui valores inválidos ou linhas de tamanhos diferentes.');
    }
  };

  function add(A, B, sign = 1) {
    assertMatrix(A);
    assertMatrix(B);
    if (A.length !== B.length || A[0].length !== B[0].length) {
      throw new Error('Para somar ou subtrair, as matrizes precisam ter a mesma dimensão.');
    }
    return A.map((row, i) => row.map((v, j) => v + sign * B[i][j]));
  }

  function multiply(A, B) {
    assertMatrix(A);
    assertMatrix(B);
    if (A[0].length !== B.length) {
      throw new Error(`Incompatível: A tem ${A[0].length} coluna(s), mas B tem ${B.length} linha(s).`);
    }
    return A.map(row =>
      B[0].map((_, j) => row.reduce((sum, v, k) => sum + v * B[k][j], 0))
    );
  }

  function transpose(A) {
    assertMatrix(A);
    return A[0].map((_, c) => A.map(row => row[c]));
  }

  function determinant(A) {
    assertMatrix(A);
    if (A.length !== A[0].length) {
      throw new Error('O determinante só existe para matrizes quadradas.');
    }
    const M = clone(A);
    const n = M.length;
    let det = 1;
    let sign = 1;
    const steps = [];

    for (let col = 0; col < n; col++) {
      let pivot = col;
      for (let r = col + 1; r < n; r++) {
        if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
      }
      if (Math.abs(M[pivot][col]) < 1e-10) {
        return {
          value: 0,
          steps: [...steps, `A coluna ${col + 1} não possui pivô não nulo; logo det(A) = 0.`]
        };
      }
      if (pivot !== col) {
        [M[pivot], M[col]] = [M[col], M[pivot]];
        sign *= -1;
        steps.push(`Troca L${col + 1} ↔ L${pivot + 1}: o sinal do determinante inverte.`);
      }
      const p = M[col][col];
      det *= p;
      steps.push(`Pivô da coluna ${col + 1}: ${fmt(p)}.`);
      for (let r = col + 1; r < n; r++) {
        const factor = M[r][col] / p;
        for (let c = col; c < n; c++) {
          M[r][c] -= factor * M[col][c];
        }
        if (Math.abs(factor) > 1e-10) {
          steps.push(`L${r + 1} ← L${r + 1} − (${fmt(factor)}) · L${col + 1}.`);
        }
      }
    }
    return { value: sign * det, steps };
  }

  function inverse(A) {
    assertMatrix(A);
    const n = A.length;
    if (A[0].length !== n) {
      throw new Error('A matriz inversa só existe para matrizes quadradas.');
    }
    const det = determinant(A);
    if (Math.abs(det.value) < 1e-10) {
      throw new Error('Esta matriz é singular (det(A) = 0) e portanto não possui inversa.');
    }

    const M = A.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
    const steps = ['Montamos a matriz aumentada [A | I].'];

    for (let col = 0; col < n; col++) {
      let pivot = col;
      for (let r = col + 1; r < n; r++) {
        if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
      }
      if (pivot !== col) {
        [M[pivot], M[col]] = [M[col], M[pivot]];
        steps.push(`Trocar L${col + 1} ↔ L${pivot + 1}.`);
      }
      const p = M[col][col];
      for (let c = 0; c < 2 * n; c++) M[col][c] /= p;
      steps.push(`Normalizar pivô: L${col + 1} ← L${col + 1} ÷ ${fmt(p)}.`);

      for (let r = 0; r < n; r++) {
        if (r !== col) {
          const factor = M[r][col];
          if (Math.abs(factor) > 1e-10) {
            for (let c = 0; c < 2 * n; c++) M[r][c] -= factor * M[col][c];
            steps.push(`Zerar posição (${r + 1}, ${col + 1}): L${r + 1} ← L${r + 1} − (${fmt(factor)}) · L${col + 1}.`);
          }
        }
      }
    }

    return {
      value: M.map(row => row.slice(n).map(v => (Math.abs(v) < 1e-10 ? 0 : v))),
      steps,
      determinant: det.value
    };
  }

  function gauss(A, b) {
    assertMatrix(A);
    const n = A.length;
    if (A[0].length !== n || b.length !== n) {
      throw new Error('Informe n equações e n incógnitas.');
    }

    const M = A.map((row, i) => [...row, b[i]]);
    const steps = ['Matriz aumentada inicial [A | b].'];
    let pivotRow = 0;
    const pivotCols = [];

    for (let col = 0; col < n && pivotRow < n; col++) {
      let pivot = pivotRow;
      for (let r = pivotRow + 1; r < n; r++) {
        if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
      }
      if (Math.abs(M[pivot][col]) < 1e-10) continue;

      if (pivot !== pivotRow) {
        [M[pivot], M[pivotRow]] = [M[pivotRow], M[pivot]];
        steps.push(`Trocar L${pivotRow + 1} ↔ L${pivot + 1}.`);
      }

      const p = M[pivotRow][col];
      for (let c = col; c <= n; c++) M[pivotRow][c] /= p;
      steps.push(`L${pivotRow + 1} ← L${pivotRow + 1} ÷ ${fmt(p)} (pivô = 1).`);

      for (let r = 0; r < n; r++) {
        if (r !== pivotRow) {
          const factor = M[r][col];
          if (Math.abs(factor) > 1e-10) {
            for (let c = col; c <= n; c++) M[r][c] -= factor * M[pivotRow][c];
            steps.push(`L${r + 1} ← L${r + 1} − (${fmt(factor)}) · L${pivotRow + 1}.`);
          }
        }
      }
      pivotCols.push(col);
      pivotRow++;
    }

    const inconsistent = M.some(
      row => row.slice(0, n).every(v => Math.abs(v) < 1e-10) && Math.abs(row[n]) > 1e-10
    );
    if (inconsistent) {
      return {
        type: 'none',
        steps,
        matrix: M,
        message: 'Sistema Impossível (SI): surgiu uma equação inconsistente (0 = k ≠ 0).'
      };
    }

    if (pivotCols.length < n) {
      return {
        type: 'infinite',
        steps,
        matrix: M,
        message: 'Sistema Possível e Indeterminado (SPI): infinitas soluções (variáveis livres).'
      };
    }

    const solution = Array(n).fill(0);
    pivotCols.forEach((col, row) => {
      solution[col] = M[row][n];
    });

    return {
      type: 'unique',
      solution,
      steps,
      matrix: M,
      message: 'Sistema Possível e Determinado (SPD): solução única encontrada.'
    };
  }

  return { add, multiply, transpose, determinant, inverse, gauss, fmt };
})();
