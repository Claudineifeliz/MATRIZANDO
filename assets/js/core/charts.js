// ==========================================================================
// MATRIZANDO — Biblioteca de Gráficos SVG Limpos, Diretos e Didáticos
// ==========================================================================

window.MatrizandoCharts = (() => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  let chartSeq = 0;

  function renderBarChart(container, {
    title,
    subtitle = '',
    items,
    seriesA = 'Série A',
    seriesB = null,
    unit = ''
  }) {
    if (!container) return;
    if (!items || !items.length) {
      container.innerHTML = '';
      return;
    }

    const uid = `mchart_${++chartSeq}`;
    const hasDual = seriesB !== null;
    let activeFilter = 'both';

    const totalA = items.reduce((s, it) => s + Math.abs(it.value || 0), 0);
    const totalB = hasDual ? items.reduce((s, it) => s + Math.abs(it.valueB || 0), 0) : 0;
    const topA = [...items].sort((x, y) => Math.abs(y.value || 0) - Math.abs(x.value || 0))[0];

    const pctOf = (val, total) => (total > 0 ? Math.round((Math.abs(val) / total) * 100) : 0);

    function formatInsight(item) {
      if (!item) return '';
      if (!hasDual) {
        return `<strong>${esc(item.label)}</strong>: valor <b>${item.value}${esc(unit)}</b>.`;
      }
      const vA = item.value || 0;
      const vB = item.valueB || 0;
      const pA = pctOf(vA, totalA);
      const pB = pctOf(vB, totalB);
      if (vA > 0 && vB === 0) {
        return `Letra <strong>"${esc(item.label)}"</strong>: aparecia <b>${vA}×</b> no texto original (${pA}%) e zerou no texto cifrado.`;
      }
      if (vA === 0 && vB > 0) {
        return `Letra <strong>"${esc(item.label)}"</strong>: não estava no texto original e passou a aparecer <b>${vB}×</b> no cifrado (${pB}%).`;
      }
      return `Letra <strong>"${esc(item.label)}"</strong>: <b>${vA}×</b> no original (${pA}%) → <b>${vB}×</b> no cifrado (${pB}%).`;
    }

    function buildSvg(filterMode) {
      const showA = !hasDual || filterMode === 'both' || filterMode === 'a';
      const showB = hasDual && (filterMode === 'both' || filterMode === 'b');
      const bothVisible = showA && showB;

      const width = 720;
      const height = 248;
      const padL = 42;
      const padR = 16;
      const padT = 24;
      const padB = 36;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;

      const visibleValues = items.flatMap(it => [
        showA ? Math.abs(it.value || 0) : 0,
        showB ? Math.abs(it.valueB || 0) : 0
      ]);
      const rawMax = Math.max(1, ...visibleValues);
      const maxVal = rawMax <= 5 ? Math.ceil(rawMax) : Math.ceil(rawMax / 2) * 2;
      const tickCount = Math.min(5, Math.max(2, maxVal));

      let gridSvg = '';
      for (let t = 0; t <= tickCount; t++) {
        const val = (maxVal * t) / tickCount;
        const y = padT + plotH - (val / maxVal) * plotH;
        const label = Number.isInteger(val) ? `${val}${unit || (hasDual ? '×' : '')}` : val.toFixed(1);
        gridSvg += `
          <line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}"
                stroke="var(--line)" stroke-width="1" ${t === 0 ? '' : 'stroke-dasharray="3 4"'}/>
          <text x="${padL - 8}" y="${(y + 3.5).toFixed(1)}" text-anchor="end"
                fill="var(--muted)" font-size="10.5" font-family="var(--mono)">${esc(label)}</text>
        `;
      }

      const groupW = plotW / items.length;
      let barsSvg = '';

      items.forEach((item, idx) => {
        const gx = padL + idx * groupW;
        const cx = gx + groupW / 2;
        const valA = item.value || 0;
        const valB = item.valueB || 0;
        const barW = bothVisible ? Math.min(18, Math.max(10, groupW * 0.32)) : Math.min(28, Math.max(14, groupW * 0.48));
        const gap = bothVisible ? 4 : 0;

        let inner = `
          <rect class="bar-col-bg" x="${(gx + 3).toFixed(1)}" y="${(padT - 4).toFixed(1)}"
                width="${Math.max(12, groupW - 6).toFixed(1)}" height="${(plotH + 30).toFixed(1)}"
                rx="6" fill="var(--panel-hover)" opacity="0"/>
        `;

        if (showA && Math.abs(valA) > 0) {
          const hA = Math.max(4, (Math.abs(valA) / maxVal) * plotH);
          const yA = padT + plotH - hA;
          const xA = bothVisible ? cx - barW - gap / 2 : cx - barW / 2;
          inner += `
            <rect x="${xA.toFixed(1)}" y="${yA.toFixed(1)}" width="${barW.toFixed(1)}" height="${hA.toFixed(1)}"
                  rx="4" fill="var(--cyan)">
              <title>${esc(item.label)} (${esc(seriesA)}): ${valA}${esc(unit)}</title>
            </rect>
            <text x="${(xA + barW / 2).toFixed(1)}" y="${Math.max(12, yA - 6).toFixed(1)}"
                  text-anchor="middle" fill="var(--text-secondary)" font-size="10.5" font-weight="600" font-family="var(--mono)">
              ${valA}${esc(unit)}
            </text>
          `;
        }

        if (showB && Math.abs(valB) > 0) {
          const hB = Math.max(4, (Math.abs(valB) / maxVal) * plotH);
          const yB = padT + plotH - hB;
          const xB = bothVisible ? cx + gap / 2 : cx - barW / 2;
          inner += `
            <rect x="${xB.toFixed(1)}" y="${yB.toFixed(1)}" width="${barW.toFixed(1)}" height="${hB.toFixed(1)}"
                  rx="4" fill="var(--violet)">
              <title>${esc(item.label)} (${esc(seriesB)}): ${valB}${esc(unit)}</title>
            </rect>
            <text x="${(xB + barW / 2).toFixed(1)}" y="${Math.max(12, yB - 6).toFixed(1)}"
                  text-anchor="middle" fill="var(--violet)" font-size="10.5" font-weight="600" font-family="var(--mono)">
              ${valB}${esc(unit)}
            </text>
          `;
        }

        inner += `
          <text x="${cx.toFixed(1)}" y="${(padT + plotH + 20).toFixed(1)}"
                text-anchor="middle" fill="var(--text)" font-size="11.5" font-weight="700" font-family="var(--mono)">
            ${esc(item.label)}
          </text>
        `;

        barsSvg += `
          <g class="bar-group-item" data-bar-idx="${idx}" tabindex="0" role="button"
             aria-label="${esc(item.label)}: ${esc(seriesA)} ${valA}${hasDual ? `, ${esc(seriesB)} ${valB}` : ''}">
            ${inner}
          </g>
        `;
      });

      return `
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">
          ${gridSvg}
          <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="var(--line)" stroke-width="1"/>
          ${barsSvg}
        </svg>
      `;
    }

    const defaultItem = topA || items[0];
    container.innerHTML = `
      <div class="chart-card">
        <div class="chart-card-head">
          <div>
            <h4>${esc(title)}</h4>
            ${subtitle ? `<p class="chart-sub">${esc(subtitle)}</p>` : ''}
          </div>
          <div class="chart-head-right">
            <div class="chart-legend">
              <span><i style="background:var(--cyan)"></i> ${esc(seriesA)}</span>
              ${hasDual ? `<span><i style="background:var(--violet)"></i> ${esc(seriesB)}</span>` : ''}
            </div>
            ${hasDual ? `
              <div class="chart-filter-bar" role="group" aria-label="Filtrar séries">
                <button type="button" class="chart-filter-btn active" data-cfilter="both">Comparar</button>
                <button type="button" class="chart-filter-btn" data-cfilter="a">${esc(seriesA)}</button>
                <button type="button" class="chart-filter-btn" data-cfilter="b">${esc(seriesB)}</button>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="svg-chart-wrap" id="${uid}_stage">
          ${buildSvg(activeFilter)}
        </div>

        <div class="chart-readout" id="${uid}_insight" aria-live="polite">
          ${formatInsight(defaultItem)}
        </div>
      </div>
    `;

    const stage = document.getElementById(`${uid}_stage`);
    const readout = document.getElementById(`${uid}_insight`);

    function bindHover() {
      stage?.querySelectorAll('.bar-group-item').forEach(g => {
        const activate = () => {
          stage.querySelectorAll('.bar-group-item').forEach(x => x.classList.remove('active'));
          g.classList.add('active');
          const idx = Number(g.dataset.barIdx);
          if (readout && items[idx]) {
            readout.innerHTML = formatInsight(items[idx]);
          }
        };
        g.addEventListener('mouseenter', activate);
        g.addEventListener('focus', activate);
        g.addEventListener('click', activate);
      });
    }

    container.querySelectorAll('[data-cfilter]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeFilter = btn.dataset.cfilter;
        container.querySelectorAll('[data-cfilter]').forEach(b => b.classList.toggle('active', b === btn));
        if (stage) {
          stage.innerHTML = buildSvg(activeFilter);
          bindHover();
        }
      });
    });

    bindHover();
  }

  function renderMatrixHeatmap(container, matrix, title = 'Mapa de Intensidade Matricial') {
    if (!container || !Array.isArray(matrix) || !matrix.length) return;
    const cols = matrix[0].length;
    const flat = matrix.flat();
    const maxAbs = Math.max(1, ...flat.map(v => Math.abs(v)));

    const cellsHtml = flat.map(val => {
      const ratio = Math.min(1, Math.abs(val) / maxAbs);
      const alpha = (0.12 + ratio * 0.52).toFixed(2);
      const bg = val >= 0
        ? `rgba(216, 179, 106, ${alpha})`
        : `rgba(225, 14, 23, ${alpha})`;
      const formatted = Math.abs(val) < 1e-10 ? '0' : Number(val.toFixed(3)).toString();
      return `<div class="heatmap-cell" style="background:${bg}" title="Valor: ${formatted}">${esc(formatted)}</div>`;
    }).join('');

    container.innerHTML = `
      <div class="chart-card">
        <div class="chart-card-head">
          <h4>${esc(title)}</h4>
          <div class="chart-legend">
            <span><i style="background:var(--cyan)"></i> Positivo</span>
            <span><i style="background:var(--coral)"></i> Negativo</span>
          </div>
        </div>
        <div class="heatmap-grid" style="grid-template-columns: repeat(${cols}, minmax(0, 1fr))">
          ${cellsHtml}
        </div>
      </div>
    `;
  }

  function renderRadarChart(container, axes) {
    if (!container || !axes || axes.length < 3) return;
    const size = 280;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 92;
    const n = axes.length;

    const pointAt = (idx, pct) => {
      const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
      const r = radius * Math.max(0.08, Math.min(1, pct));
      return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    };

    const rings = [0.25, 0.5, 0.75, 1].map(level => {
      const pts = axes.map((_, i) => pointAt(i, level).map(v => v.toFixed(1)).join(',')).join(' ');
      return `<polygon points="${pts}" fill="none" stroke="var(--line)" stroke-width="1"/>`;
    }).join('');

    const spokes = axes.map((ax, i) => {
      const [x, y] = pointAt(i, 1);
      const [lx, ly] = pointAt(i, 1.24);
      return `
        <line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)" stroke-width="1"/>
        <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle"
              fill="var(--text-secondary)" font-size="11" font-weight="600">${esc(ax.label)}</text>
      `;
    }).join('');

    const dataPts = axes.map((ax, i) => pointAt(i, ax.value).map(v => v.toFixed(1)).join(',')).join(' ');
    const dots = axes.map((ax, i) => {
      const [x, y] = pointAt(i, ax.value);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="var(--cyan)" stroke="var(--panel)" stroke-width="1.5"/>`;
    }).join('');

    container.innerHTML = `
      <div class="svg-chart-wrap">
        <svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Radar de desempenho por tópico">
          ${rings}
          ${spokes}
          <polygon points="${dataPts}" fill="rgba(216, 179, 106, 0.24)" stroke="var(--cyan)" stroke-width="2"/>
          ${dots}
        </svg>
      </div>
    `;
  }

  return { renderBarChart, renderMatrixHeatmap, renderRadarChart };
})();
