// ==========================================================================
// MATRIZANDO — Aritmética Modular e Operações Matriciais (Módulo 26)
// ==========================================================================

window.HillMatrix = (() => {
  const mod = (n, m = 26) => ((n % m) + m) % m;
  const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));

  function determinant(a) {
    const n = a.length;
    if (!a.every(row => row.length === n)) {
      throw new Error('A matriz precisa ser quadrada.');
    }
    if (n === 2) {
      return a[0][0] * a[1][1] - a[0][1] * a[1][0];
    }
    if (n === 3) {
      return (
        a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) -
        a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) +
        a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0])
      );
    }
    throw new Error('Somente matrizes 2×2 ou 3×3 são aceitas na Cifra de Hill.');
  }

  function modInverse(a, m = 26) {
    const target = mod(a, m);
    for (let x = 1; x < m; x++) {
      if (mod(target * x, m) === 1) return x;
    }
    return null;
  }

  function inverseMod(a, m = 26) {
    const det = determinant(a);
    const invDet = modInverse(det, m);
    if (invDet === null) {
      throw new Error(`A matriz não possui inversa módulo ${m}: mdc(${mod(det, m)}, ${m}) ≠ 1.`);
    }

    let cof;
    if (a.length === 2) {
      cof = [
        [a[1][1], -a[1][0]],
        [-a[0][1], a[0][0]]
      ];
    } else {
      cof = Array.from({ length: 3 }, (_, i) =>
        Array.from({ length: 3 }, (_, j) => {
          const minor = a.filter((_, r) => r !== i).map(row => row.filter((_, c) => c !== j));
          const d = minor[0][0] * minor[1][1] - minor[0][1] * minor[1][0];
          return ((i + j) % 2 === 0 ? 1 : -1) * d;
        })
      );
    }

    const adj = cof[0].map((_, c) => cof.map(row => row[c]));
    return adj.map(row => row.map(v => mod(v * invDet, m)));
  }

  function multiplyVector(a, v, m = 26) {
    return a.map(row => mod(row.reduce((sum, value, j) => sum + value * v[j], 0), m));
  }

  function multiplyMatricesMod(A, B, m = 26) {
    return A.map(row =>
      B[0].map((_, j) => mod(row.reduce((sum, val, k) => sum + val * B[k][j], 0), m))
    );
  }

  function validateKey(a) {
    if (
      !Array.isArray(a) ||
      ![2, 3].includes(a.length) ||
      !a.every(row => Array.isArray(row) && row.length === a.length && row.every(Number.isInteger))
    ) {
      return { valid: false, message: 'Informe uma matriz quadrada 2×2 ou 3×3 com números inteiros.' };
    }
    const det = determinant(a);
    const reduced = mod(det);
    const divisor = gcd(reduced, 26);
    if (divisor !== 1) {
      return {
        valid: false,
        det,
        reduced,
        divisor,
        message: `Determinante = ${det} (mod 26 = ${reduced}). Como mdc(${reduced}, 26) = ${divisor} ≠ 1, não existe inversa modular.`
      };
    }
    return {
      valid: true,
      det,
      reduced,
      divisor: 1,
      message: `Chave válida! det(K) = ${det} (mod 26 = ${reduced}) e mdc(${reduced}, 26) = 1.`
    };
  }

  function generateRandomKey(size = 2) {
    for (let attempt = 0; attempt < 500; attempt++) {
      const candidate = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => Math.floor(Math.random() * 25) + 1)
      );
      if (validateKey(candidate).valid) return candidate;
    }
    return size === 2 ? [[3, 3], [2, 5]] : [[6, 24, 1], [13, 16, 10], [20, 17, 15]];
  }

  return {
    mod,
    gcd,
    determinant,
    modInverse,
    inverseMod,
    multiplyVector,
    multiplyMatricesMod,
    validateKey,
    generateRandomKey
  };
})();
