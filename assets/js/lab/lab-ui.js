// ==========================================================================
// MATRIZANDO — Módulo 03: Laboratório de Matrizes (Heatmap, Gráficos & Stepper)
// ==========================================================================

window.MatrixLabUI = (() => {
  const $ = (s, root = document) => root.querySelector(s);
  const esc = v => String(v).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  let operation = 'add';
  let size = 2;
  let stepLimit = null;
  let lastSteps = [];

  const defaults = {
    A: [[2, 3], [1, 4]],
    B: [[5, -1], [2, 3]],
    det: [[3, 2], [1, 4]],
    inv: [[4, 7], [2, 6]],
    trans: [[1, 5], [8, -2]],
    gaussA: [[2, 1], [1, -1]],
    gaussB: [5, 1]
  };

  const labels = {
    add: 'Soma de matrizes',
    subtract: 'Subtração de matrizes',
    multiply: 'Multiplicação de matrizes',
    transpose: 'Matriz transposta',
    determinant: 'Determinante',
    inverse: 'Matriz inversa',
    gauss: 'Escalonamento de Gauss-Jordan'
  };

  function matrixInputs(id, rows, cols, values = []) {
    let html = `<div class="ml-matrix" style="--cols:${cols}">`;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        html += `<input class="ml-cell" type="number" step="any"
                        aria-label="Matriz ${id} linha ${r + 1} coluna ${c + 1}"
                        data-matrix="${id}" data-row="${r}" data-col="${c}"
                        value="${values[r]?.[c] ?? (r === c ? 1 : 0)}">`;
      }
    }
    return html + '</div>';
  }

  function vectorInputs(id, count, values = []) {
    return `
      <div class="ml-vector">
        ${Array.from({ length: count }, (_, i) => `
          <label>
            <span>b${i + 1}</span>
            <input class="ml-cell" type="number" step="any"
                   aria-label="Termo independente linha ${i + 1}"
                   data-vector="${id}" data-index="${i}"
                   value="${values[i] ?? i + 1}">
          </label>
        `).join('')}
      </div>
    `;
  }

  function render() {
    const host = $('#pageContent');
    if (!host) return;

    host.innerHTML = `
      <div class="ml-page">
        <div class="module-header">
          <div>
            <div class="eyebrow"><span class="eyebrow-line"></span> MÓDULO 03 • CÁLCULO MATRICIAL</div>
            <h1>Laboratório de <span>matrizes.</span></h1>
            <p class="welcome-copy">Execute operações fundamentais, visualize mapas de calor de intensidade e acompanhe a eliminação de Gauss-Jordan passo a passo.</p>
          </div>
          <div class="module-header-actions">
            <button class="back-dashboard" id="backDashboardLab">← Visão geral</button>
          </div>
        </div>

        <div id="labAgentBanner"></div>

        <div class="ml-toolbar">
          <div class="ml-tabs" role="group" aria-label="Escolher operação matricial">
            <button data-op="add" class="${operation === 'add' ? 'selected' : ''}">A + B</button>
            <button data-op="subtract" class="${operation === 'subtract' ? 'selected' : ''}">A − B</button>
            <button data-op="multiply" class="${operation === 'multiply' ? 'selected' : ''}">A × B</button>
            <button data-op="transpose" class="${operation === 'transpose' ? 'selected' : ''}">Aᵀ</button>
            <button data-op="determinant" class="${operation === 'determinant' ? 'selected' : ''}">det(A)</button>
            <button data-op="inverse" class="${operation === 'inverse' ? 'selected' : ''}">A⁻¹</button>
            <button data-op="gauss" class="${operation === 'gauss' ? 'selected' : ''}">Gauss</button>
          </div>

          <label class="ml-size-label">
            ORDEM
            <select id="mlSize">
              ${[2, 3, 4].map(n => `<option value="${n}" ${size === n ? 'selected' : ''}>${n} × ${n}</option>`).join('')}
            </select>
          </label>
        </div>

        <div class="ml-workspace">
          <section class="ml-panel ml-input-panel" id="labInputPanel">
            <div class="ml-panel-title">
              <div>
                <span class="panel-overline">01 / ENTRADA DE DADOS</span>
                <h2>Monte suas matrizes</h2>
              </div>
              <span class="ml-step">ORDEM ${size}×${size}</span>
            </div>

            <div id="mlInputs"></div>

            <div class="ml-preset-row">
              <button type="button" class="mini-chip" id="presetIdentity">Identidade (I)</button>
              <button type="button" class="mini-chip" id="presetRandom">🎲 Aleatória</button>
              <button type="button" class="mini-chip" id="presetSingular">Singular (det=0)</button>
            </div>

            <div class="ml-actions">
              <button class="secondary-action" id="mlExample">Restaurar exemplo</button>
              <button class="primary-action ml-primary" id="mlCalculate">Calcular operação <span>→</span></button>
            </div>

            <p class="ml-hint" style="margin-top:12px;font-size:0.8rem;color:var(--muted)">
              Dica IHC: use as setas do teclado ou Tab para navegar rapidamente entre as células da matriz.
            </p>
          </section>

          <section class="ml-panel ml-result-panel" id="labResultPanel">
            <div class="ml-panel-title">
              <div>
                <span class="panel-overline">02 / RESOLUÇÃO VISUAL</span>
                <h2>Resultado e gráficos</h2>
              </div>
              <span class="ml-step">SAÍDA</span>
            </div>

            <div id="mlResult" class="ml-empty" aria-live="polite">
              <div class="ml-empty-icon">∑</div>
              <strong>Pronto para calcular</strong>
              <p>Preencha os coeficientes ao lado e clique em <b>Calcular operação</b> para gerar a matriz resultante, o mapa de calor e os passos.</p>
            </div>
          </section>
        </div>
      </div>
    `;

    renderInputs();
    bind();

    window.MatrizandoAgents?.renderInlineBanner('labAgentBanner', 'matriz',
      'Bem-vindo ao Laboratório de Matrizes! Experimente calcular determinantes, inversas ou sistemas lineares. Se você testar uma matriz singular (det = 0), eu explico geometricamente o porquê!'
    );
    window.MatrizandoStore?.setLiveContext({
      page: 'laboratorio',
      summary: `Estudante no Laboratório de Matrizes na operação "${labels[operation]}" (${size}×${size}).`
    });
  }

  function renderInputs(customA = null, customB = null) {
    const box = $('#mlInputs');
    if (!box) return;
    const n = size;

    if (['add', 'subtract', 'multiply'].includes(operation)) {
      box.innerHTML = `
        <div class="ml-matrices-row">
          <div class="ml-matrix-block">
            <div class="ml-matrix-label"><b>Matriz A</b><span>${n} × ${n}</span></div>
            ${matrixInputs('A', n, n, customA || defaults.A)}
          </div>
          <div class="ml-operator">${operation === 'add' ? '+' : operation === 'subtract' ? '−' : '×'}</div>
          <div class="ml-matrix-block">
            <div class="ml-matrix-label"><b>Matriz B</b><span>${n} × ${n}</span></div>
            ${matrixInputs('B', n, n, customB || defaults.B)}
          </div>
        </div>
      `;
    } else if (['determinant', 'inverse', 'transpose'].includes(operation)) {
      const defKey = operation === 'determinant' ? 'det' : operation === 'inverse' ? 'inv' : 'trans';
      box.innerHTML = `
        <div class="ml-matrix-block">
          <div class="ml-matrix-label"><b>Matriz A</b><span>${n} × ${n}</span></div>
          ${matrixInputs('A', n, n, customA || defaults[defKey])}
        </div>
      `;
    } else {
      box.innerHTML = `
        <div class="ml-matrix-label"><b>Coeficientes (A)</b><span>${n} equações · ${n} incógnitas</span></div>
        ${matrixInputs('A', n, n, customA || defaults.gaussA)}
        <div class="field-label">Termos independentes (b)</div>
        ${vectorInputs('b', n, defaults.gaussB)}
      `;
    }
  }

  function fillPreset(type) {
    const n = size;
    const make = fn => Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => fn(r, c)));
    let matA, matB;

    if (type === 'identity') {
      matA = make((r, c) => (r === c ? 1 : 0));
      matB = make((r, c) => (r === c ? 2 : 0));
    } else if (type === 'singular') {
      matA = make((r, c) => (r === 1 ? 2 * (c + 1) : c + 1 + r * 3));
      matB = make(() => 1);
    } else {
      matA = make(() => Math.floor(Math.random() * 11) - 4);
      matB = make(() => Math.floor(Math.random() * 11) - 4);
    }
    renderInputs(matA, matB);
  }

  function readMatrix(id, rows, cols) {
    const result = Array.from({ length: rows }, () => Array(cols).fill(0));
    document.querySelectorAll(`[data-matrix="${id}"]`).forEach(input => {
      const r = Number(input.dataset.row);
      const c = Number(input.dataset.col);
      result[r][c] = Number(input.value);
    });
    if (result.some(row => row.some(v => !Number.isFinite(v)))) {
      throw new Error('Preencha todos os campos com números válidos.');
    }
    return result;
  }

  function readVector(id, count) {
    const v = Array(count).fill(0);
    document.querySelectorAll(`[data-vector="${id}"]`).forEach(input => {
      v[Number(input.dataset.index)] = Number(input.value);
    });
    return v;
  }

  function matrixMarkup(M, title = '') {
    if (!M) return '';
    return `
      <div class="ml-output-block">
        ${title ? `<div class="ml-output-title">${esc(title)}</div>` : ''}
        <div class="ml-output-matrix" style="--cols:${M[0].length}">
          ${M.flat().map(v => `<span>${esc(MatrixLabMath.fmt(v))}</span>`).join('')}
        </div>
      </div>
    `;
  }

  function renderStepsList() {
    const listEl = $('#mlStepsList');
    if (!listEl) return;
    const visible = stepLimit === null ? lastSteps : lastSteps.slice(0, stepLimit);
    listEl.innerHTML = visible.map(s => `<li>${esc(s)}</li>`).join('');
    const counter = $('#mlStepCounter');
    if (counter) counter.textContent = `${visible.length} de ${lastSteps.length} etapas`;
  }

  function showResult(title, summary, content, steps = [], chartCallback = null) {
    const box = $('#mlResult');
    box.className = 'ml-result-content';
    lastSteps = steps;
    stepLimit = null;

    box.innerHTML = `
      <div class="ml-result-success">
        <span>✓</span>
        <div>
          <strong>${esc(title)}</strong>
          <small>${esc(summary)}</small>
        </div>
      </div>
      ${content}
      <div id="labDynamicChart"></div>
      <div class="ml-steps">
        <div class="matrix-title-row" style="margin-bottom:8px">
          <div class="ml-output-title" style="margin:0">Resolução passo a passo (<span id="mlStepCounter">${steps.length} de ${steps.length} etapas</span>)</div>
          <div style="display:flex;gap:6px">
            <button type="button" class="mini-chip" id="stepModeToggle">Modo Passo a Passo</button>
            <button type="button" class="mini-chip" id="stepNextBtn" hidden>Próximo passo →</button>
          </div>
        </div>
        <ol id="mlStepsList"></ol>
      </div>
    `;

    renderStepsList();
    if (typeof chartCallback === 'function') {
      chartCallback($('#labDynamicChart'));
    }

    const toggleBtn = $('#stepModeToggle');
    const nextBtn = $('#stepNextBtn');
    toggleBtn?.addEventListener('click', () => {
      if (stepLimit === null) {
        stepLimit = 1;
        toggleBtn.textContent = 'Mostrar tudo';
        nextBtn.hidden = false;
      } else {
        stepLimit = null;
        toggleBtn.textContent = 'Modo Passo a Passo';
        nextBtn.hidden = true;
      }
      renderStepsList();
    });

    nextBtn?.addEventListener('click', () => {
      if (stepLimit !== null && stepLimit < lastSteps.length) {
        stepLimit += 1;
        renderStepsList();
        if (stepLimit === lastSteps.length) nextBtn.hidden = true;
      }
    });
  }

  function calculate() {
    try {
      const n = size;
      let content = '';
      let steps = [];
      let title = '';
      let summary = '';
      let chartCb = null;

      if (operation === 'add' || operation === 'subtract') {
        const A = readMatrix('A', n, n);
        const B = readMatrix('B', n, n);
        const R = MatrixLabMath.add(A, B, operation === 'add' ? 1 : -1);
        title = `${labels[operation]} concluída`;
        summary = `Operação elemento a elemento em ordem ${n} × ${n}.`;
        content = matrixMarkup(R, 'Matriz Resultante');
        steps = [
          `Conferimos que A e B têm ordem ${n} × ${n}.`,
          ...R.map((row, i) => `Linha ${i + 1}: ${row.map((v, j) => `${MatrixLabMath.fmt(A[i][j])} ${operation === 'add' ? '+' : '−'} ${MatrixLabMath.fmt(B[i][j])} = ${MatrixLabMath.fmt(v)}`).join('; ')}.`)
        ];
        chartCb = host => window.MatrizandoCharts?.renderMatrixHeatmap(host, R, 'Mapa de Calor da Matriz Resultante');
      } else if (operation === 'multiply') {
        const A = readMatrix('A', n, n);
        const B = readMatrix('B', n, n);
        const R = MatrixLabMath.multiply(A, B);
        title = 'Multiplicação A × B concluída';
        summary = 'Produto interno entre cada linha de A e cada coluna de B.';
        content = matrixMarkup(R, 'Produto A × B');
        steps = [
          `Dimensões compatíveis (${n}×${n} · ${n}×${n}).`,
          ...R.map((row, i) =>
            row.map((v, j) => `c${i + 1},${j + 1} = ${A[i].map((x, k) => `(${MatrixLabMath.fmt(x)}·${MatrixLabMath.fmt(B[k][j])})`).join(' + ')} = ${MatrixLabMath.fmt(v)}`)
          ).flat()
        ];
        chartCb = host => window.MatrizandoCharts?.renderMatrixHeatmap(host, R, 'Mapa de Calor do Produto A × B');
      } else if (operation === 'transpose') {
        const A = readMatrix('A', n, n);
        const T = MatrixLabMath.transpose(A);
        title = 'Transposta Aᵀ calculada';
        summary = 'Linhas de A foram convertidas em colunas de Aᵀ.';
        content = matrixMarkup(T, 'Matriz Transposta Aᵀ');
        steps = [
          'Trocamos os índices de cada entrada: (Aᵀ)ᵢⱼ = Aⱼᵢ.',
          ...T.map((row, i) => `Nova linha ${i + 1} (antiga coluna ${i + 1}): [${row.map(MatrixLabMath.fmt).join(', ')}].`)
        ];
        chartCb = host => window.MatrizandoCharts?.renderMatrixHeatmap(host, T, 'Mapa de Intensidade de Aᵀ');
      } else if (operation === 'determinant') {
        const A = readMatrix('A', n, n);
        const result = MatrixLabMath.determinant(A);
        title = 'Determinante calculado';
        summary = result.value === 0 ? 'Matriz singular (não invertível).' : 'Matriz não singular (invertível).';
        content = `<div class="ml-number-result"><span>det(A)</span><strong>${MatrixLabMath.fmt(result.value)}</strong></div>`;
        steps = [
          'Reduzimos A à forma triangular superior via eliminação gaussiana.',
          ...result.steps,
          `Resultado final: det(A) = ${MatrixLabMath.fmt(result.value)}.`
        ];
        chartCb = host => window.MatrizandoCharts?.renderMatrixHeatmap(host, A, 'Distribuição dos Coeficientes de A');

        if (Math.abs(result.value) < 1e-10) {
          window.MatrizandoAgents?.reactToEvent(
            'matriz',
            'Reparei que det(A) = 0! Isso significa que uma linha é combinação linear das outras — geometricamente, esta matriz achata o espaço e não possui inversa.'
          );
        }
      } else if (operation === 'inverse') {
        const A = readMatrix('A', n, n);
        const result = MatrixLabMath.inverse(A);
        title = 'Matriz inversa A⁻¹ encontrada';
        summary = `det(A) = ${MatrixLabMath.fmt(result.determinant)} ≠ 0.`;
        content = matrixMarkup(result.value, 'Matriz Inversa A⁻¹');
        steps = [
          ...result.steps,
          'Verificação: A × A⁻¹ = I.'
        ];
        chartCb = host => window.MatrizandoCharts?.renderMatrixHeatmap(host, result.value, 'Mapa de Calor da Inversa A⁻¹');
      } else {
        const A = readMatrix('A', n, n);
        const b = readVector('b', n);
        const result = MatrixLabMath.gauss(A, b);
        title = result.message;
        summary = result.type === 'unique' ? 'Sistema classificado como SPD.' : 'Analise os pivôs da matriz escalonada.';
        content = matrixMarkup(result.matrix, 'Matriz Escalonada Reduzida [A | b]');
        if (result.type === 'unique') {
          const vars = ['x', 'y', 'z', 'w'];
          content += `
            <div class="ml-solution-grid">
              ${result.solution.map((v, i) => `<div><span>${vars[i] || `x${i + 1}`}</span><strong>${MatrixLabMath.fmt(v)}</strong></div>`).join('')}
            </div>
          `;
          chartCb = host => window.MatrizandoCharts?.renderBarChart(host, {
            title: 'Gráfico das Soluções do Sistema Linear',
            seriesA: 'Valor da Incógnita',
            items: result.solution.map((v, i) => ({
              label: vars[i] || `x${i + 1}`,
              value: Number(v.toFixed(3))
            }))
          });
        }
        steps = [...result.steps, result.message];
      }

      showResult(title, summary, content, steps, chartCb);
      window.MatrizandoStore?.markCompleted('laboratorio');
      window.MatrizandoStore?.setLiveContext({
        page: 'laboratorio',
        lastEvent: `lab_${operation}`,
        summary: `Executou ${labels[operation]} (${n}×${n}): ${title}.`
      });
    } catch (error) {
      const box = $('#mlResult');
      box.className = 'ml-error';
      box.innerHTML = `<strong>Não foi possível concluir a operação</strong><p>${esc(error.message)}</p>`;
      window.MatrizandoAgents?.reactToEvent(
        'matriz',
        `Ops! ${error.message} Dica: se você tentou inverter uma matriz com det(A) = 0, experimente clicar em "🎲 Aleatória" ou "Identidade (I)" para testar uma matriz invertível.`
      );
    }
  }

  function bind() {
    $('#backDashboardLab').onclick = () => window.MatrizandoNavigation.navigate('inicio');
    document.querySelectorAll('[data-op]').forEach(button => {
      button.addEventListener('click', () => {
        operation = button.dataset.op;
        render();
      });
    });
    $('#mlSize')?.addEventListener('change', event => {
      size = Number(event.target.value);
      renderInputs();
    });
    $('#mlCalculate')?.addEventListener('click', calculate);
    $('#mlExample')?.addEventListener('click', () => {
      renderInputs();
      window.MatrizandoNavigation?.showToast('Exemplo padrão restaurado.');
    });
    $('#presetIdentity')?.addEventListener('click', () => fillPreset('identity'));
    $('#presetRandom')?.addEventListener('click', () => fillPreset('random'));
    $('#presetSingular')?.addEventListener('click', () => fillPreset('singular'));
  }

  return { render };
})();
