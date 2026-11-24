// ==========================================================================
// MATRIZANDO — Gerenciador de Estado, Persistência e Telemetria de Aprendizado
// ==========================================================================

window.MatrizandoStore = (() => {
  const STORAGE_KEY = 'matrizando_state_v2';

  const defaultState = {
    userName: 'Estudante',
    theme: 'dark',
    fontScale: 1,
    sidebarCollapsed: false,
    agentPosition: null,
    xp: 0,
    visitedModules: [],
    completedModules: [],
    solvedCases: [],
    completedLessons: [],
    challengeStats: {
      operacoes: { correct: 0, total: 0 },
      determinantes: { correct: 0, total: 0 },
      sistemas: { correct: 0, total: 0 },
      criptografia: { correct: 0, total: 0 }
    },
    streak: 0
  };

  let state = load();
  const listeners = new Set();

  let liveContext = {
    page: 'inicio',
    lastEvent: null,
    summary: 'O estudante está na Visão Geral explorando os módulos disponíveis.'
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(defaultState);
      const parsed = JSON.parse(raw);
      return {
        ...structuredClone(defaultState),
        ...parsed,
        challengeStats: {
          ...structuredClone(defaultState.challengeStats),
          ...(parsed.challengeStats || {})
        }
      };
    } catch {
      return structuredClone(defaultState);
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignora falhas de storage em navegação privada restrita
    }
    listeners.forEach(fn => fn(state));
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function getState() {
    return state;
  }

  function setUserName(name) {
    const clean = String(name || '').trim().slice(0, 28);
    if (!clean) return;
    state.userName = clean;
    save();
  }

  function setTheme(theme) {
    if (!['dark', 'light', 'contrast'].includes(theme)) return;
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? '' : theme);
    save();
  }

  function setFontScale(scale) {
    const clamped = Math.max(0.88, Math.min(1.22, Number(scale) || 1));
    state.fontScale = Number(clamped.toFixed(2));
    document.documentElement.style.setProperty('--scale', String(state.fontScale));
    save();
  }

  function setSidebarCollapsed(collapsed) {
    state.sidebarCollapsed = Boolean(collapsed);
    save();
  }

  function setAgentPosition(pos) {
    if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
      state.agentPosition = { x: Math.round(pos.x), y: Math.round(pos.y) };
    } else {
      state.agentPosition = null;
    }
    save();
  }

  function addXP(points, reason = '') {
    state.xp = Math.max(0, state.xp + points);
    save();
    if (reason && window.MatrizandoNavigation?.showToast) {
      window.MatrizandoNavigation.showToast(`+${points} XP — ${reason}`);
    }
  }

  function markVisited(moduleId) {
    if (!moduleId || moduleId === 'inicio') return;
    if (!state.visitedModules.includes(moduleId)) {
      state.visitedModules.push(moduleId);
      state.xp += 15;
      save();
    }
  }

  function markCompleted(moduleId) {
    if (!moduleId || moduleId === 'inicio') return;
    if (!state.completedModules.includes(moduleId)) {
      state.completedModules.push(moduleId);
      state.xp += 50;
      save();
    }
  }

  function markCaseSolved(caseId) {
    if (!state.solvedCases.includes(caseId)) {
      state.solvedCases.push(caseId);
      addXP(45, 'Caso investigativo resolvido!');
    }
    if (state.solvedCases.length >= 2) {
      markCompleted('investigacao');
    }
  }

  function toggleLessonCompleted(lessonId) {
    const idx = state.completedLessons.indexOf(lessonId);
    if (idx === -1) {
      state.completedLessons.push(lessonId);
      addXP(25, 'Lição concluída!');
    } else {
      state.completedLessons.splice(idx, 1);
      save();
    }
    if (state.completedLessons.length >= 3) {
      markCompleted('aprendizagem');
    }
  }

  function recordChallenge(topic, isCorrect) {
    const bucket = state.challengeStats[topic] || { correct: 0, total: 0 };
    bucket.total += 1;
    if (isCorrect) {
      bucket.correct += 1;
      state.streak += 1;
      addXP(30 + Math.min(state.streak * 5, 25), 'Desafio acertado!');
    } else {
      state.streak = 0;
      save();
    }
    state.challengeStats[topic] = bucket;
    const totalCorrect = Object.values(state.challengeStats).reduce((s, b) => s + b.correct, 0);
    if (totalCorrect >= 4) {
      markCompleted('desafios');
    } else {
      save();
    }
  }

  function getRank() {
    const xp = state.xp;
    if (xp >= 500) return { title: 'Arquiteto de Espaços Vetoriais', next: 800 };
    if (xp >= 280) return { title: 'Estrategista Matricial', next: 500 };
    if (xp >= 120) return { title: 'Analista Linear', next: 280 };
    return { title: 'Explorador de Vetores', next: 120 };
  }

  function setLiveContext(patch) {
    liveContext = { ...liveContext, ...patch };
  }

  function getLiveContext() {
    return liveContext;
  }

  function resetProgress() {
    const keepName = state.userName;
    const keepTheme = state.theme;
    const keepScale = state.fontScale;
    const keepCollapsed = state.sidebarCollapsed;
    const keepAgentPos = state.agentPosition;
    state = {
      ...structuredClone(defaultState),
      userName: keepName,
      theme: keepTheme,
      fontScale: keepScale,
      sidebarCollapsed: keepCollapsed,
      agentPosition: keepAgentPos
    };
    save();
  }

  if (state.theme && state.theme !== 'dark') {
    document.documentElement.setAttribute('data-theme', state.theme);
  }
  if (state.fontScale && state.fontScale !== 1) {
    document.documentElement.style.setProperty('--scale', String(state.fontScale));
  }

  return {
    getState,
    subscribe,
    setUserName,
    setTheme,
    setFontScale,
    setSidebarCollapsed,
    setAgentPosition,
    addXP,
    markVisited,
    markCompleted,
    markCaseSolved,
    toggleLessonCompleted,
    recordChallenge,
    getRank,
    setLiveContext,
    getLiveContext,
    resetProgress
  };
})();
