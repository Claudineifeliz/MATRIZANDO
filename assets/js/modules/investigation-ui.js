// ==========================================================================
// MATRIZANDO — Módulo 02: Sala de Investigação (Missões Criptográficas)
// ==========================================================================

window.InvestigationUI = (() => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const cases = [
    {
      id: 'caso-01',
      code: 'DOSSIÊ #01',
      difficulty: 'Iniciante · 2×2',
      title: 'Interceptação Alfa',
      briefing: 'Nossos sensores interceptaram uma transmissão curta enviada pelo laboratório rival. A equipe de campo recuperou a matriz-chave 2×2 utilizada na codificação.',
      ciphertext: 'XKVEQT',
      size: 2,
      defaultKey: [[3, 3], [2, 5]],
      answer: 'VETOR',
      clues: [
        { title: 'Chave Recuperada', text: 'K = [[3, 3], [2, 5]]. Note que det(K) = 15 − 6 = 9, e mdc(9, 26) = 1.' },
        { title: 'Preenchimento', text: 'A palavra original tem 5 letras e recebeu um "X" ao final para fechar 3 blocos de 2 letras.' }
      ],
      mentorHint: 'Use o Decodificador Investigativo abaixo com a chave [[3, 3], [2, 5]] e ative a remoção de "X" ao final!'
    },
    {
      id: 'caso-02',
      code: 'DOSSIÊ #02',
      difficulty: 'Intermediário · Quebra de Chave',
      title: 'Ataque de Texto Claro Conhecido',
      briefing: 'Interceptamos o código "IWXKQX", mas a chave foi destruída. Sabemos por inteligência que a mensagem começa com o prefixo "MA" (que virou "IW") seguido de "TR" (que virou "XK"). Descubra a chave K e decifre a palavra completa!',
      ciphertext: 'IWXKQX',
      size: 2,
      defaultKey: [[1, 0], [0, 1]],
      answer: 'MATRIX',
      clues: [
        { title: 'Par Conhecido 1', text: 'Bloco "MA" = [12, 0]ᵀ foi cifrado para "IW" = [8, 22]ᵀ (mod 26).' },
        { title: 'Par Conhecido 2', text: 'Bloco "TR" = [19, 17]ᵀ foi cifrado para "XK" = [23, 10]ᵀ (mod 26).' },
        { title: 'Pista da 1ª Linha', text: 'Como a₂ = 0 no primeiro par, 12·k₁₁ ≡ 8 (mod 26) → 6·k₁₁ ≡ 4 (mod 13) → k₁₁ = 5 e k₂₁ = 17.' }
      ],
      mentorHint: 'Com k₁₁ = 5 e k₂₁ = 17, substitua no segundo par [19, 17]ᵀ: 5(19) + 17·k₁₂ ≡ 23 (mod 26), o que dá k₁₂ = 8 e k₂₂ = 3!'
    },
    {
      id: 'caso-03',
      code: 'DOSSIÊ #03',
      difficulty: 'Avançado · 3×3',
      title: 'Protocolo Triplo 3×3',
      briefing: 'Uma mensagem de 9 caracteres ("KCRNEODAI") foi protegida com uma matriz-chave de ordem 3×3. Recupere o termo matemático oculto.',
      ciphertext: 'KCRNEODAI',
      size: 3,
      defaultKey: [[6, 24, 1], [13, 16, 10], [20, 17, 15]],
      answer: 'ALGEBRA',
      clues: [
        { title: 'Dimensão do Bloco', text: 'Ordem 3×3 significa que os 9 caracteres formam exatamente 3 vetores-coluna de 3 posições.' },
        { title: 'Padding Duplo', text: 'A palavra original possui 7 letras e foi completada com "XX" ao final.' }
      ],
      mentorHint: 'A chave 3×3 já está carregada no decodificador. Observe como K⁻¹ possui entradas inteiras módulo 26 mesmo com det(K) = 441!'
    },
    {
      id: 'caso-04',
      code: 'DOSSIÊ #04',
      difficulty: 'Desafio · Coeficiente Perdido',
      title: 'A Chave Corrompida de Göttingen',
      briefing: 'O código "QSUUQN" esconde o sobrenome de um célebre matemático alemão. A chave é K = [[7, ?], [3, 5]], mas o elemento k₁₂ borrou. Sabe-se que k₁₂ é um inteiro entre 1 e 4.',
      ciphertext: 'QSUUQN',
      size: 2,
      defaultKey: [[7, 1], [3, 5]],
      answer: 'GAUSS',
      clues: [
        { title: 'Filtro pelo Determinante', text: 'det(K) = 7·5 − 3·k₁₂ = 35 − 3·k₁₂. Precisamos que mdc(det(K), 26) = 1.' },
        { title: 'Eliminação', text: 'Se k₁₂ = 3, det(K) = 26 ≡ 0 (inválido!). Teste os valores vizinhos (1, 2 ou 4) no decodificador.' }
      ],
      mentorHint: 'Experimente alterar a célula (linha 1, coluna 2) para 2 e clique em "Testar Chave no Código"!'
    }
  ];

  let activeCaseIndex = 0;

  function render() {
    const page = document.getElementById('pageContent');
    if (!page) return;
    const state = window.MatrizandoStore.getState();
    const current = cases[activeCaseIndex];
    const isSolved = state.solvedCases.includes(current.id);

    page.innerHTML = `
      <div class="module-header">
        <div>
          <div class="eyebrow"><span class="eyebrow-line"></span> MÓDULO 02 • INVESTIGAÇÃO MATRICIAL</div>
          <h1>Sala de <span>investigação.</span></h1>
          <p class="welcome-copy">Assuma o papel de criptoanalista. Use inversão modular, pistas de texto claro e ferramentas matriciais para decifrar transmissões interceptadas.</p>
        </div>
        <div class="module-header-actions">
          <button class="back-dashboard" id="backDashboardInv">← Visão geral</button>
        </div>
      </div>

      <div id="invAgentBanner"></div>

      <div class="inv-layout">
        <aside class="case-list" aria-label="Dossiês disponíveis">
          ${cases.map((c, idx) => {
            const solved = state.solvedCases.includes(c.id);
            return `
              <button class="case-card ${idx === activeCaseIndex ? 'active' : ''}" data-case-idx="${idx}">
                <div class="case-card-top">
                  <span>${esc(c.code)}</span>
                  <span>${solved ? '✓ Resolvido' : esc(c.difficulty)}</span>
                </div>
                <strong>${esc(c.title)}</strong>
                <small>${solved ? 'Missão concluída (+45 XP)' : 'Clique para abrir dossiê'}</small>
              </button>
            `;
          }).join('')}
        </aside>

        <section class="panel crypto-panel">
          <div class="matrix-title-row">
            <div>
              <div class="panel-overline">${esc(current.code)} • ${esc(current.difficulty)}</div>
              <h2>${esc(current.title)} ${isSolved ? '✓' : ''}</h2>
            </div>
            <button type="button" class="mini-chip" id="invAskHint">💡 Pedir pista ao Agente Cipher</button>
          </div>

          <p class="crypto-muted" style="margin-top:8px">${esc(current.briefing)}</p>

          <div class="dossier-box">
            <span class="panel-overline">TRANSMISSÃO INTERCEPTADA</span>
            <div class="cipher-intercept">${esc(current.ciphertext)}</div>
            <div class="clue-list">
              ${current.clues.map(cl => `
                <div class="clue-item">
                  <strong>${esc(cl.title)}</strong>
                  <span>${esc(cl.text)}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="dossier-box">
            <div class="matrix-title-row">
              <strong>Bancada de Descriptografia (${current.size}×${current.size})</strong>
              <span id="invDetBadge" style="font-size:0.78rem;font-family:var(--mono);color:var(--cyan)"></span>
            </div>

            <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-top:12px">
              <div class="hill-matrix" style="--n:${current.size}">
                ${current.defaultKey.flatMap((row, r) =>
                  row.map((v, c) => `
                    <input class="hill-key-cell inv-key-cell" type="number" step="1"
                           data-r="${r}" data-c="${c}" value="${v}"
                           aria-label="Chave investigativa linha ${r + 1} coluna ${c + 1}">
                  `)
                ).join('')}
              </div>

              <div style="flex:1;min-width:210px">
                <button type="button" class="primary-action" id="invTestKeyBtn">🔍 Testar Chave no Código</button>
                <div class="result-block" style="margin-top:10px">
                  <span class="panel-overline">SAÍDA DECODIFICADA</span>
                  <div class="cipher-output recovered" id="invPreviewOut">—</div>
                </div>
              </div>
            </div>
          </div>

          <div style="margin-top:16px">
            <label class="field-label" for="invAnswerInput">Palavra secreta decifrada (sem o 'X' de preenchimento)</label>
            <div class="action-row" style="margin-top:6px">
              <input id="invAnswerInput" class="text-input" style="max-width:280px;text-transform:uppercase;font-family:var(--mono);font-weight:700"
                     placeholder="Digite a palavra..." value="${isSolved ? esc(current.answer) : ''}">
              <button type="button" class="primary-action" id="invSubmitAnswer">Validar Descoberta</button>
            </div>
            <div id="invFeedback" style="margin-top:10px" aria-live="polite"></div>
          </div>
        </section>
      </div>
    `;

    bind();
    updateDetBadge();

    window.MatrizandoAgents?.renderInlineBanner('invAgentBanner', 'cipher',
      `Analisando o ${current.code}: "${current.title}". Use a bancada de descriptografia para testar sua matriz-chave K e validar a palavra oculta!`
    );
    window.MatrizandoStore?.setLiveContext({
      page: 'investigacao',
      summary: `Investigando ${current.code} (${current.title}), texto cifrado "${current.ciphertext}".`
    });
  }

  function readInvKey() {
    const current = cases[activeCaseIndex];
    const n = current.size;
    const cells = [...document.querySelectorAll('.inv-key-cell')];
    return Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (_, c) => Number(cells.find(x => +x.dataset.r === r && +x.dataset.c === c)?.value))
    );
  }

  function updateDetBadge() {
    const badge = document.getElementById('invDetBadge');
    if (!badge) return;
    const v = HillMatrix.validateKey(readInvKey());
    badge.textContent = v.valid
      ? `det(K) = ${v.det} · Invertível mod 26 ✓`
      : `det(K) = ${v.det ?? '?'} · Não invertível ⚠`;
    badge.style.color = v.valid ? 'var(--green)' : 'var(--coral)';
  }

  function bind() {
    const current = cases[activeCaseIndex];
    document.getElementById('backDashboardInv').onclick = () => window.MatrizandoNavigation.navigate('inicio');

    document.querySelectorAll('[data-case-idx]').forEach(btn => {
      btn.onclick = () => {
        activeCaseIndex = Number(btn.dataset.caseIdx);
        render();
      };
    });

    document.querySelectorAll('.inv-key-cell').forEach(inp => {
      inp.oninput = updateDetBadge;
    });

    document.getElementById('invAskHint').onclick = () => {
      window.MatrizandoAgents?.reactToEvent('cipher', `Pista para o ${current.code}: ${current.mentorHint}`);
    };

    document.getElementById('invTestKeyBtn').onclick = () => {
      const out = document.getElementById('invPreviewOut');
      try {
        const res = HillCipher.decrypt(current.ciphertext, readInvKey(), true);
        out.textContent = res.text;
        document.getElementById('invAnswerInput').value = res.text;
      } catch (e) {
        out.textContent = `Erro: ${e.message}`;
      }
    };

    document.getElementById('invSubmitAnswer').onclick = () => {
      const guess = HillCipher.normalize(document.getElementById('invAnswerInput').value);
      const fb = document.getElementById('invFeedback');
      if (guess === current.answer) {
        fb.innerHTML = `<div class="validation-note valid">✓ Caso encerrado com sucesso! A mensagem original era <b>${esc(current.answer)}</b>.</div>`;
        window.MatrizandoStore?.markCaseSolved(current.id);
        window.MatrizandoAgents?.reactToEvent(
          'cipher',
          `Excelente trabalho, criptoanalista! Você solucionou o ${current.code} e recuperou "${current.answer}".`
        );
        render();
      } else {
        fb.innerHTML = `<div class="validation-note invalid">⚠ "${esc(guess || '—')}" ainda não corresponde à mensagem original. Ajuste a matriz-chave na bancada e teste novamente!</div>`;
      }
    };
  }

  return { render };
})();
