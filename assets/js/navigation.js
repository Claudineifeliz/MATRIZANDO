// ==========================================================================
// MATRIZANDO — Roteamento SPA, Dashboard Dinâmico e Sincronização de Progresso
// ==========================================================================

window.MatrizandoNavigation = (() => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const pageNames = {
    inicio: 'Visão geral',
    criptografia: 'Central de criptografia',
    investigacao: 'Sala de investigação',
    laboratorio: 'Laboratório de matrizes',
    transformacoes: 'Transformações visuais',
    desafios: 'Arena de desafios',
    aprendizagem: 'Central de aprendizagem'
  };

  let currentPage = 'inicio';

  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 3400);
  }

  function renderDashboard() {
    const content = document.getElementById('pageContent');
    if (!content) return;

    const state = window.MatrizandoStore.getState();
    const modules = window.MatrizandoModules || [];
    const completedCount = state.completedModules.length;
    const pct = Math.round((completedCount / Math.max(1, modules.length)) * 100);

    content.innerHTML = `
      <div class="welcome-row" id="welcomeHero">
        <div>
          <div class="eyebrow"><span class="rog-slashes" aria-hidden="true"><i></i><i></i><i></i><i></i></span> LABORATÓRIO INTERATIVO • 6 EXPERIÊNCIAS ATIVAS</div>
          <h1>Explore. Experimente.<br><span>Descubra a matemática.</span></h1>
          <p class="welcome-copy">
            Olá, <b>${esc(state.userName)}</b>! Transforme conceitos de Álgebra Linear em experiências visuais, criptográficas e interativas com acompanhamento em tempo real.
          </p>
        </div>

        <div class="welcome-art" aria-hidden="true">
          <div class="orbit orbit-one"></div>
          <div class="orbit orbit-two"></div>
          <div class="matrix-card">
            <span>A =</span>
            <div class="matrix-grid">
              <b>2</b><b>1</b><b>0</b>
              <b>3</b><b>−1</b><b>4</b>
              <b>1</b><b>0</b><b>2</b>
            </div>
          </div>
          <span class="art-dot dot-one"></span>
          <span class="art-dot dot-two"></span>
        </div>
      </div>

      <div class="quick-start" id="quickStartBanner">
        <div class="quick-start-icon" aria-hidden="true">✦</div>
        <div class="quick-start-body">
          <strong>Não sabe por onde começar?</strong>
          <p>Inicie pela Central de Criptografia, explore transformações 2D em tempo real ou faça um tour guiado com o Professor Matriz.</p>
        </div>
        <div class="quick-start-actions">
          <button type="button" id="heroTourBtn">Guiar esta tela</button>
          <button type="button" data-page="criptografia">Primeira experiência →</button>
        </div>
      </div>

      <div class="section-heading">
        <div>
          <h2>Seu espaço de exploração</h2>
          <p>Todos os 6 módulos estão liberados e sincronizados com seu progresso.</p>
        </div>
        <span class="section-kicker">06 MÓDULOS FUNCIONAIS</span>
      </div>

      <div class="module-grid" id="moduleGrid">
        ${modules.map(mod => {
          const isDone = state.completedModules.includes(mod.id);
          const isVisited = state.visitedModules.includes(mod.id);
          const statusLabel = isDone
            ? 'Concluído'
            : isVisited
              ? 'Em andamento'
              : mod.featured
                ? 'Recomendado'
                : 'Disponível';

          return `
            <article class="module-card ${mod.featured ? 'featured' : ''}" data-page="${esc(mod.id)}" tabindex="0" role="button" aria-label="Abrir ${esc(mod.title)}">
              <div class="card-top">
                <span class="module-icon ${esc(mod.color)}" aria-hidden="true">${mod.icon}</span>
                <span class="module-number">${esc(mod.number)} / ${esc(mod.category)}</span>
              </div>
              <h3>${esc(mod.title)}</h3>
              <p>${esc(mod.description)}</p>
              <div class="card-bottom">
                <span class="card-status ${isDone ? 'completed' : ''}"><i></i> ${statusLabel}</span>
                <span class="card-arrow" aria-hidden="true">↗</span>
              </div>
            </article>
          `;
        }).join('')}
      </div>

      <section class="bottom-grid">
        <div class="panel progress-panel" id="progressPanel">
          <div class="panel-heading">
            <div>
              <span class="panel-overline">SUA JORNADA</span>
              <h3>Progresso de exploração</h3>
            </div>
            <span class="progress-label">${pct}%</span>
          </div>
          <div class="progress-track"><span style="width:${pct}%"></span></div>
          <div class="progress-meta">
            <span>${completedCount === 0 ? 'Conclua atividades nos módulos para avançar' : 'Excelente ritmo de aprendizado!'}</span>
            <span>${completedCount} de ${modules.length} módulos concluídos</span>
          </div>
        </div>

        <div class="panel quote-panel">
          <span class="quote-mark" aria-hidden="true">“</span>
          <p>As matrizes são uma linguagem poderosa para representar dados, transformar o espaço e proteger informações.</p>
          <span class="quote-caption">ÁLGEBRA LINEAR • COMPUTAÇÃO • DESCOBERTA</span>
        </div>
      </section>
    `;

    document.getElementById('heroTourBtn')?.addEventListener('click', () => {
      window.MatrizandoAgents?.runSpotlightTour();
    });

    window.MatrizandoStore?.setLiveContext({
      page: 'inicio',
      summary: `Visão geral com ${completedCount} de ${modules.length} módulos concluídos e ${state.xp} XP.`
    });
  }

  function setActive(page) {
    currentPage = page;
    const label = pageNames[page] || 'Visão geral';
    const crumb = document.getElementById('breadcrumbCurrent');
    if (crumb) crumb.textContent = label;

    const footerCrumb = document.getElementById('footerBreadcrumbPage');
    if (footerCrumb) footerCrumb.textContent = label.toUpperCase();

    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });

    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarBackdrop')?.classList.remove('open');
  }

  function navigate(page) {
    if (!pageNames[page]) return;
    if (page !== 'criptografia') {
      window.HillCryptoUI?.stopLessonPlayback?.();
    }
    setActive(page);
    window.MatrizandoStore?.markVisited(page);

    if (page === 'inicio') renderDashboard();
    else if (page === 'criptografia') window.HillCryptoUI?.render();
    else if (page === 'investigacao') window.InvestigationUI?.render();
    else if (page === 'laboratorio') window.MatrixLabUI?.render();
    else if (page === 'transformacoes') window.TransformationsUI?.render();
    else if (page === 'desafios') window.ChallengesUI?.render();
    else if (page === 'aprendizagem') window.LearningUI?.render();

    document.getElementById('pageContent')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-page]');
    if (trigger) {
      event.preventDefault();
      navigate(trigger.dataset.page);
    }
  });

  document.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.module-card[data-page]')) {
      event.preventDefault();
      navigate(event.target.dataset.page);
    }
  });

  return {
    navigate,
    showToast,
    getCurrentPage: () => currentPage
  };
})();
