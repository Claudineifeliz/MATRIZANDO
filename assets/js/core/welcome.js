// ==========================================================================
// MATRIZANDO — Tela de Boas-Vindas Cinematográfica + Campo Magnético Interativo
// ==========================================================================

window.MatrizandoWelcome = (() => {
  const mathGlyphs = ['[A]', 'det', 'λ', 'K⁻¹', 'î', 'ĵ', 'R²', 'mod 26', 'Σ', 'T(v)', '01', 'I₃'];
  const dynamicSubtitles = [
    'Mova o cursor pela tela para sentir o <strong>campo magnético vetorial</strong> e entre no laboratório principal.',
    'Explore <strong>Criptografia de Hill</strong>, escalonamento de Gauss-Jordan e transformações 2D em tempo real.',
    'Conte com <strong>Prof. Matriz, Dra. Vetor e Agente Cipher</strong> arrastáveis por toda a tela ao seu lado.'
  ];

  let rafId = null;
  let sceneTimer = null;
  let subtitleTimer = null;
  let active = false;
  let exiting = false;
  let currentScene = 0;
  let subtitleIdx = 0;
  let sceneStartTime = 0;

  const SCENE_DURATION = 3400;

  let canvas = null;
  let ctx = null;
  let width = 0;
  let height = 0;
  let dpr = 1;

  const pointer = {
    x: -9999,
    y: -9999,
    active: false,
    smoothX: -9999,
    smoothY: -9999
  };

  const buttonMagnet = {
    tx: 0,
    ty: 0,
    x: 0,
    y: 0
  };

  let particles = [];
  let pulses = [];
  let resizeHandler = null;
  let keyHandler = null;

  function createParticles() {
    const area = width * height;
    const count = Math.max(58, Math.min(135, Math.floor(area / 12800)));
    particles = [];

    for (let i = 0; i < count; i++) {
      const homeX = Math.random() * width;
      const homeY = Math.random() * height;
      const isAccent = i % 9 === 0;
      const isGlyph = i % 11 === 0;
      particles.push({
        x: homeX,
        y: homeY,
        homeX,
        homeY,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: isAccent ? 2.4 + Math.random() * 1.4 : 1.2 + Math.random() * 1.8,
        driftAngle: Math.random() * Math.PI * 2,
        driftSpeed: 0.004 + Math.random() * 0.009,
        driftRadius: 16 + Math.random() * 34,
        isCrimson: isAccent,
        glyph: isGlyph ? mathGlyphs[i % mathGlyphs.length] : null,
        alpha: 0.35 + Math.random() * 0.5
      });
    }
  }

  function resizeCanvas() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createParticles();
  }

  function spawnPulse(x, y) {
    pulses.push({ x, y, radius: 12, maxRadius: Math.max(width, height) * 0.42, alpha: 0.72 });
  }

  function updateMagneticButton() {
    const btn = document.getElementById('enterAppBtn');
    if (!btn) return;

    if (pointer.active && !exiting) {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = pointer.x - cx;
      const dy = pointer.y - cy;
      const dist = Math.hypot(dx, dy);
      const magnetRange = 175;

      if (dist < magnetRange) {
        const pull = Math.pow(1 - dist / magnetRange, 1.45);
        buttonMagnet.tx = dx * pull * 0.34;
        buttonMagnet.ty = dy * pull * 0.34;
      } else {
        buttonMagnet.tx = 0;
        buttonMagnet.ty = 0;
      }
    } else {
      buttonMagnet.tx = 0;
      buttonMagnet.ty = 0;
    }

    buttonMagnet.x += (buttonMagnet.tx - buttonMagnet.x) * 0.14;
    buttonMagnet.y += (buttonMagnet.ty - buttonMagnet.y) * 0.14;
    btn.style.transform = `translate3d(${buttonMagnet.x.toFixed(2)}px, ${buttonMagnet.y.toFixed(2)}px, 0)`;
  }

  function drawFrame(now) {
    if (!active || !ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (pointer.active) {
      if (pointer.smoothX < -1000) {
        pointer.smoothX = pointer.x;
        pointer.smoothY = pointer.y;
      } else {
        pointer.smoothX += (pointer.x - pointer.smoothX) * 0.18;
        pointer.smoothY += (pointer.y - pointer.smoothY) * 0.18;
      }
    }

    const halo = document.getElementById('welcomeCursorHalo');
    if (halo && pointer.active) {
      halo.style.transform = `translate3d(${(pointer.smoothX - 170).toFixed(1)}px, ${(pointer.smoothY - 170).toFixed(1)}px, 0)`;
    }

    // Grade arquitetônica perspectiva sutil no fundo
    ctx.save();
    ctx.strokeStyle = 'rgba(216, 179, 106, 0.045)';
    ctx.lineWidth = 1;
    const step = 68;
    const offsetX = pointer.active ? ((pointer.smoothX / width) - 0.5) * -18 : 0;
    const offsetY = pointer.active ? ((pointer.smoothY / height) - 0.5) * -18 : 0;
    for (let x = (offsetX % step); x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = (offsetY % step); y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    const magnetRadius = Math.min(280, Math.max(195, width * 0.21));
    const linkRadius = 128;

    // Atualiza física magnética das partículas
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.driftAngle += p.driftSpeed;
      const targetX = p.homeX + Math.cos(p.driftAngle) * p.driftRadius;
      const targetY = p.homeY + Math.sin(p.driftAngle * 0.9) * p.driftRadius;

      // Força de retorno suave para casa
      p.vx += (targetX - p.x) * 0.0085;
      p.vy += (targetY - p.y) * 0.0085;

      // Força magnética de atração + leve órbita tangencial ao cursor
      let magnetIntensity = 0;
      if (pointer.active) {
        const dx = pointer.smoothX - p.x;
        const dy = pointer.smoothY - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 1 && dist < magnetRadius) {
          const force = Math.pow(1 - dist / magnetRadius, 1.55);
          magnetIntensity = force;

          if (exiting) {
            // Explosão suave ao entrar no laboratório
            p.vx -= (dx / dist) * force * 4.2;
            p.vy -= (dy / dist) * force * 4.2;
          } else {
            // Atração magnética (puxa em direção ao cursor, formando anel elegante ao redor)
            const attract = dist > 42 ? 1.42 : -0.35;
            p.vx += (dx / dist) * force * attract;
            p.vy += (dy / dist) * force * attract;
            // Sutil rotação de campo eletromagnético
            p.vx += (-dy / dist) * force * 0.34;
            p.vy += (dx / dist) * force * 0.34;
          }
        }
      }

      // Efeito dos pulsos de clique
      for (let k = 0; k < pulses.length; k++) {
        const pulse = pulses[k];
        const pdx = p.x - pulse.x;
        const pdy = p.y - pulse.y;
        const pdist = Math.hypot(pdx, pdy);
        if (Math.abs(pdist - pulse.radius) < 38 && pdist > 1) {
          p.vx += (pdx / pdist) * 0.85 * pulse.alpha;
          p.vy += (pdy / pdist) * 0.85 * pulse.alpha;
        }
      }

      p.vx *= 0.89;
      p.vy *= 0.89;
      p.x += p.vx;
      p.y += p.vy;
      p.magnetIntensity = magnetIntensity;
    }

    // Linhas magnéticas entre partículas e o cursor
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];

      if (pointer.active && a.magnetIntensity > 0.06) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(pointer.smoothX, pointer.smoothY);
        ctx.strokeStyle = a.isCrimson
          ? `rgba(225, 14, 23, ${(a.magnetIntensity * 0.55).toFixed(3)})`
          : `rgba(240, 210, 144, ${(a.magnetIntensity * 0.48).toFixed(3)})`;
        ctx.lineWidth = 0.7 + a.magnetIntensity * 1.1;
        ctx.stroke();
      }

      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < linkRadius) {
          const boost = Math.max(a.magnetIntensity || 0, b.magnetIntensity || 0);
          const alpha = (1 - dist / linkRadius) * (0.14 + boost * 0.38);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = (a.isCrimson || b.isCrimson) && boost > 0.25
            ? `rgba(225, 14, 23, ${alpha.toFixed(3)})`
            : `rgba(216, 179, 106, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 0.75 + boost * 0.65;
          ctx.stroke();
        }
      }
    }

    // Desenha anéis magnéticos ao redor do cursor
    if (pointer.active && !exiting) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(pointer.smoothX, pointer.smoothY, 24 + Math.sin(now * 0.005) * 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(240, 210, 144, 0.34)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(pointer.smoothX, pointer.smoothY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#e10e17';
      ctx.shadowColor = '#ff2530';
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.restore();
    }

    // Desenha ondas de pulso magnético
    for (let k = pulses.length - 1; k >= 0; k--) {
      const pulse = pulses[k];
      pulse.radius += 9.5;
      pulse.alpha *= 0.94;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(240, 210, 144, ${pulse.alpha.toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      if (pulse.alpha < 0.02 || pulse.radius > pulse.maxRadius) {
        pulses.splice(k, 1);
      }
    }

    // Desenha partículas e símbolos vetoriais
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const glow = p.magnetIntensity || 0;
      const r = p.radius + glow * 1.9;

      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = p.isCrimson
        ? `rgba(235, 34, 44, ${Math.min(1, p.alpha + glow * 0.5).toFixed(2)})`
        : `rgba(240, 210, 144, ${Math.min(1, p.alpha + glow * 0.45).toFixed(2)})`;
      ctx.fill();

      if (p.glyph) {
        ctx.fillStyle = `rgba(240, 210, 144, ${(0.22 + glow * 0.65).toFixed(2)})`;
        ctx.fillText(p.glyph, p.x, p.y - 9);
      }
    }

    // Barra de progresso cinematográfica da cena
    const fill = document.getElementById('welcomeProgressFill');
    if (fill && !exiting) {
      const elapsed = now - sceneStartTime;
      const totalDuration = SCENE_DURATION * 3;
      const totalElapsed = currentScene * SCENE_DURATION + Math.min(SCENE_DURATION, elapsed);
      const pct = currentScene === 2
        ? 100
        : Math.min(100, (totalElapsed / totalDuration) * 100);
      fill.style.width = `${pct.toFixed(1)}%`;
    }

    updateMagneticButton();
    rafId = window.requestAnimationFrame(drawFrame);
  }

  function showScene(index) {
    const scenes = Array.from(document.querySelectorAll('.welcome-scene'));
    const dots = Array.from(document.querySelectorAll('.welcome-dot'));
    if (!scenes.length) return;

    const clamped = Math.max(0, Math.min(scenes.length - 1, index));
    scenes.forEach((el, idx) => {
      if (idx === clamped) {
        el.classList.remove('exiting');
        el.classList.add('active');
      } else if (el.classList.contains('active')) {
        el.classList.remove('active');
        el.classList.add('exiting');
      } else {
        el.classList.remove('active', 'exiting');
      }
    });

    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === clamped);
      dot.setAttribute('aria-selected', String(idx === clamped));
    });

    currentScene = clamped;
    sceneStartTime = performance.now();

    window.clearTimeout(sceneTimer);
    if (clamped < scenes.length - 1) {
      sceneTimer = window.setTimeout(() => {
        if (active && !exiting) showScene(clamped + 1);
      }, SCENE_DURATION);
    } else {
      startSubtitleCycle();
    }
  }

  function startSubtitleCycle() {
    window.clearInterval(subtitleTimer);
    const subEl = document.getElementById('welcomeDynamicSubtitle');
    if (!subEl) return;

    subtitleTimer = window.setInterval(() => {
      if (!active || exiting || currentScene !== 2) return;
      subtitleIdx = (subtitleIdx + 1) % dynamicSubtitles.length;
      subEl.style.opacity = '0';
      window.setTimeout(() => {
        if (!active) return;
        subEl.innerHTML = dynamicSubtitles[subtitleIdx];
        subEl.style.opacity = '1';
      }, 320);
    }, 4200);
  }

  function enterApp() {
    if (!active || exiting) return;
    exiting = true;
    const intro = document.getElementById('welcomeIntro');
    if (!intro) return;

    spawnPulse(width / 2, height / 2);
    window.clearTimeout(sceneTimer);
    window.clearInterval(subtitleTimer);
    intro.classList.add('is-leaving');

    window.setTimeout(() => {
      stopEngine();
      intro.hidden = true;
      intro.classList.remove('is-leaving');
      document.body.classList.remove('intro-active');
      exiting = false;
      document.getElementById('pageContent')?.focus({ preventScroll: true });
    }, 820);
  }

  function stopEngine() {
    active = false;
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
    window.clearTimeout(sceneTimer);
    window.clearInterval(subtitleTimer);
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
      resizeHandler = null;
    }
    if (keyHandler) {
      document.removeEventListener('keydown', keyHandler);
      keyHandler = null;
    }
  }

  function open() {
    const intro = document.getElementById('welcomeIntro');
    canvas = document.getElementById('welcomeMagnetCanvas');
    if (!intro || !canvas) return;

    stopEngine();
    exiting = false;
    active = true;
    intro.hidden = false;
    intro.classList.remove('is-leaving');
    document.body.classList.add('intro-active');

    resizeCanvas();
    resizeHandler = () => resizeCanvas();
    window.addEventListener('resize', resizeHandler);

    keyHandler = event => {
      if (!active || exiting) return;
      if (event.key === 'Enter' || event.key === 'Escape') {
        event.preventDefault();
        enterApp();
      }
    };
    document.addEventListener('keydown', keyHandler);

    const subEl = document.getElementById('welcomeDynamicSubtitle');
    if (subEl) {
      subEl.style.transition = 'opacity 0.35s ease';
    }

    showScene(0);
    rafId = window.requestAnimationFrame(drawFrame);
  }

  function init() {
    const intro = document.getElementById('welcomeIntro');
    if (!intro) return;

    intro.addEventListener('pointermove', event => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
      const coords = document.getElementById('welcomeCoords');
      if (coords) {
        const px = String(Math.round(event.clientX)).padStart(3, '0');
        const py = String(Math.round(event.clientY)).padStart(3, '0');
        coords.textContent = `X: ${px} · Y: ${py}`;
      }
    });

    intro.addEventListener('pointerleave', () => {
      pointer.active = false;
    });

    intro.addEventListener('pointerdown', event => {
      if (event.target.closest('button')) return;
      spawnPulse(event.clientX, event.clientY);
    });

    document.getElementById('enterAppBtn')?.addEventListener('click', enterApp);
    document.getElementById('skipIntroBtn')?.addEventListener('click', enterApp);

    document.querySelectorAll('[data-goto-scene]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.gotoScene);
        if (Number.isFinite(idx)) showScene(idx);
      });
    });

    // Exibe a tela de boas-vindas sempre que o navegador abrir ou recarregar a página
    open();
  }

  return {
    init,
    open,
    enterApp
  };
})();
