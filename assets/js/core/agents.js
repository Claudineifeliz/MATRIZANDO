// ==========================================================================
// MATRIZANDO — Agentes Pedagógicos Imersivos (Prof. Matriz, Dra. Vetor, Cipher)
// ==========================================================================

window.MatrizandoAgents = (() => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const profiles = {
    matriz: {
      key: 'matriz',
      name: 'Professor Matriz',
      shortName: 'Prof. Matriz',
      role: 'Mentor Principal de Álgebra Linear',
      symbol: '✦',
      greeting: 'Olá! Estou bem aqui ao seu lado. Posso analisar o que você acabou de calcular, explicar conceitos ou guiar você pelos botões desta tela.'
    },
    vetor: {
      key: 'vetor',
      name: 'Dra. Vetor',
      shortName: 'Dra. Vetor',
      role: 'Especialista em Geometria & Transformações',
      symbol: '◇',
      greeting: 'Oi! Eu enxergo matrizes como movimentos no espaço. Pergunte sobre rotações, áreas, determinantes negativos ou autovalores!'
    },
    cipher: {
      key: 'cipher',
      name: 'Agente Cipher',
      shortName: 'Agente Cipher',
      role: 'Especialista em Criptografia & Investigação',
      symbol: '⌑',
      greeting: 'Saudações, criptoanalista! Ajudo você com aritmética módulo 26, inversas modulares e pistas para decifrar mensagens ocultas.'
    }
  };

  const moduleConcepts = {
    inicio: 'A Álgebra Linear conecta tabelas numéricas (matrizes) a transformações espaciais, sistemas lineares e criptografia moderna. Escolha qualquer um dos 6 módulos para experimentar.',
    criptografia: 'Na Cifra de Hill, cada bloco de n letras vira um vetor-coluna multiplicado por K (mod 26). Para decifrar, precisamos de K⁻¹, que só existe quando mdc(det(K), 26) = 1.',
    investigacao: 'Na criptoanálise de Hill, pares conhecidos de texto claro e texto cifrado permitem montar sistemas lineares mod 26 para descobrir a matriz-chave secreta.',
    laboratorio: 'Operações elementares nas linhas (trocar, escalonar e somar múltiplos) preservam a solução de sistemas lineares e revelam o posto e a invertibilidade da matriz.',
    transformacoes: 'Toda matriz 2×2 mapeia os vetores de base î=(1,0) e ĵ=(0,1) nas suas duas colunas. O determinante mede o fator de ampliação da área.',
    desafios: 'Praticar com feedback imediato consolida o reconhecimento de padrões: observe sempre a dimensão das matrizes e o sinal do determinante antes de calcular.',
    aprendizagem: 'Cada fórmula matricial tem uma interpretação geométrica e computacional. Experimente alterar os números do mini-simulador para ver o efeito na hora.'
  };

  const tourTargets = {
    inicio: ['#welcomeHero', '#quickStartBanner', '#moduleGrid', '#progressPanel'],
    criptografia: ['#cryptoKeyPanel', '#cryptoMsgPanel', '#stepsPanel'],
    laboratorio: ['#labInputPanel', '#labResultPanel'],
    transformacoes: ['#cartesianCanvas', '#rotSlider'],
    investigacao: ['.case-list', '.dossier-box'],
    desafios: ['#quizOptions', '#arenaRadarChart'],
    aprendizagem: ['.learn-grid']
  };

  let activeAgent = 'matriz';
  const history = [
    {
      sender: 'agent',
      agent: 'matriz',
      text: profiles.matriz.greeting
    }
  ];

  const widget = () => document.getElementById('tutorWidget');
  const panel = () => document.getElementById('tutorPanel');
  const launch = () => document.getElementById('tutorLaunch');
  const dragHead = () => document.getElementById('tutorDragHead');
  const chatLog = () => document.getElementById('tutorChatLog');

  let hasCustomPosition = false;
  let suppressNextLaunchClick = false;
  let suppressNextOutsideClose = false;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function applyWidgetPosition(left, top, persist = false) {
    const w = widget();
    if (!w) return;
    const rect = w.getBoundingClientRect();
    const margin = 8;
    const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
    const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);
    const clampedLeft = clamp(left, margin, maxLeft);
    const clampedTop = clamp(top, margin, maxTop);

    w.style.left = `${clampedLeft}px`;
    w.style.top = `${clampedTop}px`;
    w.style.right = 'auto';
    w.style.bottom = 'auto';
    w.classList.toggle('align-left', clampedLeft + rect.width / 2 < window.innerWidth / 2);
    hasCustomPosition = true;

    if (persist) {
      window.MatrizandoStore?.setAgentPosition({ x: clampedLeft, y: clampedTop });
    }
  }

  function clampWidgetToViewport(persist = false) {
    if (!hasCustomPosition) return;
    const w = widget();
    if (!w) return;
    const rect = w.getBoundingClientRect();
    applyWidgetPosition(rect.left, rect.top, persist);
  }

  function keepAnchorAcrossToggle(toggleFn) {
    const w = widget();
    const l = launch();
    if (!hasCustomPosition || !w || !l) {
      toggleFn();
      return;
    }

    const beforeLaunch = l.getBoundingClientRect();
    toggleFn();
    const afterWidget = w.getBoundingClientRect();
    const afterLaunch = l.getBoundingClientRect();
    const nextLeft = afterWidget.left + (beforeLaunch.left - afterLaunch.left);
    const nextTop = afterWidget.top + (beforeLaunch.top - afterLaunch.top);
    applyWidgetPosition(nextLeft, nextTop, false);
  }

  function setupDragging() {
    const w = widget();
    const handles = [launch(), dragHead()].filter(Boolean);
    if (!w || !handles.length) return;

    const savedPos = window.MatrizandoStore?.getState()?.agentPosition;
    if (savedPos && Number.isFinite(savedPos.x) && Number.isFinite(savedPos.y)) {
      applyWidgetPosition(savedPos.x, savedPos.y, false);
    }

    handles.forEach(handle => {
      handle.addEventListener('pointerdown', event => {
        if (event.button !== 0 && event.pointerType === 'mouse') return;
        if (event.target.closest('#tutorClose')) return;

        const startX = event.clientX;
        const startY = event.clientY;
        const startRect = w.getBoundingClientRect();
        let dragging = false;
        const pointerId = event.pointerId;

        const onPointerMove = moveEvent => {
          const dx = moveEvent.clientX - startX;
          const dy = moveEvent.clientY - startY;

          if (!dragging && Math.hypot(dx, dy) > 5) {
            dragging = true;
            w.classList.add('is-dragging');
            try {
              handle.setPointerCapture(pointerId);
            } catch {
              // Ignora se o ponteiro não puder ser capturado
            }
          }

          if (!dragging) return;
          moveEvent.preventDefault();
          applyWidgetPosition(startRect.left + dx, startRect.top + dy, false);
        };

        const finishDrag = () => {
          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerup', finishDrag);
          window.removeEventListener('pointercancel', finishDrag);

          if (dragging) {
            w.classList.remove('is-dragging');
            try {
              if (handle.hasPointerCapture(pointerId)) {
                handle.releasePointerCapture(pointerId);
              }
            } catch {
              // Ignora liberação redundante
            }
            clampWidgetToViewport(true);
            suppressNextOutsideClose = true;
            window.setTimeout(() => {
              suppressNextOutsideClose = false;
            }, 120);
            if (handle === launch()) {
              suppressNextLaunchClick = true;
              window.setTimeout(() => {
                suppressNextLaunchClick = false;
              }, 80);
            }
          }
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', finishDrag);
        window.addEventListener('pointercancel', finishDrag);
      });
    });

    window.addEventListener('resize', () => clampWidgetToViewport(false));
  }

  function renderChat() {
    const log = chatLog();
    if (!log) return;
    log.innerHTML = history.map(msg => {
      if (msg.sender === 'user') {
        return `<div class="chat-bubble user">${esc(msg.text)}</div>`;
      }
      const p = profiles[msg.agent] || profiles.matriz;
      return `
        <div class="chat-bubble agent">
          <span class="chat-bubble-meta">${p.symbol} ${esc(p.shortName)}</span>
          ${esc(msg.text)}
        </div>
      `;
    }).join('');
    log.scrollTop = log.scrollHeight;
  }

  function selectAgent(key, announce = true) {
    if (!profiles[key]) return;
    activeAgent = key;
    const p = profiles[key];

    const nameEl = document.getElementById('agentPanelName');
    const roleEl = document.getElementById('agentPanelRole');
    const avatarEl = document.getElementById('agentPanelAvatar');
    const launchIcon = document.getElementById('tutorLaunchIcon');
    const launchLabel = document.getElementById('tutorLaunchLabel');

    if (nameEl) nameEl.textContent = p.name;
    if (roleEl) roleEl.textContent = p.role;
    if (avatarEl) avatarEl.textContent = p.symbol;
    if (launchIcon) launchIcon.textContent = p.symbol;
    if (launchLabel) launchLabel.textContent = `${p.shortName} ao lado`;

    document.querySelectorAll('.agent-switch-btn').forEach(btn => {
      const isAct = btn.dataset.agent === key;
      btn.classList.toggle('active', isAct);
      btn.setAttribute('aria-selected', String(isAct));
    });

    if (announce) {
      pushAgentMessage(key, p.greeting);
    }
  }

  function pushAgentMessage(agentKey, text) {
    history.push({ sender: 'agent', agent: agentKey, text });
    if (history.length > 30) history.shift();
    renderChat();
  }

  function openPanel(preferredAgent = null) {
    if (preferredAgent && preferredAgent !== activeAgent) {
      selectAgent(preferredAgent, true);
    }
    const p = panel();
    const l = launch();
    if (!p || !l) return;
    keepAnchorAcrossToggle(() => {
      p.hidden = false;
      l.setAttribute('aria-expanded', 'true');
      l.classList.remove('has-unread');
      renderChat();
    });
  }

  function closePanel(restoreFocus = false) {
    const p = panel();
    const l = launch();
    if (!p || !l || p.hidden) return;
    keepAnchorAcrossToggle(() => {
      p.hidden = true;
      l.setAttribute('aria-expanded', 'false');
    });
    if (restoreFocus) {
      l.focus();
    }
  }

  function renderInlineBanner(containerId, agentKey, text) {
    const host = document.getElementById(containerId);
    if (!host) return;
    const p = profiles[agentKey] || profiles.matriz;
    host.innerHTML = `
      <div class="agent-inline-banner" role="region" aria-label="Orientação do mentor ${esc(p.name)}">
        <div class="agent-inline-avatar ${esc(p.key)}" aria-hidden="true">${p.symbol}</div>
        <div class="agent-inline-content">
          <div class="agent-inline-head">
            <strong>${esc(p.name)}</strong>
            <span class="agent-role-pill">${esc(p.role)}</span>
          </div>
          <p id="${esc(containerId)}Text">${esc(text)}</p>
        </div>
        <div class="agent-inline-btns">
          <button type="button" class="secondary-action" data-banner-tour>Guiar tela</button>
          <button type="button" class="primary-action" data-banner-chat="${esc(p.key)}">Perguntar</button>
        </div>
      </div>
    `;

    host.querySelector('[data-banner-chat]')?.addEventListener('click', event => {
      event.stopPropagation();
      openPanel(p.key);
      document.getElementById('tutorInput')?.focus();
    });

    host.querySelector('[data-banner-tour]')?.addEventListener('click', () => {
      runSpotlightTour();
    });
  }

  function reactToEvent(agentKey, message) {
    selectAgent(agentKey, false);
    pushAgentMessage(agentKey, message);

    const inlineText = document.querySelector('.agent-inline-banner p');
    if (inlineText) {
      inlineText.textContent = message;
    }

    // Não abre o popup automaticamente — apenas sinaliza discretamente no botão flutuante
    const p = panel();
    const l = launch();
    if (p && p.hidden && l) {
      l.classList.add('has-unread');
    }
  }

  function runSpotlightTour() {
    const ctx = window.MatrizandoStore?.getLiveContext() || { page: 'inicio' };
    const selectors = tourTargets[ctx.page] || tourTargets.inicio;
    const elements = selectors.map(s => document.querySelector(s)).filter(Boolean);
    if (!elements.length) return;

    let step = 0;
    window.MatrizandoNavigation?.showToast('Tour guiado iniciado: acompanhe os destaques na tela.');

    const highlightNext = () => {
      document.querySelectorAll('.ihc-spotlight').forEach(el => el.classList.remove('ihc-spotlight'));
      if (step >= elements.length) {
        window.MatrizandoNavigation?.showToast('Tour concluído! Explore livremente.');
        return;
      }
      const el = elements[step];
      el.classList.add('ihc-spotlight');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      step += 1;
      window.setTimeout(highlightNext, 1600);
    };

    highlightNext();
  }

  function answerNaturalQuestion(rawQuestion) {
    const q = rawQuestion.toLowerCase();
    const ctx = window.MatrizandoStore?.getLiveContext() || { page: 'inicio', summary: '' };

    if (q.includes('determinante') || q.includes('det')) {
      return 'O determinante mede o fator de escala de área/volume da matriz. Se det(A) = 0, as linhas são linearmente dependentes e a matriz não admite inversa.';
    }
    if (q.includes('inversa') || q.includes('invert')) {
      return 'Para existir inversa A⁻¹, a matriz deve ser quadrada com det(A) ≠ 0 (nos reais) ou mdc(det(K), 26) = 1 (na Cifra de Hill módulo 26).';
    }
    if (q.includes('hill') || q.includes('cripto') || q.includes('mod')) {
      return 'Na Cifra de Hill, transformamos letras em números (A=0..Z=25) e multiplicamos blocos vetoriais pela matriz-chave K reduzindo o resultado módulo 26.';
    }
    if (q.includes('gauss') || q.includes('sistema')) {
      return 'No escalonamento de Gauss-Jordan, zeramos elementos abaixo e acima de cada pivô. Se surgir uma linha [0 ... 0 | k ≠ 0], o sistema é impossível (SI).';
    }
    if (q.includes('tela') || q.includes('aqui') || q.includes('agora')) {
      return `Situação atual: ${ctx.summary} ${moduleConcepts[ctx.page] || ''}`;
    }
    return `Ótima pergunta! ${moduleConcepts[ctx.page] || moduleConcepts.inicio} Se quiser, clique em "Analisar minha tela" para eu comentar seus valores atuais.`;
  }

  function init() {
    launch()?.addEventListener('click', event => {
      event.stopPropagation();
      if (suppressNextLaunchClick) {
        suppressNextLaunchClick = false;
        return;
      }
      if (panel()?.hidden) openPanel();
      else closePanel(true);
    });
    document.getElementById('tutorClose')?.addEventListener('click', () => closePanel(true));

    // Fecha o popup do agente ao clicar em qualquer lugar fora dele na página
    document.addEventListener('click', event => {
      if (suppressNextOutsideClose) return;
      const p = panel();
      const w = widget();
      if (!p || p.hidden || !w) return;
      if (w.contains(event.target)) return;
      if (event.target.closest('[data-banner-chat]')) return;
      closePanel(false);
    });

    setupDragging();

    document.querySelectorAll('.agent-switch-btn').forEach(btn => {
      btn.addEventListener('click', () => selectAgent(btn.dataset.agent, true));
    });

    document.getElementById('tutorQuickPrompts')?.addEventListener('click', event => {
      const btn = event.target.closest('[data-tutor]');
      if (!btn) return;
      const ctx = window.MatrizandoStore?.getLiveContext() || { page: 'inicio', summary: '' };
      const kind = btn.dataset.tutor;

      if (kind === 'analyze') {
        pushAgentMessage(activeAgent, `Analisando seu contexto atual: ${ctx.summary}`);
      } else if (kind === 'concept') {
        pushAgentMessage(activeAgent, moduleConcepts[ctx.page] || moduleConcepts.inicio);
      } else if (kind === 'guide') {
        closePanel();
        runSpotlightTour();
      }
    });

    document.getElementById('tutorForm')?.addEventListener('submit', event => {
      event.preventDefault();
      const input = document.getElementById('tutorInput');
      const text = input?.value.trim();
      if (!text) return;
      history.push({ sender: 'user', text });
      input.value = '';
      renderChat();

      const reply = answerNaturalQuestion(text);
      window.setTimeout(() => pushAgentMessage(activeAgent, reply), 220);
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && panel() && !panel().hidden) {
        closePanel(true);
      }
    });

    renderChat();
  }

  return {
    init,
    openPanel,
    closePanel,
    selectAgent,
    renderInlineBanner,
    reactToEvent,
    runSpotlightTour
  };
})();
