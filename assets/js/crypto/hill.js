// ==========================================================================
// MATRIZANDO — Motor da Cifra de Hill (A=0 .. Z=25)
// ==========================================================================

window.HillCipher = (() => {
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const normalize = text =>
    String(text || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase()
      .replace(/Ç/g, 'C')
      .replace(/[^A-Z]/g, '');

  const numbers = text => [...text].map(ch => ALPHABET.indexOf(ch));
  const letters = values => values.map(n => ALPHABET[window.HillMatrix.mod(n)]).join('');

  function encrypt(message, key) {
    const validation = window.HillMatrix.validateKey(key);
    if (!validation.valid) throw new Error(validation.message);

    const clean = normalize(message);
    if (!clean) throw new Error('Digite uma mensagem com pelo menos uma letra de A a Z.');

    const n = key.length;
    const original = numbers(clean);
    const padded = [...original];
    while (padded.length % n !== 0) {
      padded.push(23); // X completa o último bloco
    }

    const blocks = [];
    const output = [];
    for (let i = 0; i < padded.length; i += n) {
      const input = padded.slice(i, i + n);
      const result = window.HillMatrix.multiplyVector(key, input);
      blocks.push({
        input,
        output: result,
        inputText: letters(input),
        outputText: letters(result)
      });
      output.push(...result);
    }

    return {
      text: letters(output),
      clean,
      paddedText: letters(padded),
      padding: padded.length - original.length,
      blocks,
      key,
      determinant: validation.det
    };
  }

  function decrypt(ciphertext, key, removePadding = false) {
    const validation = window.HillMatrix.validateKey(key);
    if (!validation.valid) throw new Error(validation.message);

    const clean = normalize(ciphertext);
    const n = key.length;
    if (!clean) throw new Error('Digite o texto cifrado para descriptografar.');
    if (clean.length % n !== 0) {
      throw new Error(`O texto cifrado precisa ter quantidade de letras múltipla de ${n} (atual: ${clean.length}).`);
    }

    const inverse = window.HillMatrix.inverseMod(key);
    const values = numbers(clean);
    const blocks = [];
    const output = [];

    for (let i = 0; i < values.length; i += n) {
      const input = values.slice(i, i + n);
      const result = window.HillMatrix.multiplyVector(inverse, input);
      blocks.push({
        input,
        output: result,
        inputText: letters(input),
        outputText: letters(result)
      });
      output.push(...result);
    }

    let text = letters(output);
    if (removePadding) {
      text = text.replace(/X+$/, '');
    }

    return {
      text,
      blocks,
      inverse,
      key,
      determinant: validation.det
    };
  }

  function letterFrequencies(text) {
    const clean = normalize(text);
    const counts = {};
    for (const ch of clean) {
      counts[ch] = (counts[ch] || 0) + 1;
    }
    return counts;
  }

  return { ALPHABET, normalize, encrypt, decrypt, letterFrequencies };
})();
