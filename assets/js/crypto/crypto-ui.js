// ==========================================================================
// MATRIZANDO — Módulo 01: Central de Criptografia (Cifra de Hill + Grade Matricial)
// ==========================================================================

window.HillCryptoUI = (() => {
  const presets = {
    2: [[3, 3], [2, 5]],
    3: [[6, 24, 1], [13, 16, 10], [20, 17, 15]]
  };

  let size = 2;
  let currentKey = structuredClone(presets[2]);

  // Seletor inteligente de voz feminina natural (PT-BR)
  const preferredFemaleVoices = [
    'francisca',
    'thalita',
    'giovanna',
    'brenda',
    'leticia',
    'manuela',
    'leila',
    'yara',
    'elza',
    'google português do brasil',
    'luciana',
    'fernanda',
    'maria'
  ];

  let availablePtVoices = [];
  let selectedVoiceURI = '';

  function scoreVoice(voice) {
    const name = `${voice.name} ${voice.voiceURI}`.toLowerCase();
    const lang = (voice.lang || '').toLowerCase();
    if (!lang.startsWith('pt')) return -100;

    let score = lang.includes('br') ? 100 : 40;
    if (name.includes('natural') || name.includes('neural') || name.includes('online')) score += 120;
    if (name.includes('google')) score += 65;

    if (/(antonio|daniel|donato|fabio|humberto|julio|nicolau|valerio|duarte|ricardo|felipe)/i.test(name)) {
      score -= 90;
    }

    const prefIdx = preferredFemaleVoices.findIndex(k => name.includes(k));
    if (prefIdx !== -1) {
      score += 80 - prefIdx * 4;
    }
    return score;
  }

  function refreshVoices() {
    if (!window.speechSynthesis) return [];
    const all = window.speechSynthesis.getVoices() || [];
    availablePtVoices = all
      .filter(v => (v.lang || '').toLowerCase().startsWith('pt'))
      .sort((a, b) => scoreVoice(b) - scoreVoice(a));

    if (availablePtVoices.length && !availablePtVoices.some(v => v.voiceURI === selectedVoiceURI)) {
      selectedVoiceURI = availablePtVoices[0].voiceURI;
    }
    syncVoiceSelectUI();
    return availablePtVoices;
  }

  function getSelectedVoice() {
    if (!availablePtVoices.length) refreshVoices();
    return availablePtVoices.find(v => v.voiceURI === selectedVoiceURI) || availablePtVoices[0] || null;
  }

  function shortVoiceName(voice) {
    return voice.name
      .replace(/^Microsoft\s+/i, '')
      .replace(/\s*-\s*Portuguese\s*\(Brazil\)/i, '')
      .replace(/\s*Online\s*/i, ' ')
      .trim();
  }

  function syncVoiceSelectUI() {
    const sel = document.getElementById('hillVoiceSelect');
    if (!sel) return;
    if (!availablePtVoices.length) {
      sel.innerHTML = '<option value="">Voz PT-BR</option>';
      return;
    }
    sel.innerHTML = availablePtVoices.map(v => `
      <option value="${esc(v.voiceURI)}" ${v.voiceURI === selectedVoiceURI ? 'selected' : ''}>
        🎙 ${esc(shortVoiceName(v))}
      </option>
    `).join('');
  }

  if (window.speechSynthesis) {
    refreshVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
  }

  // Pronúncia fonética natural das letras em Português do Brasil (evita distorções em pares como UI, HI, WC, NN)
  const PT_LETTER_NAMES = {
    A: 'á', B: 'bê', C: 'cê', D: 'dê', E: 'é', F: 'éfe', G: 'gê',
    H: 'agá', I: 'í', J: 'jóta', K: 'cá', L: 'éle', M: 'ême', N: 'êne',
    O: 'ó', P: 'pê', Q: 'quê', R: 'érre', S: 'ésse', T: 'tê', U: 'ú',
    V: 'vê', W: 'dáblio', X: 'xís', Y: 'ípsilon', Z: 'zê'
  };

  function spellBlockPT(lettersStr) {
    return [...String(lettersStr || '').toUpperCase()]
      .map(ch => PT_LETTER_NAMES[ch] || ch)
      .join(', ');
  }

  function joinListPT(values) {
    const arr = values.map(v => String(v));
    if (arr.length <= 1) return arr[0] || '';
    if (arr.length === 2) return `${arr[0]} e ${arr[1]}`;
    return `${arr.slice(0, -1).join(', ')} e ${arr[arr.length - 1]}`;
  }

  function formatSpokenPhrase(rawText) {
    const trimmed = String(rawText || '').trim().replace(/\s+/g, ' ');
    if (!trimmed) return 'a sua mensagem';
    // Converte texto todo em maiúsculas para minúsculas para o sintetizador ler como frase natural, não sigla
    return trimmed === trimmed.toUpperCase() ? trimmed.toLowerCase() : trimmed;
  }

  // Estado da seção 03 (grade de blocos + mini-player)
  let resState = {
    result: null,
    type: 'encrypt',
    blocks: [],
    matrix: [],
    script: [],
    showIntermediate: false,
    activeAudioBlockId: null,
    audioTimeout: null,
    speechToken: 0,
    currentUtterance: null,
    speechDelayTimer: null,
    liveClass: {
      isOpen: false,
      isPlaying: false,
      stepIndex: 0,
      timerId: null
    }
  };

  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  function stopSpeechSafely() {
    resState.speechToken += 1;
    window.clearTimeout(resState.speechDelayTimer);
    resState.speechDelayTimer = null;
    resState.currentUtterance = null;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {
      // Ignora bloqueios de API de voz
    }
  }

  function stopLessonPlayback() {
    window.clearTimeout(resState.audioTimeout);
    window.clearTimeout(resState.liveClass.timerId);
    resState.liveClass.isPlaying = false;
    resState.liveClass.isOpen = false;
    resState.activeAudioBlockId = null;
    stopSpeechSafely();
  }

  function splitIntoSentences(text) {
    return String(text || '')
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean);
  }

  function speakTextSafely(text, onDone = null) {
    const myToken = ++resState.speechToken;
    window.clearTimeout(resState.speechDelayTimer);
    resState.speechDelayTimer = null;

    if (!('speechSynthesis' in window)) return false;

    const sentences = splitIntoSentences(text);
    if (!sentences.length) {
      onDone?.();
      return true;
    }

    const speakQueue = idx => {
      if (myToken !== resState.speechToken) return;
      if (idx >= sentences.length) {
        resState.currentUtterance = null;
        onDone?.();
        return;
      }

      try {
        const utter = new SpeechSynthesisUtterance(sentences[idx]);
        const voice = getSelectedVoice();
        if (voice) {
          utter.voice = voice;
          utter.lang = voice.lang || 'pt-BR';
        } else {
          utter.lang = 'pt-BR';
        }
        // Pitch nativo 1.0 evita distorção metálica em vozes neurais; ritmo 0.96 deixa a dicção suave e natural
        utter.rate = 0.96;
        utter.pitch = 1.0;
        utter.volume = 1.0;

        // Mantém referência forte para evitar garbage collection abrupta no Chromium/Edge
        resState.currentUtterance = utter;

        let settled = false;
        let watchdog = null;

        const armWatchdog = () => {
          window.clearTimeout(watchdog);
          watchdog = window.setTimeout(() => {
            if (settled || myToken !== resState.speechToken) return;
            settled = true;
            speakQueue(idx + 1);
          }, Math.max(18000, sentences[idx].length * 140));
        };

        const finishSentence = () => {
          window.clearTimeout(watchdog);
          if (settled || myToken !== resState.speechToken) return;
          settled = true;
          if (idx + 1 < sentences.length) {
            resState.speechDelayTimer = window.setTimeout(() => speakQueue(idx + 1), 160);
          } else {
            resState.currentUtterance = null;
            onDone?.();
          }
        };

        utter.onstart = armWatchdog;
        utter.onboundary = armWatchdog;
        utter.onend = finishSentence;
        utter.onerror = event => {
          window.clearTimeout(watchdog);
          if (event?.error === 'canceled' || event?.error === 'interrupted') return;
          finishSentence();
        };

        armWatchdog();
        window.speechSynthesis.speak(utter);
      } catch {
        onDone?.();
      }
    };

    try {
      const wasBusy = window.speechSynthesis.speaking || window.speechSynthesis.pending;
      if (wasBusy) {
        window.speechSynthesis.cancel();
        // Pausa curta de 90ms após cancel() evita corte da primeira sílaba no Edge/Chrome
        resState.speechDelayTimer = window.setTimeout(() => speakQueue(0), 90);
      } else {
        speakQueue(0);
      }
      return true;
    } catch {
      return false;
    }
  }

  function matrixFields(key) {
    return `
      <div class="hill-matrix" style="--n:${key.length}">
        ${key.flatMap((row, r) =>
          row.map((v, c) => `
            <input class="hill-key-cell" type="number" step="1"
                   data-r="${r}" data-c="${c}" value="${v}"
                   aria-label="Matriz-chave linha ${r + 1}, coluna ${c + 1}">
          `)
        ).join('')}
      </div>
    `;
  }

  function alphabetStripHTML(highlightChars = '') {
    const activeSet = new Set([...HillCipher.normalize(highlightChars)]);
    return `
      <div class="alphabet-strip" aria-label="Tabela de correspondência A igual a 0 até Z igual a 25">
        ${[...HillCipher.ALPHABET].map((ch, idx) => `
          <div class="alpha-cell ${activeSet.has(ch) ? 'highlight' : ''}">
            <b>${ch}</b>
            <small>${idx}</small>
          </div>
        `).join('')}
      </div>
    `;
  }

  function render() {
    stopLessonPlayback();
    refreshVoices();
    const page = document.getElementById('pageContent');
    if (!page) return;

    page.innerHTML = `
      <div class="module-header">
        <div>
          <div class="eyebrow"><span class="rog-slashes" aria-hidden="true"><i></i><i></i><i></i><i></i></span> MÓDULO 01 • CRIPTOGRAFIA MATRICIAL</div>
          <h1>Central de <span>criptografia.</span></h1>
          <p class="welcome-copy">Codifique e decodifique mensagens com a Cifra de Hill. Veja todos os blocos em grade matricial e, quando quiser, ative a aula ao vivo com narração feminina sincronizada.</p>
        </div>
        <div class="module-header-actions">
          <button class="back-dashboard" id="backDashboard">← Visão geral</button>
        </div>
      </div>

      <div id="cryptoAgentBanner"></div>

      <div class="crypto-layout">
        <section class="panel crypto-panel" id="cryptoKeyPanel">
          <div class="panel-overline">01 / CHAVE MATRICIAL</div>
          <h2>Prepare sua matriz K</h2>
          <p class="crypto-muted">A chave K precisa ser invertível módulo 26 para que a mensagem possa ser recuperada sem ambiguidade.</p>

          <label class="field-label" for="hillSize">Ordem da matriz-chave</label>
          <select id="hillSize" class="hill-select">
            <option value="2" ${size === 2 ? 'selected' : ''}>2 × 2 (Blocos de 2 letras)</option>
            <option value="3" ${size === 3 ? 'selected' : ''}>3 × 3 (Blocos de 3 letras)</option>
          </select>

          <div class="matrix-title-row">
            <span class="field-label">Coeficientes inteiros (K)</span>
            <button class="text-button" id="resetKey">Restaurar padrão</button>
          </div>

          <div class="key-presets-bar">
            <button type="button" class="mini-chip" id="randomValidKey">🎲 Gerar chave válida</button>
            <button type="button" class="mini-chip" id="testInvalidKey">⚠ Testar chave inválida</button>
          </div>

          <div id="hillMatrixWrap">${matrixFields(currentKey)}</div>
          <div id="keyValidation" class="validation-note" aria-live="polite">Verificando chave...</div>

          <div class="math-note">
            <strong>Regra de Invertibilidade (mod 26)</strong>
            <span>Só existe K⁻¹ (mod 26) quando mdc(det(K), 26) = 1 — ou seja, det(K) não pode ser par nem múltiplo de 13.</span>
          </div>
        </section>

        <section class="panel crypto-panel message-panel" id="cryptoMsgPanel">
          <div class="panel-overline">02 / CODIFICAÇÃO E DECODIFICAÇÃO</div>
          <h2>Mensagem secreta</h2>
          <p class="crypto-muted">Acentos, espaços e pontuação são normalizados automaticamente para o alfabeto A–Z (0 a 25).</p>

          <label class="field-label" for="plainText">Mensagem original</label>
          <textarea id="plainText" class="hill-textarea" rows="3" placeholder="Ex.: Encontro marcado no laboratorio...">ATAQUE AO AMANHECER</textarea>
          <div class="message-meta">
            <span>Tabela de mapeamento A=0 … Z=25</span>
            <span id="plainCount">0 letras válidas</span>
          </div>

          <div id="alphabetStripWrap"></div>

          <div class="action-row">
            <button class="primary-action" id="encryptBtn">⌑ Criptografar mensagem</button>
            <button class="secondary-action" id="clearBtn">Limpar tudo</button>
          </div>

          <div class="result-block">
            <div class="result-head">
              <span class="panel-overline">TEXTO CIFRADO RESULTANTE</span>
              <button class="text-button" id="copyCipher">Copiar código</button>
            </div>
            <div class="cipher-output" id="cipherOutput" aria-live="polite">Seu código aparecerá aqui</div>
          </div>

          <label class="field-label" for="cipherInput" style="margin-top:20px">Texto cifrado para decodificar</label>
          <textarea id="cipherInput" class="hill-textarea" rows="2" placeholder="Cole aqui o código cifrado..."></textarea>
          <label class="check-row">
            <input type="checkbox" id="removePadding" checked>
            Remover letras 'X' de preenchimento ao final
          </label>
          <button class="secondary-action decrypt-action" id="decryptBtn">↶ Descriptografar com K⁻¹</button>

          <div class="result-block">
            <div class="result-head">
              <span class="panel-overline">MENSAGEM RECUPERADA</span>
              <button class="text-button" id="copyPlain">Copiar texto</button>
            </div>
            <div class="cipher-output recovered" id="plainOutput" aria-live="polite">O resultado aparecerá aqui</div>
          </div>
        </section>
      </div>

      <section class="panel steps-panel" id="stepsPanel">
        <div id="mathSteps" class="math-steps" aria-live="polite">
          <div class="empty-steps">Clique em <b>Criptografar mensagem</b> ou <b>Descriptografar com K⁻¹</b> para visualizar a decomposição vetorial em grade e o player opcional de aula ao vivo.</div>
        </div>
      </section>

      <div id="cryptoChartHost"></div>

      <div class="crypto-disclaimer">
        ⓘ Nota acadêmica: A Cifra de Hill (1929) ilustra transformações lineares em aritmética modular. Por ser vulnerável a ataques de texto claro conhecido, hoje é utilizada exclusivamente com fins didáticos.
      </div>
    `;

    bind();
    updateValidation(false);
    updateCount();

    window.MatrizandoAgents?.renderInlineBanner('cryptoAgentBanner', 'cipher',
      'Clique em "Criptografar mensagem" para ver a grade completa de blocos matriciais. Você pode ativar "Mostrar cálculo intermediário" ou clicar em "▶ Assistir aula ao vivo (com voz)" na seção 03.'
    );
    window.MatrizandoStore?.setLiveContext({
      page: 'criptografia',
      summary: `Estudante na Central de Criptografia usando matriz ${size}×${size}.`
    });
  }

  function getKey() {
    const cells = [...document.querySelectorAll('.hill-key-cell')];
    return Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (_, c) => Number(cells.find(x => +x.dataset.r === r && +x.dataset.c === c)?.value))
    );
  }

  function setKeyCells(matrix) {
    currentKey = structuredClone(matrix);
    const wrap = document.getElementById('hillMatrixWrap');
    if (wrap) {
      wrap.innerHTML = matrixFields(currentKey);
      document.querySelectorAll('.hill-key-cell').forEach(cell => {
        cell.oninput = () => updateValidation(true);
      });
    }
    updateValidation(true);
  }

  function updateValidation(notifyAgent = false) {
    const el = document.getElementById('keyValidation');
    if (!el) return;
    try {
      const k = getKey();
      const v = HillMatrix.validateKey(k);
      el.className = `validation-note ${v.valid ? 'valid' : 'invalid'}`;
      el.textContent = (v.valid ? '✓ ' : '⚠ ') + v.message;

      window.MatrizandoStore?.setLiveContext({
        page: 'criptografia',
        lastEvent: v.valid ? 'valid_hill_key' : 'invalid_hill_key',
        summary: v.valid
          ? `Chave ${size}×${size} válida com det(K) = ${v.det} (mod 26 = ${v.reduced}).`
          : `Chave ${size}×${size} INVÁLIDA: ${v.message}`
      });

      if (!v.valid && notifyAgent) {
        window.MatrizandoAgents?.reactToEvent(
          'cipher',
          `Atenção à sua matriz-chave! ${v.message} Experimente clicar em "🎲 Gerar chave válida" ou ajuste um coeficiente para tornar o determinante ímpar e não múltiplo de 13.`
        );
      }
    } catch (e) {
      el.className = 'validation-note invalid';
      el.textContent = e.message;
    }
  }

  function updateCount() {
    const t = document.getElementById('plainText');
    const strip = document.getElementById('alphabetStripWrap');
    if (!t) return;
    const clean = HillCipher.normalize(t.value);
    document.getElementById('plainCount').textContent = `${clean.length} letras válidas`;
    if (strip) strip.innerHTML = alphabetStripHTML(clean);
  }

  function renderFrequencyChart(plainClean, cipherText) {
    const host = document.getElementById('cryptoChartHost');
    if (!host) return;
    const freqPlain = HillCipher.letterFrequencies(plainClean);
    const freqCipher = HillCipher.letterFrequencies(cipherText);
    const letters = [...new Set([...Object.keys(freqPlain), ...Object.keys(freqCipher)])]
      .sort((a, b) => {
        const scoreA = (freqPlain[a] || 0) * 1.1 + (freqCipher[a] || 0);
        const scoreB = (freqPlain[b] || 0) * 1.1 + (freqCipher[b] || 0);
        return scoreB - scoreA || a.localeCompare(b);
      })
      .slice(0, 12);

    const items = letters.map(ch => ({
      label: ch,
      value: freqPlain[ch] || 0,
      valueB: freqCipher[ch] || 0
    }));

    window.MatrizandoCharts?.renderBarChart(host, {
      title: 'Quantas vezes cada letra aparece? (Original × Cifrado)',
      subtitle: 'Passe o mouse em uma letra para comparar quantas vezes ela aparecia no texto original e no código cifrado.',
      seriesA: 'Original',
      seriesB: 'Cifrado',
      items
    });
  }

  // ==========================================================================
  // SEÇÃO 03 — RESOLUÇÃO MATRICIAL EM GRADE (ADAPTADA DO MODELO ENVIADO)
  // ==========================================================================
  function buildBlockModels(result, type) {
    const isEnc = type === 'encrypt';
    const M = isEnc ? result.key : result.inverse;
    const mDisplay = isEnc ? 'K' : 'K⁻¹';
    const mSpoken = isEnc ? 'cá' : 'cá inversa';

    return result.blocks.map((b, idx) => {
      const id = idx + 1;
      const intermediate = M.map(row =>
        row.reduce((sum, val, c) => sum + val * b.input[c], 0)
      );
      const inputVec = b.input.map((num, i) => ({ num, char: b.inputText[i] || '' }));
      const outputVec = b.output.map((num, i) => ({ num, char: b.outputText[i] || '' }));
      const inNums = joinListPT(b.input);
      const interNums = joinListPT(intermediate);
      const outNums = joinListPT(b.output);
      const inSpelled = spellBlockPT(b.inputText);
      const outSpelled = spellBlockPT(b.outputText);

      return {
        id,
        inPair: b.inputText,
        outPair: b.outputText,
        input: inputVec,
        intermediate,
        output: outputVec,
        narration: `Bloco ${id}: multiplicamos ${mDisplay} pelo vetor ${b.inputText} (${inNums}), resultando em ${interNums}. Reduzindo em módulo 26, obtemos ${outNums}, formando "${b.outputText}".`,
        speechText: `Bloco ${id}. Multiplicamos a matriz ${mSpoken} pelo vetor das letras ${inSpelled}, que valem ${inNums}, chegando a ${interNums}. Reduzindo em módulo 26, obtemos ${outNums}, formando as letras ${outSpelled}.`
      };
    });
  }

  function renderResolutionSection(result, type) {
    stopLessonPlayback();
    refreshVoices();
    const box = document.getElementById('mathSteps');
    if (!box) return;

    const isEnc = type === 'encrypt';
    const M = isEnc ? result.key : result.inverse;
    const n = M.length;
    const blocks = buildBlockModels(result, type);
    const inputDisplay = isEnc
      ? (result.paddedText || result.blocks.map(b => b.inputText).join(''))
      : result.blocks.map(b => b.inputText).join('');
    const finalText = result.text;
    const rawUserPhrase = document.getElementById('plainText')?.value || result.clean || inputDisplay;
    const spokenOriginal = formatSpokenPhrase(rawUserPhrase);

    resState.result = result;
    resState.type = type;
    resState.blocks = blocks;
    resState.matrix = M;
    resState.script = [
      {
        tag: 'INTRODUÇÃO',
        blockId: null,
        text: isEnc
          ? `Para cifrar "${inputDisplay}", agrupamos as ${inputDisplay.length} letras em ${blocks.length} vetores coluna de ${n} elementos e multiplicamos cada um pela matriz chave K.`
          : `Para descriptografar "${inputDisplay}", dividimos em ${blocks.length} blocos de ${n} elementos e multiplicamos cada vetor pela matriz inversa modular K⁻¹.`,
        speechText: isEnc
          ? `Vamos acompanhar a criptografia de ${spokenOriginal}. Agrupamos as ${inputDisplay.length} letras em ${blocks.length} blocos de ${n} números${result.padding ? `, completando o final com a letra xís` : ''}. Agora, multiplicamos cada bloco pela matriz chave cá.`
          : `Vamos acompanhar a descriptografia passo a passo. Dividimos o código em ${blocks.length} blocos de ${n} elementos e multiplicamos cada vetor pela matriz inversa modular cá inversa.`
      },
      ...blocks.map(block => ({
        tag: `BLOCO ${block.id} DE ${blocks.length}`,
        blockId: block.id,
        text: block.narration,
        speechText: block.speechText
      })),
      {
        tag: 'CONCLUSÃO',
        blockId: null,
        text: isEnc
          ? `Concatenando os ${blocks.length} blocos resultantes, obtemos o texto cifrado final: ${finalText}.`
          : `Unindo os ${blocks.length} blocos invertidos, recuperamos a mensagem original: ${finalText}.`,
        speechText: isEnc
          ? `Prontinho! Juntando todos os ${blocks.length} blocos transformados, concluímos a criptografia da sua mensagem com sucesso.`
          : `Prontinho! Unindo todos os ${blocks.length} blocos invertidos, recuperamos a mensagem original com sucesso.`
      }
    ];

    box.innerHTML = `
      <div class="hill-res-wrap">
        <header class="hill-res-header">
          <div class="hill-res-header-info">
            <div class="panel-overline">03 / RESOLUÇÃO MATRICIAL • AULA AO VIVO</div>
            <h2 style="margin:0">Decomposição vetorial passo a passo</h2>
            <p class="hill-res-subtitle">Quer ver a explicação animada linha por linha com narração?</p>
          </div>

          <div class="hill-res-actions">
            <span class="hill-status-badge">RESULTADO DIRETO</span>
            <button type="button" id="hillBtnLiveClass" class="hill-live-cta">
              <span id="hillLiveBtnIcon">▶</span>
              <span id="hillLiveBtnText">Assistir aula ao vivo (com voz)</span>
            </button>
          </div>
        </header>

        <section id="hillLivePlayer" class="hill-live-player" aria-live="polite">
          <div class="hill-player-top">
            <div class="hill-player-status">
              <div id="hillPlayerEq" class="hill-equalizer animating" aria-hidden="true">
                <span></span><span></span><span></span>
              </div>
              <span id="hillPlayerTag" class="hill-player-tag">INTRODUÇÃO</span>
              <span style="font-size:0.8rem;color:var(--muted)">Narração guiada sincronizada</span>
            </div>

            <div class="hill-player-controls">
              <button type="button" id="hillPlayerPrev" class="hill-player-btn" title="Passo anterior">⏮ Anterior</button>
              <button type="button" id="hillPlayerToggle" class="hill-player-btn" title="Pausar ou continuar">⏸ Pausar</button>
              <button type="button" id="hillPlayerNext" class="hill-player-btn" title="Próximo passo">Próximo ⏭</button>
              <select id="hillVoiceSelect" class="hill-voice-select" aria-label="Escolher voz da narradora"></select>
              <button type="button" id="hillPlayerClose" class="hill-player-btn" title="Fechar player">✕</button>
            </div>
          </div>

          <p id="hillPlayerTranscript" class="hill-player-transcript">
            Preparando narração da decomposição vetorial na Cifra de Hill...
          </p>

          <div class="hill-player-progress">
            <div id="hillPlayerFill" class="hill-player-progress-fill"></div>
          </div>
        </section>

        <section class="hill-hero-output" aria-label="Resumo do resultado">
          <div class="hill-hero-top">
            <div class="hill-completion-group">
              <span class="hill-completion-pill">✓ ${isEnc ? 'Criptografia' : 'Descriptografia'} concluída (${blocks.length} ${blocks.length === 1 ? 'bloco' : 'blocos'})</span>

              <div class="hill-key-ref" title="Matriz utilizada em todos os blocos">
                <span>${isEnc ? 'Matriz Chave' : 'Matriz Inversa'} <strong>${isEnc ? 'K' : 'K⁻¹'}</strong> =</span>
                <span class="hill-mini-matrix" style="grid-template-columns:repeat(${n},auto)">
                  ${M.flat().map(v => `<span>${v}</span>`).join('')}
                </span>
              </div>
            </div>

            <label class="hill-toggle-ctrl" for="hillIntermediateToggle">
              <input type="checkbox" id="hillIntermediateToggle" ${resState.showIntermediate ? 'checked' : ''} />
              <span class="hill-toggle-switch" aria-hidden="true"></span>
              <span>Mostrar cálculo intermediário</span>
            </label>
          </div>

          <div class="hill-io-grid">
            <div class="hill-texts-stack">
              <div class="hill-text-row">
                <span class="hill-text-label">${isEnc ? 'Texto Original' : 'Texto Cifrado'}</span>
                <code class="hill-orig-val">${esc(inputDisplay)}</code>
              </div>

              <div class="hill-text-row">
                <span class="hill-text-label">${isEnc ? 'Texto Final' : 'Recuperado'}</span>
                <div id="hillCipherPills" class="hill-pills-row" role="group" aria-label="Blocos resultantes interativos"></div>
              </div>
            </div>

            <div>
              <button type="button" id="hillBtnCopyRes" class="hill-copy-btn">
                <span id="hillCopyIcon">📋</span>
                <span id="hillCopyLabel">Copiar resultado</span>
              </button>
            </div>
          </div>
        </section>

        <div id="hillBlocksGrid" class="hill-blocks-grid" aria-label="Blocos de decomposição matricial"></div>

        <p class="hill-res-hint">
          Dica: passe o cursor ou clique em qualquer bloco no topo para localizar o card correspondente na grade.
        </p>
      </div>
    `;

    syncVoiceSelectUI();
    renderCipherPills();
    renderBlocksGrid();
    bindResolutionControls(finalText);
  }

  function renderCipherPills() {
    const container = document.getElementById('hillCipherPills');
    if (!container) return;

    container.innerHTML = resState.blocks.map(block => `
      <button
        type="button"
        class="hill-cipher-pill"
        data-block-id="${block.id}"
        title="Ir para o Bloco ${block.id}: &quot;${esc(block.inPair)}&quot; → &quot;${esc(block.outPair)}&quot;"
      >
        ${esc(block.outPair)}
      </button>
    `).join('');

    container.querySelectorAll('.hill-cipher-pill').forEach(pill => {
      const blockId = Number(pill.dataset.blockId);
      pill.addEventListener('mouseenter', () => setCrossHighlight(blockId, true));
      pill.addEventListener('mouseleave', () => setCrossHighlight(blockId, false));
      pill.addEventListener('click', () => {
        const card = document.getElementById(`hill-block-card-${blockId}`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.remove('pulse-focus');
          void card.offsetWidth;
          card.classList.add('pulse-focus');
        }
      });
    });
  }

  function renderBlocksGrid() {
    const grid = document.getElementById('hillBlocksGrid');
    if (!grid) return;

    const M = resState.matrix;
    const n = M.length;
    const isEnc = resState.type === 'encrypt';
    const mSym = isEnc ? 'K' : 'K⁻¹';
    const vSym = isEnc ? 'P' : 'C';

    grid.innerHTML = resState.blocks.map(block => {
      const isSpeaking = resState.activeAudioBlockId === block.id;

      const intermediateSegment = resState.showIntermediate
        ? `
          <span class="hill-eq-op">=</span>
          <div class="hill-bracket hill-bracket-vec intermediate" title="Produto antes da redução modular">
            ${block.intermediate.map(v => `<div class="hill-vec-cell"><span>${v}</span></div>`).join('')}
          </div>
          <span class="hill-eq-op">≡</span>
        `
        : `<span class="hill-eq-op">=</span>`;

      return `
        <article
          id="hill-block-card-${block.id}"
          class="hill-step-card ${isSpeaking ? 'is-speaking' : ''}"
          data-block-id="${block.id}"
        >
          <div>
            <header class="hill-card-head">
              <div class="hill-card-title-group">
                <span class="hill-step-num">${block.id}</span>
                <h3 class="hill-card-title">
                  Bloco ${block.id}:
                  <span class="hill-pair-in">"${esc(block.inPair)}"</span>
                  <span class="hill-pair-arrow">→</span>
                  <span class="hill-pair-out">"${esc(block.outPair)}"</span>
                </h3>
              </div>

              <button
                type="button"
                class="hill-audio-btn ${isSpeaking ? 'active' : ''}"
                data-audio-block="${block.id}"
                title="Ouvir explicação do Bloco ${block.id}"
                aria-label="Ouvir explicação do Bloco ${block.id}"
              >
                🔊
              </button>
            </header>
            <p class="hill-card-sub">Multiplicação ${mSym} × ${vSym} reduzida em módulo 26</p>
          </div>

          <div class="hill-eq-box" aria-label="Equação matricial do bloco ${block.id}">
            <div class="hill-bracket hill-bracket-mat" style="grid-template-columns:repeat(${n},minmax(1.15rem,auto))">
              ${M.flat().map(v => `<span>${v}</span>`).join('')}
            </div>

            <span class="hill-eq-op">×</span>

            <div class="hill-bracket hill-bracket-vec">
              ${block.input.map(cell => `
                <div class="hill-vec-cell">
                  <span>${cell.num}</span>
                  <span class="hill-vec-letter">${esc(cell.char)}</span>
                </div>
              `).join('')}
            </div>

            ${intermediateSegment}

            <div class="hill-bracket hill-bracket-vec output">
              ${block.output.map(cell => `
                <div class="hill-vec-cell">
                  <span>${cell.num}</span>
                  <span class="hill-vec-letter">${esc(cell.char)}</span>
                </div>
              `).join('')}
            </div>

            <span class="hill-eq-mod">(mod 26)</span>
          </div>
        </article>
      `;
    }).join('');

    grid.querySelectorAll('.hill-step-card').forEach(card => {
      const blockId = Number(card.dataset.blockId);
      card.addEventListener('mouseenter', () => setCrossHighlight(blockId, true));
      card.addEventListener('mouseleave', () => setCrossHighlight(blockId, false));
    });

    grid.querySelectorAll('.hill-audio-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        triggerSingleBlockAudio(Number(btn.dataset.audioBlock));
      });
    });
  }

  function setCrossHighlight(blockId, active) {
    const pill = document.querySelector(`#hillCipherPills .hill-cipher-pill[data-block-id="${blockId}"]`);
    const card = document.getElementById(`hill-block-card-${blockId}`);
    if (pill) pill.classList.toggle('is-highlighted', active);
    if (card) card.classList.toggle('is-highlighted', active);
  }

  function updateSpeakingCardUI() {
    document.querySelectorAll('#hillBlocksGrid .hill-step-card').forEach(card => {
      const id = Number(card.dataset.blockId);
      const isSpeaking = resState.activeAudioBlockId === id;
      card.classList.toggle('is-speaking', isSpeaking);
      const btn = card.querySelector('.hill-audio-btn');
      if (btn) btn.classList.toggle('active', isSpeaking);
    });
  }

  function triggerSingleBlockAudio(blockId) {
    if (resState.liveClass.isPlaying) {
      pauseLiveClass();
    }
    window.clearTimeout(resState.audioTimeout);

    if (resState.activeAudioBlockId === blockId) {
      resState.activeAudioBlockId = null;
      stopSpeechSafely();
      updateSpeakingCardUI();
      document.getElementById('hillPlayerEq')?.classList.remove('animating');
      return;
    }

    const block = resState.blocks.find(b => b.id === blockId);
    if (!block) return;

    resState.activeAudioBlockId = blockId;
    updateSpeakingCardUI();

    const player = document.getElementById('hillLivePlayer');
    const eq = document.getElementById('hillPlayerEq');
    const tag = document.getElementById('hillPlayerTag');
    const transcript = document.getElementById('hillPlayerTranscript');
    const fill = document.getElementById('hillPlayerFill');

    player?.classList.add('active');
    eq?.classList.add('animating');
    if (tag) tag.textContent = `ÁUDIO • BLOCO ${block.id}`;
    if (transcript) transcript.textContent = block.narration;
    if (fill) fill.style.width = `${(block.id / Math.max(1, resState.blocks.length)) * 100}%`;

    const finishSingle = () => {
      resState.activeAudioBlockId = null;
      updateSpeakingCardUI();
      if (!resState.liveClass.isPlaying) {
        eq?.classList.remove('animating');
      }
    };

    const spoke = speakTextSafely(block.speechText || block.narration, finishSingle);
    if (!spoke) {
      resState.audioTimeout = window.setTimeout(finishSingle, 4500);
    }
  }

  function openAndStartLiveClass() {
    window.clearTimeout(resState.audioTimeout);
    resState.liveClass.isOpen = true;
    resState.liveClass.isPlaying = true;
    resState.liveClass.stepIndex = 0;

    document.getElementById('hillLivePlayer')?.classList.add('active');
    document.getElementById('hillBtnLiveClass')?.classList.add('is-playing');
    document.getElementById('hillPlayerEq')?.classList.add('animating');

    const icon = document.getElementById('hillLiveBtnIcon');
    const text = document.getElementById('hillLiveBtnText');
    const toggle = document.getElementById('hillPlayerToggle');
    if (icon) icon.textContent = '⏸';
    if (text) text.textContent = 'Aula ao vivo em andamento';
    if (toggle) toggle.textContent = '⏸ Pausar';

    playLiveStep(0);
  }

  function pauseLiveClass() {
    window.clearTimeout(resState.liveClass.timerId);
    resState.liveClass.isPlaying = false;
    stopSpeechSafely();

    document.getElementById('hillPlayerEq')?.classList.remove('animating');
    const icon = document.getElementById('hillLiveBtnIcon');
    const text = document.getElementById('hillLiveBtnText');
    const toggle = document.getElementById('hillPlayerToggle');
    if (toggle) toggle.textContent = '▶ Continuar';
    if (icon) icon.textContent = '▶';
    if (text) text.textContent = 'Continuar aula ao vivo';
  }

  function closeLiveClass() {
    pauseLiveClass();
    resState.liveClass.isOpen = false;
    resState.activeAudioBlockId = null;
    updateSpeakingCardUI();

    document.getElementById('hillLivePlayer')?.classList.remove('active');
    document.getElementById('hillBtnLiveClass')?.classList.remove('is-playing');
    const icon = document.getElementById('hillLiveBtnIcon');
    const text = document.getElementById('hillLiveBtnText');
    if (icon) icon.textContent = '▶';
    if (text) text.textContent = 'Assistir aula ao vivo (com voz)';
  }

  function playLiveStep(index) {
    const step = resState.script[index];
    if (!step) return;

    window.clearTimeout(resState.liveClass.timerId);
    resState.liveClass.stepIndex = index;

    const tag = document.getElementById('hillPlayerTag');
    const transcript = document.getElementById('hillPlayerTranscript');
    const fill = document.getElementById('hillPlayerFill');
    if (tag) tag.textContent = step.tag;
    if (transcript) transcript.textContent = step.text;
    if (fill) fill.style.width = `${((index + 1) / resState.script.length) * 100}%`;

    resState.activeAudioBlockId = step.blockId;
    updateSpeakingCardUI();

    if (step.blockId) {
      document.getElementById(`hill-block-card-${step.blockId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    const scheduleNext = (delayMs = 700) => {
      if (!resState.liveClass.isPlaying) return;
      if (resState.liveClass.stepIndex < resState.script.length - 1) {
        resState.liveClass.timerId = window.setTimeout(() => {
          if (resState.liveClass.isPlaying) {
            playLiveStep(resState.liveClass.stepIndex + 1);
          }
        }, delayMs);
      } else {
        pauseLiveClass();
        const icon = document.getElementById('hillLiveBtnIcon');
        const text = document.getElementById('hillLiveBtnText');
        if (icon) icon.textContent = '↻';
        if (text) text.textContent = 'Assistir novamente';
      }
    };

    const spoke = speakTextSafely(step.speechText || step.text, () => scheduleNext(850));
    if (!spoke) {
      scheduleNext(4600);
    }
  }

  function bindResolutionControls(finalText) {
    document.getElementById('hillBtnLiveClass')?.addEventListener('click', () => {
      if (!resState.liveClass.isOpen) {
        openAndStartLiveClass();
      } else if (resState.liveClass.isPlaying) {
        pauseLiveClass();
      } else {
        if (resState.liveClass.stepIndex >= resState.script.length - 1) {
          resState.liveClass.stepIndex = 0;
        }
        resState.liveClass.isPlaying = true;
        document.getElementById('hillPlayerEq')?.classList.add('animating');
        const toggle = document.getElementById('hillPlayerToggle');
        const icon = document.getElementById('hillLiveBtnIcon');
        const text = document.getElementById('hillLiveBtnText');
        if (toggle) toggle.textContent = '⏸ Pausar';
        if (icon) icon.textContent = '⏸';
        if (text) text.textContent = 'Aula ao vivo em andamento';
        playLiveStep(resState.liveClass.stepIndex);
      }
    });

    document.getElementById('hillPlayerToggle')?.addEventListener('click', () => {
      if (resState.liveClass.isPlaying) {
        pauseLiveClass();
      } else {
        resState.liveClass.isOpen = true;
        resState.liveClass.isPlaying = true;
        document.getElementById('hillPlayerEq')?.classList.add('animating');
        const toggle = document.getElementById('hillPlayerToggle');
        const icon = document.getElementById('hillLiveBtnIcon');
        const text = document.getElementById('hillLiveBtnText');
        if (toggle) toggle.textContent = '⏸ Pausar';
        if (icon) icon.textContent = '⏸';
        if (text) text.textContent = 'Aula ao vivo em andamento';
        playLiveStep(resState.liveClass.stepIndex);
      }
    });

    document.getElementById('hillPlayerPrev')?.addEventListener('click', () => {
      resState.liveClass.isOpen = true;
      resState.liveClass.isPlaying = true;
      document.getElementById('hillPlayerEq')?.classList.add('animating');
      playLiveStep(Math.max(0, resState.liveClass.stepIndex - 1));
    });

    document.getElementById('hillPlayerNext')?.addEventListener('click', () => {
      resState.liveClass.isOpen = true;
      resState.liveClass.isPlaying = true;
      document.getElementById('hillPlayerEq')?.classList.add('animating');
      playLiveStep(Math.min(resState.script.length - 1, resState.liveClass.stepIndex + 1));
    });

    document.getElementById('hillVoiceSelect')?.addEventListener('change', event => {
      selectedVoiceURI = event.target.value;
      if (resState.liveClass.isPlaying) {
        playLiveStep(resState.liveClass.stepIndex);
      }
    });

    document.getElementById('hillPlayerClose')?.addEventListener('click', closeLiveClass);

    document.getElementById('hillIntermediateToggle')?.addEventListener('change', e => {
      resState.showIntermediate = e.target.checked;
      renderBlocksGrid();
    });

    document.getElementById('hillBtnCopyRes')?.addEventListener('click', async () => {
      const btn = document.getElementById('hillBtnCopyRes');
      const icon = document.getElementById('hillCopyIcon');
      const label = document.getElementById('hillCopyLabel');
      await copyText(finalText);
      if (btn && icon && label) {
        btn.classList.add('copied');
        icon.textContent = '✓';
        label.textContent = 'Copiado!';
        window.setTimeout(() => {
          btn.classList.remove('copied');
          icon.textContent = '📋';
          label.textContent = 'Copiar resultado';
        }, 2000);
      }
    });
  }

  function bind() {
    document.getElementById('backDashboard').onclick = () => {
      stopLessonPlayback();
      window.MatrizandoNavigation.navigate('inicio');
    };

    document.getElementById('hillSize').onchange = e => {
      size = Number(e.target.value);
      currentKey = structuredClone(presets[size]);
      render();
    };

    document.getElementById('resetKey').onclick = () => setKeyCells(presets[size]);

    document.getElementById('randomValidKey').onclick = () => {
      const rnd = HillMatrix.generateRandomKey(size);
      setKeyCells(rnd);
      window.MatrizandoNavigation.showToast(`Nova chave ${size}×${size} válida gerada!`);
    };

    document.getElementById('testInvalidKey').onclick = () => {
      const bad = size === 2 ? [[2, 4], [1, 2]] : [[2, 4, 6], [1, 3, 5], [0, 2, 4]];
      setKeyCells(bad);
    };

    document.querySelectorAll('.hill-key-cell').forEach(x => {
      x.oninput = () => updateValidation(true);
    });

    document.getElementById('plainText').oninput = updateCount;

    document.getElementById('encryptBtn').onclick = () => {
      try {
        const key = getKey();
        const result = HillCipher.encrypt(document.getElementById('plainText').value, key);
        document.getElementById('cipherOutput').textContent = result.text;
        document.getElementById('cipherInput').value = result.text;
        renderResolutionSection(result, 'encrypt');
        renderFrequencyChart(result.paddedText, result.text);
        updateValidation(false);

        window.MatrizandoStore?.markCompleted('criptografia');
        window.MatrizandoStore?.setLiveContext({
          page: 'criptografia',
          lastEvent: 'encrypted_ok',
          summary: `Criptografou "${result.clean}" em "${result.text}" usando chave ${size}×${size} (det=${result.determinant}).`
        });
        window.MatrizandoAgents?.reactToEvent(
          'cipher',
          `Criptografia concluída! "${result.clean}" virou "${result.text}" em ${result.blocks.length} blocos. Explore os cards abaixo ou clique em "▶ Assistir aula ao vivo (com voz)".`
        );
      } catch (e) {
        window.MatrizandoNavigation.showToast(e.message);
      }
    };

    document.getElementById('decryptBtn').onclick = () => {
      try {
        const key = getKey();
        const result = HillCipher.decrypt(
          document.getElementById('cipherInput').value,
          key,
          document.getElementById('removePadding').checked
        );
        document.getElementById('plainOutput').textContent = result.text;
        renderResolutionSection(result, 'decrypt');

        window.MatrizandoAgents?.reactToEvent(
          'cipher',
          `Descriptografia concluída! Aplicamos K⁻¹ e recuperamos "${result.text}".`
        );
      } catch (e) {
        window.MatrizandoNavigation.showToast(e.message);
      }
    };

    document.getElementById('clearBtn').onclick = () => {
      stopLessonPlayback();
      resState.result = null;
      document.getElementById('plainText').value = '';
      document.getElementById('cipherOutput').textContent = 'Seu código aparecerá aqui';
      document.getElementById('cipherInput').value = '';
      document.getElementById('plainOutput').textContent = 'O resultado aparecerá aqui';
      document.getElementById('cryptoChartHost').innerHTML = '';
      document.getElementById('mathSteps').innerHTML = '<div class="empty-steps">Clique em <b>Criptografar mensagem</b> ou <b>Descriptografar com K⁻¹</b> para visualizar a decomposição vetorial em grade.</div>';
      updateCount();
    };

    document.getElementById('copyCipher').onclick = () => copyText(document.getElementById('cipherOutput').textContent);
    document.getElementById('copyPlain').onclick = () => copyText(document.getElementById('plainOutput').textContent);
  }

  async function copyText(value) {
    if (!value || value.includes('aparecerá aqui')) return;
    try {
      await navigator.clipboard.writeText(value);
      window.MatrizandoNavigation.showToast('Copiado para a área de transferência!');
    } catch {
      const temp = document.createElement('textarea');
      temp.value = value;
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      try {
        document.execCommand('copy');
        window.MatrizandoNavigation.showToast('Copiado para a área de transferência!');
      } catch {
        window.MatrizandoNavigation.showToast('Selecione e copie o texto manualmente.');
      } finally {
        document.body.removeChild(temp);
      }
    }
  }

  return { render, stopLessonPlayback };
})();
