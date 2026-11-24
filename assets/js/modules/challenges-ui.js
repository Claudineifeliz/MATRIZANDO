// ==========================================================================
// MATRIZANDO — Módulo 05: Arena de Desafios (Gamificação + Radar Chart)
// ==========================================================================

window.ChallengesUI = (() => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  let selectedTopic = 'all';
  let currentQuestion = null;
  let answered = false;

  const topicLabels = {
    operacoes: 'Operações',
    determinantes: 'Determinantes',
    sistemas: 'Sistemas',
    criptografia: 'Criptografia'
  };

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function generateQuestion(filter = 'all') {
    const topics = ['operacoes', 'determinantes', 'sistemas', 'criptografia'];
    const topic = filter === 'all' ? topics[randInt(0, topics.length - 1)] : filter;

    if (topic === 'determinantes') {
      const a = randInt(1, 6);
      const b = randInt(-3, 5);
      const c = randInt(-2, 4);
      const d = randInt(1, 6);
      const det = a * d - b * c;
      const distractors = new Set([det + 2, det - 3, a * d + b * c, a + d]);
      distractors.delete(det);
      const opts = shuffle([det, ...[...distractors].slice(0, 3)]).map(String);
      return {
        topic: 'determinantes',
        badge: 'DETERMINANTES 2×2',
        prompt: `Calcule o determinante da matriz M = [[${a}, ${b}], [${c}, ${d}]]:`,
        options: opts,
        correctIndex: opts.indexOf(String(det)),
        explanation: `det(M) = (${a} × ${d}) − (${b} × ${c}) = ${a * d} − (${b * c}) = ${det}.`
      };
    }

    if (topic === 'operacoes') {
      const a11 = randInt(1, 5), a12 = randInt(0, 4);
      const b11 = randInt(1, 4), b21 = randInt(1, 5);
      const val = a11 * b11 + a12 * b21;
      const distractors = new Set([a11 * b11, val + 3, val - 2, a11 + a12 + b11 + b21]);
      distractors.delete(val);
      const opts = shuffle([val, ...[...distractors].slice(0, 3)]).map(String);
      return {
        topic: 'operacoes',
        badge: 'PRODUTO MATRICIAL',
        prompt: `No produto A × B, onde a primeira linha de A é [${a11}, ${a12}] e a primeira coluna de B é [${b11}, ${b21}]ᵀ, qual é o elemento c₁₁?`,
        options: opts,
        correctIndex: opts.indexOf(String(val)),
        explanation: `Multiplicamos linha por coluna: c₁₁ = (${a11} × ${b11}) + (${a12} × ${b21}) = ${a11 * b11} + ${a12 * b21} = ${val}.`
      };
    }

    if (topic === 'sistemas') {
      const scenarios = [
        {
          prompt: 'Durante o escalonamento de Gauss-Jordan, a última linha da matriz aumentada resultou em [0  0  0 | 7]. Como esse sistema é classificado?',
          correct: 'Sistema Impossível (SI) — nenhuma solução',
          others: [
            'Sistema Possível e Determinado (SPD) — solução única',
            'Sistema Possível e Indeterminado (SPI) — infinitas soluções',
            'Sistema Homogêneo Trivial'
          ],
          explanation: 'A linha [0 0 0 | 7] representa 0x + 0y + 0z = 7, uma igualdade falsa (0 = 7). Portanto, não existe solução.'
        },
        {
          prompt: 'Um sistema linear 3×3 possui determinante da matriz dos coeficientes det(A) = −5. O que podemos afirmar sobre suas soluções?',
          correct: 'Possui uma única solução (SPD)',
          others: [
            'Não possui solução (SI)',
            'Possui infinitas soluções (SPI)',
            'Só pode ser resolvido se a matriz for simétrica'
          ],
          explanation: 'Sempre que det(A) ≠ 0 em um sistema quadrado n×n, a matriz A é invertível e existe solução única x = A⁻¹b.'
        }
      ];
      const pick = scenarios[randInt(0, scenarios.length - 1)];
      const opts = shuffle([pick.correct, ...pick.others]);
      return {
        topic: 'sistemas',
        badge: 'SISTEMAS LINEARES',
        prompt: pick.prompt,
        options: opts,
        correctIndex: opts.indexOf(pick.correct),
        explanation: pick.explanation
      };
    }

    const cryptoBank = [
      {
        prompt: 'Na Cifra de Hill (módulo 26), qual condição garante que uma matriz-chave K possa ser invertida para descriptografar mensagens?',
        correct: 'mdc(det(K), 26) = 1',
        others: [
          'det(K) = 26',
          'det(K) deve ser um número par',
          'Todos os elementos de K devem ser primos'
        ],
        explanation: 'Em aritmética módulo 26, um número possui inverso multiplicativo se e somente se for coprimo com 26, ou seja, mdc(det(K), 26) = 1.'
      },
      {
        prompt: 'Usando A = 0, B = 1, ..., Z = 25, qual letra corresponde ao resultado numérico 29 reduzido módulo 26?',
        correct: 'D (pois 29 ≡ 3 mod 26)',
        others: [
          'C (pois 29 ≡ 2 mod 26)',
          'Z (pois 29 > 25)',
          'E (pois 29 ≡ 4 mod 26)'
        ],
        explanation: '29 − 26 = 3. Como A=0, B=1, C=2 e D=3, o resultado reduzido módulo 26 é a letra D.'
      }
    ];
    const cPick = cryptoBank[randInt(0, cryptoBank.length - 1)];
    const cOpts = shuffle([cPick.correct, ...cPick.others]);
    return {
      topic: 'criptografia',
      badge: 'CRIPTOGRAFIA DE HILL',
      prompt: cPick.prompt,
      options: cOpts,
      correctIndex: cOpts.indexOf(cPick.correct),
      explanation: cPick.explanation
    };
  }

  function render() {
    const page = document.getElementById('pageContent');
    if (!page) return;
    if (!currentQuestion) {
      currentQuestion = generateQuestion(selectedTopic);
      answered = false;
    }

    const state = window.MatrizandoStore.getState();

    page.innerHTML = `
      <div class="module-header">
        <div>
          <div class="eyebrow"><span class="eyebrow-line"></span> MÓDULO 05 • ARENA PRÁTICA</div>
          <h1>Arena de <span>desafios.</span></h1>
          <p class="welcome-copy">Resolva problemas gerados dinamicamente, ganhe XP, mantenha sua sequência de acertos e acompanhe seu domínio em cada pilar da Álgebra Linear.</p>
        </div>
        <div class="module-header-actions">
          <button class="back-dashboard" id="backDashboardArena">← Visão geral</button>
        </div>
      </div>

      <div id="arenaAgentBanner"></div>

      <div class="pill-tabs" role="group" aria-label="Filtrar tópico dos desafios">
        <button class="pill-tab ${selectedTopic === 'all' ? 'active' : ''}" data-topic="all">✦ Todos os tópicos</button>
        <button class="pill-tab ${selectedTopic === 'operacoes' ? 'active' : ''}" data-topic="operacoes">Operações</button>
        <button class="pill-tab ${selectedTopic === 'determinantes' ? 'active' : ''}" data-topic="determinantes">Determinantes</button>
        <button class="pill-tab ${selectedTopic === 'sistemas' ? 'active' : ''}" data-topic="sistemas">Sistemas</button>
        <button class="pill-tab ${selectedTopic === 'criptografia' ? 'active' : ''}" data-topic="criptografia">Criptografia</button>
      </div>

      <div class="arena-layout">
        <section class="panel crypto-panel">
          <div class="matrix-title-row">
            <span class="agent-role-pill">${esc(currentQuestion.badge)}</span>
            <span style="font-family:var(--mono);font-size:0.8rem;color:var(--amber)">
              🔥 Sequência: ${state.streak} | ⭐ ${state.xp} XP
            </span>
          </div>

          <h2 style="margin-top:14px;font-size:1.12rem;line-height:1.5">${esc(currentQuestion.prompt)}</h2>

          <div class="quiz-options" id="quizOptions">
            ${currentQuestion.options.map((opt, idx) => `
              <button type="button" class="quiz-option" data-opt-idx="${idx}">
                <span class="option-letter">${String.fromCharCode(65 + idx)}</span>
                <span>${esc(opt)}</span>
              </button>
            `).join('')}
          </div>

          <div id="quizFeedback" style="margin-top:14px" aria-live="polite"></div>

          <div class="action-row" style="margin-top:16px">
            <button type="button" class="primary-action" id="nextQuestionBtn">Próximo desafio →</button>
          </div>
        </section>

        <aside class="panel crypto-panel">
          <div class="panel-overline">TELEMETRIA DE DOMÍNIO</div>
          <h2>Radar de Competências</h2>
          <p class="crypto-muted">Seu desempenho percentual em cada área atualiza automaticamente conforme você responde.</p>
          <div id="arenaRadarChart"></div>
          <div class="telemetry-grid" style="margin-top:10px">
            ${Object.entries(topicLabels).map(([key, label]) => {
              const st = state.challengeStats[key] || { correct: 0, total: 0 };
              const pct = st.total ? Math.round((st.correct / st.total) * 100) : 0;
              return `
                <div class="telemetry-card">
                  <span>${esc(label)}</span>
                  <strong>${pct}% <small style="font-size:0.72rem;color:var(--muted)">(${st.correct}/${st.total})</small></strong>
                </div>
              `;
            }).join('')}
          </div>
        </aside>
      </div>
    `;

    renderRadar();
    bind();

    window.MatrizandoAgents?.renderInlineBanner('arenaAgentBanner', 'matriz',
      'Hora de colocar a teoria à prova! Se errar alguma questão, não se preocupe — eu explico o raciocínio passo a passo para você dominar o conceito.'
    );
  }

  function renderRadar() {
    const host = document.getElementById('arenaRadarChart');
    if (!host) return;
    const stats = window.MatrizandoStore.getState().challengeStats;
    const axes = Object.entries(topicLabels).map(([key, label]) => {
      const b = stats[key] || { correct: 0, total: 0 };
      const ratio = b.total > 0 ? b.correct / b.total : 0.15;
      return { label, value: ratio };
    });
    window.MatrizandoCharts?.renderRadarChart(host, axes);
  }

  function bind() {
    document.getElementById('backDashboardArena').onclick = () => window.MatrizandoNavigation.navigate('inicio');

    document.querySelectorAll('[data-topic]').forEach(btn => {
      btn.onclick = () => {
        selectedTopic = btn.dataset.topic;
        currentQuestion = generateQuestion(selectedTopic);
        answered = false;
        render();
      };
    });

    document.querySelectorAll('[data-opt-idx]').forEach(btn => {
      btn.onclick = () => {
        if (answered) return;
        answered = true;
        const chosen = Number(btn.dataset.optIdx);
        const isCorrect = chosen === currentQuestion.correctIndex;

        document.querySelectorAll('[data-opt-idx]').forEach((b, idx) => {
          b.disabled = true;
          if (idx === currentQuestion.correctIndex) b.classList.add('correct');
          else if (idx === chosen && !isCorrect) b.classList.add('wrong');
        });

        window.MatrizandoStore?.recordChallenge(currentQuestion.topic, isCorrect);
        renderRadar();

        const fb = document.getElementById('quizFeedback');
        fb.innerHTML = `
          <div class="validation-note ${isCorrect ? 'valid' : 'invalid'}">
            <strong>${isCorrect ? '✓ Resposta correta!' : '⚠ Quase lá! Veja a resolução:'}</strong>
            <p style="margin:6px 0 0">${esc(currentQuestion.explanation)}</p>
          </div>
        `;

        if (!isCorrect) {
          window.MatrizandoAgents?.reactToEvent('matriz', `Vamos revisar juntos: ${currentQuestion.explanation}`);
        }
      };
    });

    document.getElementById('nextQuestionBtn').onclick = () => {
      currentQuestion = generateQuestion(selectedTopic);
      answered = false;
      render();
    };
  }

  return { render };
})();
