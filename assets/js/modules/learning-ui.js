// ==========================================================================
// MATRIZANDO — Módulo 06: Central de Aprendizagem (Lições Guiadas + Mini-Labs)
// ==========================================================================

window.LearningUI = (() => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const lessons = [
    {
      id: 'licao-01',
      number: 'LIÇÃO 01',
      title: 'Matrizes como Estruturas de Dados',
      duration: '4 min',
      summary: 'Entenda como tabelas numéricas m × n representam imagens digitais, redes, tabelas financeiras e transformações espaciais.',
      formula: 'A = [aᵢⱼ] ∈ ℝᵐˣⁿ   (i = linha, j = coluna)',
      body: [
        'Uma matriz de ordem m × n organiza m · n números reais em m linhas horizontais e n colunas verticais. Na computação, imagens digitais são matrizes de pixels, e redes sociais são representadas por matrizes de adjacência.',
        'Quando m = n, dizemos que a matriz é quadrada de ordem n. Apenas matrizes quadradas possuem determinante, traço e inversa bilateral.'
      ],
      practiceModule: 'laboratorio',
      practiceLabel: 'Experimentar no Laboratório de Matrizes →'
    },
    {
      id: 'licao-02',
      number: 'LIÇÃO 02',
      title: 'Multiplicação Matricial: Composição de Funções',
      duration: '6 min',
      summary: 'Por que multiplicamos linha por coluna em vez de entrada por entrada? Descubra a ligação com composição de transformações.',
      formula: '(A · B)ᵢⱼ = ∑ₖ aᵢₖ · bₖⱼ   (exige colunas de A = linhas de B)',
      body: [
        'A multiplicação matricial não é comutativa: em geral, A · B ≠ B · A. Isso ocorre porque aplicar uma rotação e depois um cisalhamento produz um resultado diferente de inverter a ordem dessas ações.',
        'Cada entrada cᵢⱼ do produto é o produto escalar (interno) entre a i-ésima linha de A e a j-ésima coluna de B.'
      ],
      practiceModule: 'laboratorio',
      practiceLabel: 'Testar Produto A × B no Laboratório →'
    },
    {
      id: 'licao-03',
      number: 'LIÇÃO 03',
      title: 'Determinante e Fator de Escala Geométrica',
      duration: '5 min',
      summary: 'Muito além de uma fórmula: o determinante mede como uma matriz estica áreas/volumes e revela se ela é invertível.',
      formula: 'det([[a, b], [c, d]]) = a·d − b·c',
      body: [
        'Geometricamente, |det(M)| é o fator pelo qual a área de qualquer figura é multiplicada após a transformação linear M.',
        'Se det(M) = 0, a área colapsa para zero (o plano é achatado em uma reta ou ponto), tornando impossível desfazer a transformação — logo, não existe matriz inversa M⁻¹.'
      ],
      practiceModule: 'transformacoes',
      practiceLabel: 'Visualizar Área e Determinante em 2D →'
    },
    {
      id: 'licao-04',
      number: 'LIÇÃO 04',
      title: 'Eliminação de Gauss-Jordan e Sistemas Lineares',
      duration: '7 min',
      summary: 'Como operações elementares nas linhas transformam sistemas complexos em formas escalonadas reduzidas.',
      formula: 'A · x = b   ⟺   [A | b]  ~  [I | x]',
      body: [
        'Trocar duas linhas, multiplicar uma linha por um escalar não nulo ou somar a uma linha um múltiplo de outra não altera o conjunto-solução do sistema.',
        'Ao reduzir [A | b] até a forma escalonada reduzida por linhas, identificamos imediatamente se o sistema tem solução única (SPD), infinitas soluções (SPI) ou nenhuma solução (SI).'
      ],
      practiceModule: 'laboratorio',
      practiceLabel: 'Resolver Sistema no Laboratório →'
    },
    {
      id: 'licao-05',
      number: 'LIÇÃO 05',
      title: 'Cifra de Hill e Aritmética Modular',
      duration: '6 min',
      summary: 'Como Lester Hill usou álgebra linear módulo 26 em 1929 para cifrar blocos inteiros de letras simultaneamente.',
      formula: 'C ≡ K · P (mod 26)   e   P ≡ K⁻¹ · C (mod 26)',
      body: [
        'Ao associar A=0, B=1, ..., Z=25, agrupamos o texto em vetores de tamanho n e multiplicamos pela matriz-chave K módulo 26.',
        'Para decifrar, precisamos de K⁻¹ (mod 26), que só existe quando mdc(det(K), 26) = 1 — ou seja, det(K) não pode ser divisível por 2 nem por 13.'
      ],
      practiceModule: 'criptografia',
      practiceLabel: 'Abrir Central de Criptografia →'
    }
  ];

  let activeIndex = 0;

  function render() {
    const page = document.getElementById('pageContent');
    if (!page) return;
    const state = window.MatrizandoStore.getState();
    const lesson = lessons[activeIndex];
    const done = state.completedLessons.includes(lesson.id);

    page.innerHTML = `
      <div class="module-header">
        <div>
          <div class="eyebrow"><span class="eyebrow-line"></span> MÓDULO 06 • TRILHA CONCEITUAL</div>
          <h1>Central de <span>aprendizagem.</span></h1>
          <p class="welcome-copy">Estude cada conceito com clareza visual, fórmulas comentadas e conexões diretas com os laboratórios interativos.</p>
        </div>
        <div class="module-header-actions">
          <button class="back-dashboard" id="backDashboardLearn">← Visão geral</button>
        </div>
      </div>

      <div id="learnAgentBanner"></div>

      <div class="learn-grid">
        <nav aria-label="Lições de Álgebra Linear">
          ${lessons.map((l, idx) => {
            const isDone = state.completedLessons.includes(l.id);
            return `
              <button class="lesson-nav-item ${idx === activeIndex ? 'active' : ''}" data-lesson-idx="${idx}">
                <div>
                  <span style="display:block;font-size:0.7rem;font-family:var(--mono);color:var(--muted)">${esc(l.number)} · ${esc(l.duration)}</span>
                  <strong style="font-size:0.88rem">${esc(l.title)}</strong>
                </div>
                <span style="color:${isDone ? 'var(--green)' : 'var(--subtle)'};font-weight:700">${isDone ? '✓' : '○'}</span>
              </button>
            `;
          }).join('')}
        </nav>

        <article class="panel crypto-panel">
          <div class="matrix-title-row">
            <span class="agent-role-pill">${esc(lesson.number)} • LEITURA ${esc(lesson.duration)}</span>
            <button type="button" class="${done ? 'secondary-action' : 'primary-action'}" id="toggleLessonDone">
              ${done ? '✓ Lição concluída' : 'Marcar como concluída (+25 XP)'}
            </button>
          </div>

          <h2 style="font-size:1.35rem;margin-top:14px">${esc(lesson.title)}</h2>
          <p class="crypto-muted" style="font-size:0.92rem">${esc(lesson.summary)}</p>

          <div class="formula-box">${esc(lesson.formula)}</div>

          ${lesson.body.map(p => `<p style="line-height:1.75;color:var(--text-secondary);margin:12px 0">${esc(p)}</p>`).join('')}

          <div class="dossier-box" style="margin-top:18px">
            <span class="panel-overline">EXPERIMENTO RÁPIDO NA LIÇÃO</span>
            <p style="margin:6px 0 10px;font-size:0.84rem;color:var(--muted)">Teste rapidamente o determinante e o traço de uma matriz 2×2 sem sair da leitura:</p>
            <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
              <div class="hill-matrix" style="--n:2">
                <input class="hill-key-cell" id="miniA" type="number" value="4" aria-label="Mini matriz a">
                <input class="hill-key-cell" id="miniB" type="number" value="2" aria-label="Mini matriz b">
                <input class="hill-key-cell" id="miniC" type="number" value="1" aria-label="Mini matriz c">
                <input class="hill-key-cell" id="miniD" type="number" value="3" aria-label="Mini matriz d">
              </div>
              <div id="miniLabOut" style="font-family:var(--mono);font-size:0.86rem;color:var(--cyan)">
                det = 10 | Traço = 7 | Invertível ✓
              </div>
            </div>
          </div>

          <div class="action-row" style="margin-top:18px">
            <button type="button" class="primary-action" id="openPracticeBtn">${esc(lesson.practiceLabel)}</button>
            ${activeIndex < lessons.length - 1 ? `<button type="button" class="secondary-action" id="nextLessonBtn">Próxima lição →</button>` : ''}
          </div>
        </article>
      </div>
    `;

    bind();

    window.MatrizandoAgents?.renderInlineBanner('learnAgentBanner', 'matriz',
      `Estamos na ${lesson.number}: "${lesson.title}". Experimente o mini-simulador dentro da página e depois clique no botão para praticar no laboratório completo!`
    );
  }

  function updateMiniLab() {
    const a = Number(document.getElementById('miniA')?.value) || 0;
    const b = Number(document.getElementById('miniB')?.value) || 0;
    const c = Number(document.getElementById('miniC')?.value) || 0;
    const d = Number(document.getElementById('miniD')?.value) || 0;
    const det = a * d - b * c;
    const tr = a + d;
    const out = document.getElementById('miniLabOut');
    if (out) {
      out.textContent = `det = ${det} | Traço = ${tr} | ${det !== 0 ? 'Invertível ✓' : 'Singular (det=0) ⚠'}`;
    }
  }

  function bind() {
    const lesson = lessons[activeIndex];
    document.getElementById('backDashboardLearn').onclick = () => window.MatrizandoNavigation.navigate('inicio');

    document.querySelectorAll('[data-lesson-idx]').forEach(btn => {
      btn.onclick = () => {
        activeIndex = Number(btn.dataset.lessonIdx);
        render();
      };
    });

    document.getElementById('toggleLessonDone').onclick = () => {
      window.MatrizandoStore?.toggleLessonCompleted(lesson.id);
      render();
    };

    ['miniA', 'miniB', 'miniC', 'miniD'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', updateMiniLab);
    });

    document.getElementById('openPracticeBtn').onclick = () => {
      window.MatrizandoNavigation.navigate(lesson.practiceModule);
    };

    document.getElementById('nextLessonBtn')?.addEventListener('click', () => {
      activeIndex += 1;
      render();
    });
  }

  return { render };
})();
