// ==========================================================================
// MATRIZANDO — Módulo 04: Transformações Visuais (Plano Cartesiano 2D Canvas)
// ==========================================================================

window.TransformationsUI = (() => {
  let mat = { a: 1, b: 0, c: 0, d: 1 };
  let shape = 'house';
  let angleDeg = 0;

  const shapes = {
    house: {
      label: 'Casa Assimétrica (mostra inversão)',
      points: [
        [0, 0], [1, 0], [1, 0.8], [0.5, 1.3], [0, 0.8]
      ]
    },
    square: {
      label: 'Quadrado Unitário [0,1]²',
      points: [
        [0, 0], [1, 0], [1, 1], [0, 1]
      ]
    },
    triangle: {
      label: 'Triângulo Vetorial',
      points: [
        [0, 0], [1.4, 0.2], [0.4, 1.2]
      ]
    },
    arrow: {
      label: 'Seta Direcional',
      points: [
        [0, 0.25], [0.9, 0.25], [0.9, 0], [1.4, 0.5], [0.9, 1], [0.9, 0.75], [0, 0.75]
      ]
    }
  };

  function transformPt([x, y]) {
    return [mat.a * x + mat.b * y, mat.c * x + mat.d * y];
  }

  function computeProperties() {
    const det = mat.a * mat.d - mat.b * mat.c;
    const trace = mat.a + mat.d;
    const disc = trace * trace - 4 * det;
    let eigenText = 'Complexos (rotação)';
    if (disc >= 0) {
      const l1 = (trace + Math.sqrt(disc)) / 2;
      const l2 = (trace - Math.sqrt(disc)) / 2;
      eigenText = `λ₁=${l1.toFixed(2)}, λ₂=${l2.toFixed(2)}`;
    }
    let orientation = 'Preservada (det > 0)';
    if (Math.abs(det) < 1e-6) orientation = 'Colapsada em reta/ponto (det = 0)';
    else if (det < 0) orientation = 'Invertida / Espelhada (det < 0)';

    return { det, trace, eigenText, orientation };
  }

  function render() {
    const page = document.getElementById('pageContent');
    if (!page) return;

    page.innerHTML = `
      <div class="module-header">
        <div>
          <div class="eyebrow"><span class="eyebrow-line"></span> MÓDULO 04 • GEOMETRIA LINEAR</div>
          <h1>Transformações <span>visuais 2D.</span></h1>
          <p class="welcome-copy">Veja em tempo real como uma matriz 2×2 deforma o espaço cartesiano, estica os vetores de base î e ĵ e altera a área proporcionalmente ao determinante.</p>
        </div>
        <div class="module-header-actions">
          <button class="back-dashboard" id="backDashboardTrans">← Visão geral</button>
        </div>
      </div>

      <div id="transAgentBanner"></div>

      <div class="trans-layout">
        <section class="panel" style="padding:16px">
          <div class="matrix-title-row" style="margin-bottom:10px;flex-wrap:wrap">
            <div>
              <span class="panel-overline">PLANO CARTESIANO EM TEMPO REAL</span>
              <h2 style="margin:3px 0 0;font:700 1.05rem var(--display)">Mapeamento Linear T(v) = M · v</h2>
            </div>

            <select id="transShapeSelect" class="hill-select" style="max-width:250px" aria-label="Escolher figura geométrica">
              ${Object.entries(shapes).map(([k, v]) => `<option value="${k}" ${shape === k ? 'selected' : ''}>${v.label}</option>`).join('')}
            </select>
          </div>

          <div class="canvas-stage">
            <canvas id="cartesianCanvas" aria-label="Gráfico cartesiano interativo da transformação linear"></canvas>
            <div class="canvas-hud">
              <span><b style="color:var(--cyan)">━▶ î'</b> = (${mat.a.toFixed(2)}, ${mat.c.toFixed(2)})ᵀ</span>
              <span><b style="color:var(--violet)">━▶ ĵ'</b> = (${mat.b.toFixed(2)}, ${mat.d.toFixed(2)})ᵀ</span>
              <span style="color:var(--muted)">Tracejado = Figura original</span>
            </div>
          </div>

          <div class="telemetry-grid" id="transTelemetry"></div>
        </section>

        <section class="panel crypto-panel">
          <div class="panel-overline">MATRIZ DE TRANSFORMAÇÃO</div>
          <h2>Ajuste os coeficientes</h2>
          <p class="crypto-muted">A primeira coluna define onde pousa o vetor î = (1,0)ᵀ; a segunda coluna define onde pousa ĵ = (0,1)ᵀ.</p>

          <div class="hill-matrix" style="--n:2">
            <input class="hill-key-cell" type="number" step="0.1" id="matA" value="${mat.a}" aria-label="Coeficiente a (linha 1, coluna 1)">
            <input class="hill-key-cell" type="number" step="0.1" id="matB" value="${mat.b}" aria-label="Coeficiente b (linha 1, coluna 2)">
            <input class="hill-key-cell" type="number" step="0.1" id="matC" value="${mat.c}" aria-label="Coeficiente c (linha 2, coluna 1)">
            <input class="hill-key-cell" type="number" step="0.1" id="matD" value="${mat.d}" aria-label="Coeficiente d (linha 2, coluna 2)">
          </div>

          <div class="slider-control">
            <div class="matrix-title-row">
              <label class="field-label" for="rotSlider" style="margin:0">Rotação Contínua (θ)</label>
              <span id="rotAngleLabel" style="font-family:var(--mono);font-size:0.82rem;color:var(--cyan)">${angleDeg}°</span>
            </div>
            <input type="range" id="rotSlider" min="0" max="360" step="5" value="${angleDeg}">
          </div>

          <div class="field-label">Transformações Clássicas (1 clique)</div>
          <div class="key-presets-bar">
            <button type="button" class="mini-chip" data-tpreset="identity">Identidade I</button>
            <button type="button" class="mini-chip" data-tpreset="scale">Escala 1.5×</button>
            <button type="button" class="mini-chip" data-tpreset="shear">Cisalhamento X</button>
            <button type="button" class="mini-chip" data-tpreset="reflectY">Reflexão Eixo Y</button>
            <button type="button" class="mini-chip" data-tpreset="collapse">Colapso (det=0)</button>
          </div>

          <div class="math-note" style="margin-top:16px">
            <strong>Intuição Geométrica</strong>
            <span>O valor absoluto |det(M)| indica quantas vezes a área da figura cresceu ou encolheu. Se det(M) &lt; 0, o espaço foi espelhado!</span>
          </div>
        </section>
      </div>
    `;

    bind();
    syncInputsAndDraw(false);

    window.MatrizandoAgents?.renderInlineBanner('transAgentBanner', 'vetor',
      'Olá! Sou a Dra. Vetor. Arraste o controle de rotação ou clique em "Reflexão Eixo Y" e "Colapso (det=0)" para enxergar com seus próprios olhos o significado geométrico de uma matriz!'
    );
  }

  function syncInputsAndDraw(notifyAgent = true) {
    const props = computeProperties();
    const tel = document.getElementById('transTelemetry');
    if (tel) {
      tel.innerHTML = `
        <div class="telemetry-card">
          <span>Determinante (Fator de Área)</span>
          <strong style="color:${props.det < 0 ? 'var(--coral)' : props.det === 0 ? 'var(--amber)' : 'var(--cyan)'}">
            det(M) = ${props.det.toFixed(2)}
          </strong>
        </div>
        <div class="telemetry-card">
          <span>Orientação do Espaço</span>
          <strong style="font-size:0.86rem;color:var(--text)">${props.orientation}</strong>
        </div>
        <div class="telemetry-card">
          <span>Traço Tr(M) = a + d</span>
          <strong>${props.trace.toFixed(2)}</strong>
        </div>
        <div class="telemetry-card">
          <span>Autovalores (λ)</span>
          <strong style="font-size:0.86rem;color:var(--violet)">${props.eigenText}</strong>
        </div>
      `;
    }

    const hud = document.querySelector('.canvas-hud');
    if (hud) {
      hud.innerHTML = `
        <span><b style="color:var(--cyan)">━▶ î'</b> = (${mat.a.toFixed(2)}, ${mat.c.toFixed(2)})ᵀ</span>
        <span><b style="color:var(--violet)">━▶ ĵ'</b> = (${mat.b.toFixed(2)}, ${mat.d.toFixed(2)})ᵀ</span>
        <span style="color:var(--muted)">Tracejado = Original</span>
      `;
    }

    drawCanvas(props);
    window.MatrizandoStore?.markCompleted('transformacoes');
    window.MatrizandoStore?.setLiveContext({
      page: 'transformacoes',
      summary: `Transformação 2D [[${mat.a.toFixed(2)}, ${mat.b.toFixed(2)}], [${mat.c.toFixed(2)}, ${mat.d.toFixed(2)}]] com det=${props.det.toFixed(2)}.`
    });

    if (notifyAgent) {
      if (Math.abs(props.det) < 1e-6) {
        window.MatrizandoAgents?.reactToEvent(
          'vetor',
          "Olhe no gráfico! Como det(M) = 0, os vetores î' e ĵ' ficaram colineares e toda a figura 2D foi esmagada em uma única reta (dimensão 1)!"
        );
      } else if (props.det < 0) {
        window.MatrizandoAgents?.reactToEvent(
          'vetor',
          `det(M) = ${props.det.toFixed(2)} (negativo)! Repare como a figura virou ao avesso — isso acontece sempre que uma transformação inverte a orientação do plano.`
        );
      }
    }
  }

  function drawCanvas(props) {
    const canvas = document.getElementById('cartesianCanvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(300, rect.width || 600);
    const h = 440;
    canvas.width = w * dpr;
    canvas.height = h * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const style = getComputedStyle(document.documentElement);
    const bg = style.getPropertyValue('--input-bg').trim() || '#0c1627';
    const gridColor = style.getPropertyValue('--line').trim() || '#22344f';
    const axisColor = style.getPropertyValue('--muted').trim() || '#93a7c4';
    const cyan = style.getPropertyValue('--cyan').trim() || '#38bdf8';
    const violet = style.getPropertyValue('--violet').trim() || '#a78bfa';
    const coral = style.getPropertyValue('--coral').trim() || '#fb7185';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const unit = Math.min(w, h) / 7;
    const toPx = ([x, y]) => [cx + x * unit, cy - y * unit];

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let gx = -8; gx <= 8; gx++) {
      const [px] = toPx([gx, 0]);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
      ctx.stroke();
    }
    for (let gy = -6; gy <= 6; gy++) {
      const [, py] = toPx([0, gy]);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
      ctx.stroke();
    }

    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.stroke();

    const p0 = toPx([0, 0]);
    const pi = toPx([mat.a, mat.c]);
    const pij = toPx([mat.a + mat.b, mat.c + mat.d]);
    const pj = toPx([mat.b, mat.d]);

    ctx.fillStyle = props.det < 0 ? 'rgba(225, 14, 23, 0.18)' : 'rgba(216, 179, 106, 0.16)';
    ctx.beginPath();
    ctx.moveTo(...p0);
    ctx.lineTo(...pi);
    ctx.lineTo(...pij);
    ctx.lineTo(...pj);
    ctx.closePath();
    ctx.fill();

    const pts = shapes[shape].points;
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    pts.forEach((pt, idx) => {
      const [px, py] = toPx(pt);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    const tPts = pts.map(transformPt);
    ctx.fillStyle = 'rgba(216, 179, 106, 0.22)';
    ctx.strokeStyle = cyan;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    tPts.forEach((pt, idx) => {
      const [px, py] = toPx(pt);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    function drawVector(from, to, color, label) {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(from[0], from[1]);
      ctx.lineTo(to[0], to[1]);
      ctx.stroke();

      const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
      const head = 10;
      ctx.beginPath();
      ctx.moveTo(to[0], to[1]);
      ctx.lineTo(to[0] - head * Math.cos(angle - Math.PI / 6), to[1] - head * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(to[0] - head * Math.cos(angle + Math.PI / 6), to[1] - head * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();

      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.fillText(label, to[0] + 8, to[1] - 8);
    }

    drawVector(p0, pi, cyan, "î'");
    drawVector(p0, pj, props.det < 0 ? coral : violet, "ĵ'");
  }

  function applyMatrix(next, notify = true) {
    mat = { ...next };
    document.getElementById('matA').value = Number(mat.a.toFixed(3));
    document.getElementById('matB').value = Number(mat.b.toFixed(3));
    document.getElementById('matC').value = Number(mat.c.toFixed(3));
    document.getElementById('matD').value = Number(mat.d.toFixed(3));
    syncInputsAndDraw(notify);
  }

  function bind() {
    document.getElementById('backDashboardTrans').onclick = () => window.MatrizandoNavigation.navigate('inicio');

    document.getElementById('transShapeSelect').onchange = e => {
      shape = e.target.value;
      syncInputsAndDraw(false);
    };

    ['matA', 'matB', 'matC', 'matD'].forEach(id => {
      document.getElementById(id).oninput = () => {
        mat = {
          a: Number(document.getElementById('matA').value) || 0,
          b: Number(document.getElementById('matB').value) || 0,
          c: Number(document.getElementById('matC').value) || 0,
          d: Number(document.getElementById('matD').value) || 0
        };
        syncInputsAndDraw(true);
      };
    });

    document.getElementById('rotSlider').oninput = e => {
      angleDeg = Number(e.target.value);
      document.getElementById('rotAngleLabel').textContent = `${angleDeg}°`;
      const rad = (angleDeg * Math.PI) / 180;
      applyMatrix({
        a: Math.cos(rad),
        b: -Math.sin(rad),
        c: Math.sin(rad),
        d: Math.cos(rad)
      }, false);
    };

    document.querySelectorAll('[data-tpreset]').forEach(btn => {
      btn.onclick = () => {
        const p = btn.dataset.tpreset;
        angleDeg = 0;
        document.getElementById('rotSlider').value = 0;
        document.getElementById('rotAngleLabel').textContent = '0°';

        if (p === 'identity') applyMatrix({ a: 1, b: 0, c: 0, d: 1 }, false);
        if (p === 'scale') applyMatrix({ a: 1.5, b: 0, c: 0, d: 1.5 }, false);
        if (p === 'shear') applyMatrix({ a: 1, b: 0.8, c: 0, d: 1 }, false);
        if (p === 'reflectY') applyMatrix({ a: -1, b: 0, c: 0, d: 1 }, true);
        if (p === 'collapse') applyMatrix({ a: 1.4, b: 0.7, c: 0.8, d: 0.4 }, true);
      };
    });

    window.addEventListener('resize', () => {
      if (document.getElementById('cartesianCanvas')) {
        drawCanvas(computeProperties());
      }
    });
  }

  return { render };
})();
