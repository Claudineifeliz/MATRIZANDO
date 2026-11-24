// ==========================================================================
// MATRIZANDO — Ponto de Entrada, Controles IHC e Navegação por Teclado
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const store = window.MatrizandoStore;
  const nav = window.MatrizandoNavigation;
  const agents = window.MatrizandoAgents;

  function syncShellUI(state) {
    const initials = state.userName
      .split(/\s+/)
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase() || '')
      .join('') || 'ES';

    const rank = store.getRank();
    const rankPct = Math.min(100, Math.round((state.xp / rank.next) * 100));

    const nameEl = document.getElementById('userNameDisplay');
    const avatarEl = document.getElementById('userAvatar');
    const topAvatarEl = document.getElementById('topAvatar');
    const xpEl = document.getElementById('sidebarXp');
    const xpBarEl = document.getElementById('sidebarXpBar');
    const rankEl = document.getElementById('sidebarRank');

    if (nameEl) nameEl.textContent = state.userName;
    if (avatarEl) avatarEl.textContent = initials;
    if (topAvatarEl) topAvatarEl.textContent = initials;
    if (xpEl) xpEl.textContent = `${state.xp} XP`;
    if (xpBarEl) xpBarEl.style.width = `${rankPct}%`;
    if (rankEl) rankEl.textContent = rank.title;

    document.querySelectorAll('[data-nav-status]').forEach(tag => {
      const modId = tag.dataset.navStatus;
      const num = tag.textContent.replace(/[^0-9]/g, '');
      if (state.completedModules.includes(modId)) {
        tag.innerHTML = `<span class="nav-done-dot" title="Módulo concluído"></span> ${num}`;
      }
    });
  }

  store.subscribe(syncShellUI);
  syncShellUI(store.getState());

  const menuButton = document.getElementById('mobileMenu');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const sidebarToggle = document.getElementById('sidebarToggle');

  function toggleMobileMenu(forceState = null) {
    const open = forceState !== null ? forceState : !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', open);
    backdrop?.classList.toggle('open', open);
    menuButton?.setAttribute('aria-expanded', String(open));
  }

  function applySidebarCollapsed(collapsed, persist = false) {
    if (!sidebar) return;
    sidebar.classList.toggle('collapsed', collapsed);
    if (sidebarToggle) {
      sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
      sidebarToggle.setAttribute('aria-label', collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral');
      sidebarToggle.title = collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral';
    }
    if (persist) {
      store.setSidebarCollapsed(collapsed);
    }
  }

  applySidebarCollapsed(Boolean(store.getState().sidebarCollapsed), false);

  sidebarToggle?.addEventListener('click', event => {
    event.stopPropagation();
    const nextCollapsed = !sidebar.classList.contains('collapsed');
    applySidebarCollapsed(nextCollapsed, true);
  });

  sidebar?.addEventListener('click', event => {
    if (window.innerWidth <= 820) return;
    if (event.target.closest('button, a, input, select, textarea')) return;
    const nextCollapsed = !sidebar.classList.contains('collapsed');
    applySidebarCollapsed(nextCollapsed, true);
  });

  menuButton?.addEventListener('click', () => toggleMobileMenu());
  backdrop?.addEventListener('click', () => toggleMobileMenu(false));

  document.querySelectorAll('[data-scale-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const current = store.getState().fontScale;
      const action = btn.dataset.scaleAction;
      if (action === 'down') store.setFontScale(current - 0.06);
      else if (action === 'up') store.setFontScale(current + 0.06);
      else store.setFontScale(1);
      nav.showToast(`Escala de leitura ajustada para ${Math.round(store.getState().fontScale * 100)}%.`);
    });
  });

  const themeLabels = {
    dark: 'Escuro',
    light: 'Claro',
    contrast: 'Alto Contraste'
  };

  const themePicker = document.getElementById('themePicker');
  const themeBtn = document.getElementById('themeCycleBtn');
  const themeMenu = document.getElementById('themeMenu');

  function syncThemeMenuUI(activeTheme) {
    document.querySelectorAll('[data-theme-choice]').forEach(opt => {
      const isAct = opt.dataset.themeChoice === activeTheme;
      opt.classList.toggle('active', isAct);
      opt.setAttribute('aria-checked', String(isAct));
    });
  }

  function setThemeMenuOpen(open) {
    if (!themeMenu || !themeBtn) return;
    themeMenu.hidden = !open;
    themeBtn.setAttribute('aria-expanded', String(open));
    themeBtn.classList.toggle('active', open);
  }

  syncThemeMenuUI(store.getState().theme || 'dark');
  store.subscribe(state => syncThemeMenuUI(state.theme || 'dark'));

  themeBtn?.addEventListener('click', event => {
    event.stopPropagation();
    const willOpen = themeMenu ? themeMenu.hidden : false;
    setThemeMenuOpen(willOpen);
  });

  document.querySelectorAll('[data-theme-choice]').forEach(opt => {
    opt.addEventListener('click', () => {
      const chosen = opt.dataset.themeChoice;
      store.setTheme(chosen);
      setThemeMenuOpen(false);
      nav.showToast(`Tema visual: ${themeLabels[chosen] || chosen}.`);
      if (nav.getCurrentPage() === 'transformacoes') {
        window.TransformationsUI?.render();
      }
    });
  });

  document.addEventListener('click', event => {
    if (themeMenu && !themeMenu.hidden && !themePicker?.contains(event.target)) {
      setThemeMenuOpen(false);
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && themeMenu && !themeMenu.hidden) {
      setThemeMenuOpen(false);
      themeBtn?.focus();
    }
  });

  const openIntro = () => window.MatrizandoWelcome?.open();
  document.getElementById('replayIntroBtn')?.addEventListener('click', openIntro);
  document.getElementById('footerReplayIntro')?.addEventListener('click', openIntro);

  document.getElementById('footerSubscribeForm')?.addEventListener('submit', event => {
    event.preventDefault();
    const input = document.getElementById('footerEmailInput');
    const email = input?.value.trim();
    if (!email) return;
    input.value = '';
    nav.showToast(`Inscrição confirmada para ${email}! Novos desafios serão enviados.`);
  });

  document.querySelectorAll('[data-footer-social]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      nav.showToast(`Canal ${link.dataset.footerSocial} do MATRIZANDO Lab.`);
    });
  });

  document.querySelectorAll('[data-footer-info]').forEach(btn => {
    btn.addEventListener('click', () => {
      nav.showToast(btn.dataset.footerInfo);
    });
  });

  const scrollTopBtn = document.getElementById('scrollTopBtn');
  if (scrollTopBtn) {
    const toggleScrollBtn = () => {
      scrollTopBtn.classList.toggle('visible', window.scrollY > 220);
    };
    window.addEventListener('scroll', toggleScrollBtn, { passive: true });
    toggleScrollBtn();
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  document.getElementById('editUserBtn')?.addEventListener('click', () => {
    const currentName = store.getState().userName;
    const nextName = window.prompt('Como você gostaria de ser chamado no MATRIZANDO?', currentName);
    if (nextName && nextName.trim()) {
      store.setUserName(nextName);
      if (nav.getCurrentPage() === 'inicio') {
        nav.navigate('inicio');
      }
      nav.showToast(`Perfil atualizado: ${nextName.trim()}!`);
    }
  });

  document.addEventListener('keydown', event => {
    const cell = event.target;
    if (!cell.matches('.ml-cell[data-row], .hill-key-cell[data-r]')) return;

    const isLab = cell.hasAttribute('data-row');
    const rAttr = isLab ? 'data-row' : 'data-r';
    const cAttr = isLab ? 'data-col' : 'data-c';
    const r = Number(cell.getAttribute(rAttr));
    const c = Number(cell.getAttribute(cAttr));

    let nextR = r;
    let nextC = c;
    if (event.key === 'ArrowUp') nextR -= 1;
    else if (event.key === 'ArrowDown') nextR += 1;
    else if (event.key === 'ArrowLeft' && cell.selectionStart === 0) nextC -= 1;
    else if (event.key === 'ArrowRight' && cell.selectionEnd === cell.value.length) nextC += 1;
    else return;

    const container = cell.closest('.ml-matrix, .hill-matrix');
    const target = container?.querySelector(`[${rAttr}="${nextR}"][${cAttr}="${nextC}"]`);
    if (target) {
      event.preventDefault();
      target.focus();
      target.select();
    }
  });

  agents.init();
  nav.navigate('inicio');
  window.MatrizandoWelcome?.init();
});
