/* ============================================================
   ACADEMY PAGE URLS — the one place to set them.
   Every academy link (intro cards, learning path, footer) carries
   data-academy="<key>". While a URL is empty the link keeps its
   on-page #anchor. TODO: fill in when each page is live.
   ============================================================ */
const ACADEMY_URLS = {
  youth: '', // AI Native Academy            TODO: update when page is live
  pro:   '', // AI Professional Academy      TODO: update when page is live
  exec:  '', // Executive Academy            TODO: update when page is live
  ent:   ''  // Enterprise AI Transformation TODO: update when page is live
};
document.querySelectorAll('a[data-academy]').forEach((a) => {
  const url = ACADEMY_URLS[a.dataset.academy];
  if (url) a.href = url;
});

/* =========================================================
   BLACK ALPHA — Home interactions
   GSAP 3 + ScrollTrigger + Lenis. Every motion path is gated:
   ?noanim or prefers-reduced-motion renders a static page.
   ========================================================= */
(() => {
  const html = document.documentElement;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const MOTION = html.classList.contains('anim') && hasGSAP;
  if (!MOTION) html.classList.remove('anim');
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const DESKTOP = '(min-width: 901px)';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (MOTION && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis; // QA: __lenis.scrollTo(el, { immediate: true })
  }
  function scrollToTarget(target, offset = 0) {
    if (lenis) lenis.scrollTo(target, { offset, duration: 1.4 });
    else {
      const y = (typeof target === 'number') ? target : target.getBoundingClientRect().top + scrollY + offset;
      scrollTo({ top: y, behavior: MOTION ? 'smooth' : 'auto' });
    }
  }
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = document.getElementById(id.slice(1));
      if (!t) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(t, id === '#top' ? 0 : -24);
    });
  });

  /* ---------- Nav ---------- */
  const nav = $('#nav');
  const lightSections = $$('.theme-light');
  let lastY = scrollY;
  function onScrollNav() {
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    if (!nav.classList.contains('is-open')) nav.classList.toggle('is-hidden', y > lastY && y > 160);
    lastY = y;
    const probe = 44;
    nav.classList.toggle('is-light', lightSections.some((s) => {
      const r = s.getBoundingClientRect();
      return r.top <= probe && r.bottom >= probe;
    }));
  }
  addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  const menu = $('#menu');
  const toggle = $('.nav__toggle');
  function closeMenu() {
    if (!nav.classList.contains('is-open')) return;
    nav.classList.remove('is-open');
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    lenis && lenis.start();
  }
  toggle.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    if (!open) return closeMenu();
    nav.classList.add('is-open');
    nav.classList.remove('is-hidden');
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    lenis && lenis.stop();
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Cursor ---------- */
  if (FINE && hasGSAP) {
    const cur = $('.cursor');
    const xTo = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
    addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    addEventListener('pointerdown', () => cur.classList.add('is-down'));
    addEventListener('pointerup', () => cur.classList.remove('is-down'));
    document.addEventListener('pointerover', (e) => {
      cur.classList.toggle('is-hover', !!e.target.closest('a, button, input, summary, .inds span'));
    });
    document.addEventListener('pointerleave', () => gsap.set(cur, { opacity: 0 }));
    document.addEventListener('pointerenter', () => gsap.set(cur, { opacity: 1 }));
  }

  /* ---------- Magnetic buttons ---------- */
  if (FINE && MOTION) {
    $$('.magnetic').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.22);
        yTo((e.clientY - r.top - r.height / 2) * 0.32);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- Scramble (nav links) ---------- */
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ01αβ/<>';
  $$('[data-scramble]').forEach((el) => {
    const orig = el.textContent;
    let raf = 0;
    el.addEventListener('pointerenter', () => {
      if (!MOTION) return;
      cancelAnimationFrame(raf);
      const start = performance.now();
      const run = (now) => {
        const p = clamp((now - start) / 420, 0, 1);
        const reveal = Math.floor(p * orig.length);
        el.textContent = orig.split('').map((c, i) =>
          (i < reveal || c === ' ') ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]).join('');
        if (p < 1) raf = requestAnimationFrame(run); else el.textContent = orig;
      };
      raf = requestAnimationFrame(run);
    });
  });

  /* ---------- Word splitting ---------- */
  function splitWords(el) {
    const words = [];
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span');
            s.className = 'w';
            s.textContent = part;
            frag.appendChild(s);
            words.push(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    return words;
  }

  /* ---------- Marquee (clone for seamless loop) ---------- */
  const mset = $('.marquee__set');
  if (mset) mset.after(mset.cloneNode(true));

  /* ---------- Sphere field (hero + globe) ---------- */
  function Sphere(canvas, o) {
    const ctx = canvas.getContext('2d');
    const N = o.count;
    const pts = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      pts.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r, n: Math.random(), ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 1.6 });
    }
    const pairs = [];
    if (o.lines) {
      const thr = o.lineDist;
      for (let i = 0; i < N; i++) {
        let c = 0;
        for (let j = i + 1; j < N && c < 3; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, dz = pts[i].z - pts[j].z;
          if (dx * dx + dy * dy + dz * dz < thr * thr) { pairs.push(i, j); c++; }
        }
      }
    }
    const proj = new Float32Array(N * 3);
    const state = { w: 0, h: 0, dpr: 1, rotY: 0, tiltX: 0.25, tiltY: 0, mx: -9999, my: -9999, tx: 0, ty: 0, disperse: 0, fade: 1, speed: o.speed, running: false, visible: true };

    function resize() {
      const r = canvas.getBoundingClientRect();
      state.dpr = Math.min(devicePixelRatio || 1, 2);
      state.w = r.width; state.h = r.height;
      canvas.width = Math.round(r.width * state.dpr);
      canvas.height = Math.round(r.height * state.dpr);
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    }

    const BUCKETS = 5;
    function frame(t) {
      const { w, h } = state;
      ctx.clearRect(0, 0, w, h);
      if (state.fade <= 0.01) return;
      state.rotY += state.speed;
      state.tiltX += ((0.25 + state.ty * 0.35) - state.tiltX) * 0.05;
      state.tiltY += ((state.tx * 0.5) - state.tiltY) * 0.05;

      const R = Math.min(w, h) * o.radius * (1 + state.disperse * 0.35);
      const cx = w * o.cx, cy = h * o.cy;
      const cyR = Math.cos(state.rotY + state.tiltY), syR = Math.sin(state.rotY + state.tiltY);
      const cxR = Math.cos(state.tiltX), sxR = Math.sin(state.tiltX);
      const fov = 2.4;
      const time = t * 0.001;

      for (let i = 0; i < N; i++) {
        const p = pts[i];
        const k = 1 + state.disperse * (0.4 + p.n * 1.6);
        let x = p.x * k, y = p.y * k, z = p.z * k;
        const x1 = x * cyR - z * syR, z1 = x * syR + z * cyR;
        const y2 = y * cxR - z1 * sxR, z2 = y * sxR + z1 * cxR;
        const s = fov / (fov + z2);
        let px = cx + x1 * R * s, py = cy + y2 * R * s;
        if (o.interactive) {
          const dx = px - state.mx, dy = py - state.my, d = Math.hypot(dx, dy);
          if (d < 140 && d > 0.01) { const f = (1 - d / 140) * 34; px += (dx / d) * f; py += (dy / d) * f; }
        }
        proj[i * 3] = px; proj[i * 3 + 1] = py;
        proj[i * 3 + 2] = (1 - (z2 + 1) / 2); // 1 = front, 0 = back
      }

      // lines, bucketed by alpha
      if (pairs.length) {
        ctx.lineWidth = 0.6;
        for (let b = 0; b < BUCKETS; b++) {
          ctx.beginPath();
          const lo = b / BUCKETS, hi = (b + 1) / BUCKETS;
          for (let k = 0; k < pairs.length; k += 2) {
            const a = pairs[k], c = pairs[k + 1];
            const dep = Math.min(proj[a * 3 + 2], proj[c * 3 + 2]);
            if (dep < lo || dep >= hi) continue;
            ctx.moveTo(proj[a * 3], proj[a * 3 + 1]);
            ctx.lineTo(proj[c * 3], proj[c * 3 + 1]);
          }
          ctx.strokeStyle = `rgba(255,255,255,${(0.02 + hi * o.lineAlpha) * state.fade})`;
          ctx.stroke();
        }
      }
      // points, bucketed by alpha
      for (let b = 0; b < BUCKETS; b++) {
        const lo = b / BUCKETS, hi = (b + 1) / BUCKETS;
        ctx.fillStyle = `rgba(255,255,255,${(0.08 + hi * o.dotAlpha) * state.fade})`;
        for (let i = 0; i < N; i++) {
          const dep = proj[i * 3 + 2];
          if (dep < lo || dep >= hi) continue;
          const tw = 0.75 + 0.25 * Math.sin(time * pts[i].sp + pts[i].ph);
          const sz = (0.6 + dep * o.dotSize) * tw;
          ctx.fillRect(proj[i * 3] - sz / 2, proj[i * 3 + 1] - sz / 2, sz, sz);
        }
      }
    }

    function loop(t) {
      if (!state.running) return;
      frame(t);
      requestAnimationFrame(loop);
    }
    function start() { if (state.running || !MOTION) return; state.running = true; requestAnimationFrame(loop); }
    function stop() { state.running = false; }

    resize();
    addEventListener('resize', () => { resize(); if (!MOTION) frame(0); });
    new IntersectionObserver(([e]) => { e.isIntersecting ? start() : stop(); }).observe(canvas);
    if (!MOTION) frame(0);
    return { state, frame, resize };
  }

  const heroCanvas = $('#heroCanvas');
  const small = innerWidth < 700;
  const hero = heroCanvas && Sphere(heroCanvas, {
    count: small ? 520 : 900, radius: small ? 0.42 : 0.36, cx: 0.5, cy: small ? 0.42 : 0.5,
    lines: true, lineDist: small ? 0.2 : 0.14, lineAlpha: 0.16,
    dotAlpha: 0.7, dotSize: 1.7, speed: 0.0016, interactive: FINE,
  });
  if (hero && FINE) {
    const sec = $('.hero');
    sec.addEventListener('pointermove', (e) => {
      const r = heroCanvas.getBoundingClientRect();
      hero.state.mx = e.clientX - r.left; hero.state.my = e.clientY - r.top;
      hero.state.tx = (e.clientX / innerWidth - 0.5); hero.state.ty = (e.clientY / innerHeight - 0.5);
    });
    sec.addEventListener('pointerleave', () => { hero.state.mx = hero.state.my = -9999; hero.state.tx = hero.state.ty = 0; });
  }

  const globeCanvas = $('#globeCanvas');
  const globe = globeCanvas && Sphere(globeCanvas, {
    count: 460, radius: 0.36, cx: 0.5, cy: 0.4,
    lines: true, lineDist: 0.16, lineAlpha: 0.12,
    dotAlpha: 0.75, dotSize: 1.4, speed: 0.003, interactive: false,
  });
  if (globe) {
    const cell = globeCanvas.closest('.cell');
    cell.addEventListener('pointerenter', () => MOTION && gsap.to(globe.state, { speed: 0.012, duration: 0.8 }));
    cell.addEventListener('pointerleave', () => MOTION && gsap.to(globe.state, { speed: 0.003, duration: 1.2 }));
  }

  /* ---------- Hero entrance + scroll ---------- */
  if (MOTION) {
    const tl = gsap.timeline({ delay: 0.15 });
    tl.fromTo('[data-hero-word]', { opacity: 0, yPercent: 40, filter: 'blur(14px)' },
      { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 1.3, ease: 'expo.out', stagger: 0.12 })
      .fromTo('[data-hero]', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 }, 0.35)
      .add(startPromptLoop, 0.9);
    if (hero) gsap.fromTo(hero.state, { disperse: 1.4, fade: 0 }, { disperse: 0, fade: 1, duration: 2.4, ease: 'expo.out' });

    gsap.to('.hero__inner', {
      yPercent: -14, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    if (hero) {
      ScrollTrigger.create({
        trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true,
        onUpdate: (st) => { hero.state.disperse = st.progress * 1.3; hero.state.fade = 1 - st.progress * 0.85; },
      });
    }
  } else {
    setTimeout(startPromptLoop, 0); // after the prompt constants below are initialised
  }

  /* ---------- Ask Alpha prompt ---------- */
  const PROMPTS = [
    'Build an AI roadmap for my company…',
    'Teach my team to automate weekly reports…',
    'Help my 13-year-old build a first AI app…',
    'Prepare our board for AI governance…',
  ];
  const ROUTES = {
    youth: { name: 'AI Native Academy', href: '#academy-youth' },
    pro: { name: 'AI Professional Academy', href: '#academy-pro' },
    exec: { name: 'Executive Academy', href: '#academy-exec' },
    ent: { name: 'Enterprise AI Transformation', href: '#academy-ent' },
  };
  const promptEl = $('.prompt');
  const input = $('#promptInput');
  const answer = $('.prompt__answer');
  let promptTimer = 0;
  function startPromptLoop() {
    if (!input) return;
    if (!MOTION) { input.placeholder = 'Ask Alpha — ' + PROMPTS[0]; return; }
    let pi = 0, ci = 0, dir = 1, hold = 0;
    clearInterval(promptTimer);
    promptTimer = setInterval(() => {
      if (document.activeElement === input || input.value) return;
      const full = PROMPTS[pi];
      if (hold > 0) { hold--; return; }
      ci += dir;
      if (ci >= full.length) { dir = -1; hold = 38; }
      if (ci <= 0) { dir = 1; pi = (pi + 1) % PROMPTS.length; hold = 6; }
      input.placeholder = full.slice(0, ci) + (ci % 2 ? '▏' : '');
    }, 42);
  }
  function classify(text) {
    const t = text.toLowerCase();
    if (/\b(child|kid|son|daughter|teen|student|school|1[0-8]|year[- ]old|youth|holiday|bootcamp)\b/.test(t)) return 'youth';
    if (/\b(board|ceo|c-suite|leadership|executive|director|governance|founder)\b/.test(t)) return 'exec';
    if (/\b(company|organi[sz]ation|enterprise|readiness|business|firm|transformation|roadmap)\b/.test(t)) return 'ent';
    return 'pro';
  }
  function answerFor(key) {
    const r = ROUTES[key];
    answer.innerHTML = `→ Recommended: <b>${r.name}</b> · <a href="${r.href}" data-go>See programme</a>`;
    answer.classList.add('is-on');
    answer.querySelector('[data-go]').addEventListener('click', (e) => { e.preventDefault(); scrollToTarget($(r.href), -24); });
    setFinder(key);
  }
  function submitPrompt() {
    const v = input.value.trim();
    if (!v) { input.focus(); promptEl.animate?.([{ translate: '0 0' }, { translate: '-6px 0' }, { translate: '6px 0' }, { translate: '0 0' }], { duration: 280 }); return; }
    answerFor(classify(v));
  }
  $('.prompt__go').addEventListener('click', submitPrompt);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitPrompt(); });

  /* ---------- Split headings ---------- */
  $$('[data-split]').forEach((el) => {
    const words = splitWords(el);
    if (!MOTION) return;
    gsap.fromTo(words, { opacity: 0, y: 28, filter: 'blur(10px)' }, {
      opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'expo.out', stagger: 0.035,
      scrollTrigger: { trigger: el, start: 'top 86%' },
    });
  });

  /* ---------- Manifesto highlight ---------- */
  const mani = $('[data-highlight]');
  if (mani) {
    const words = splitWords(mani);
    if (MOTION) {
      gsap.fromTo(words, { opacity: 0.14 }, {
        opacity: 1, ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger: mani, start: 'top 78%', end: 'bottom 42%', scrub: true },
      });
    }
  }

  /* ---------- Generic reveals + counters ---------- */
  if (MOTION) {
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 88%',
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08, overwrite: true }),
    });
  }
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count;
    if (!MOTION) { el.textContent = end; return; }
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 1.6, ease: 'expo.out', onUpdate: () => { el.textContent = Math.round(o.v); } }),
    });
  });

  /* ---------- The Path (ascent) ---------- */
  const pathSec = $('.path');
  const route = $('#routeLive');
  const routeShadow = $('#routeShadow');
  const art = $('.ascent__art');
  const climber = $('.ascent__climber');
  const peaks = $$('.peak');
  const stepItems = $$('.stepper__item');
  const stepper = $('.stepper');
  const altitude = $('#altitude');
  const meterBar = $('.ascent__meter');
  const nowEl = $('#ascentNow');
  const NOW = ['AI Native Academy', 'AI Professional Academy', 'Executive Academy', 'Enterprise AI Transformation'];
  const PEAKS = [[400, 865], [860, 585], [1180, 380], [1435, 180]]; // summit tips in artwork px (1900×1350)
  const VB = [1900, 1350];
  let routeLen = 0;
  let peakAt = [0.25, 0.5, 0.75, 1];
  let pathActive = -1;
  let pathP = 0;
  if (route) {
    routeLen = route.getTotalLength();
    [route, routeShadow].forEach((r) => { r.style.strokeDasharray = routeLen; r.style.strokeDashoffset = routeLen; });
    // where along the route each summit sits (nearest sampled point)
    peakAt = PEAKS.map(([px, py]) => {
      let best = 0, bd = Infinity;
      for (let i = 0; i <= 600; i++) {
        const pt = route.getPointAtLength((routeLen * i) / 600);
        const d = (pt.x - px) ** 2 + (pt.y - py) ** 2;
        if (d < bd) { bd = d; best = i / 600; }
      }
      return best;
    });
    peakAt[peakAt.length - 1] = 1;
  }
  function setPath(p) {
    if (!route) return;
    pathP = p;
    const off = routeLen * (1 - p);
    route.style.strokeDashoffset = off;
    routeShadow.style.strokeDashoffset = off;
    const pt = route.getPointAtLength(routeLen * p);
    climber.style.left = (pt.x / VB[0]) * 100 + '%';
    climber.style.top = (pt.y / VB[1]) * 100 + '%';
    climber.style.opacity = p > 0.004 && p < 0.998 ? 1 : 0;

    let active = 0;
    peaks.forEach((el, i) => { const on = p >= peakAt[i] - 0.012; el.classList.toggle('is-on', on); if (on) active = i; });
    peaks.forEach((el, i) => el.classList.toggle('is-current', i === active && p >= peakAt[i] - 0.012));
    if (active !== pathActive) {
      pathActive = active;
      stepItems.forEach((s, i) => {
        s.classList.toggle('is-active', i === active);
        s.classList.toggle('is-done', i < active);
        $('.stepper__head', s).setAttribute('aria-expanded', i === active);
      });
      nowEl.classList.add('is-swap');
      setTimeout(() => { nowEl.textContent = NOW[active]; nowEl.classList.remove('is-swap'); }, MOTION ? 180 : 0);
    }
    stepper.style.setProperty('--p', p);
    meterBar.style.setProperty('--p', p);
    altitude.textContent = Math.round(p * 100) + '%';
    if (art && MOTION) art.style.transform = `scale(${1.1 - 0.1 * p}) translateY(${(1 - p) * 2}%)`;
  }
  const pathTween = { p: 0 };
  function animatePathTo(p) {
    if (!MOTION) return setPath(p);
    pathTween.p = pathP;
    gsap.to(pathTween, { p, duration: 1.2, ease: 'expo.out', overwrite: true, onUpdate: () => setPath(pathTween.p) });
  }
  let pathST = null;
  stepItems.forEach((item, i) => {
    $('.stepper__head', item).addEventListener('click', () => {
      const target = Math.min(1, peakAt[i] + 0.004);
      if (pathST) scrollToTarget(pathST.start + (pathST.end - pathST.start) * target);
      else animatePathTo(target);
    });
  });

  // pointer parallax: artwork drifts one way, glass chips the other
  if (FINE && MOTION) {
    const stage = $('.ascent__stage');
    const layers = $$('[data-depth]', stage);
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(stage, { rotateY: dx * 5, rotateX: -dy * 4, transformPerspective: 1400, duration: 0.9, ease: 'power3.out' });
      gsap.to('.ascent__img', { x: -dx * 14, y: -dy * 10, duration: 0.9, ease: 'power3.out' });
      layers.forEach((l) => gsap.to(l, { x: dx * +l.dataset.depth * 0.5, y: dy * +l.dataset.depth * 0.4, duration: 0.9, ease: 'power3.out' }));
    });
    stage.addEventListener('pointerleave', () => {
      gsap.to(stage, { rotateY: 0, rotateX: 0, duration: 1.1, ease: 'power3.out' });
      gsap.to(['.ascent__img', ...layers], { x: 0, y: 0, duration: 1.1, ease: 'power3.out' });
    });
  }

  /* ---------- Cycle (orbiting satellites) ---------- */
  const sats = $$('.sat');
  const loopItems = $$('.loopList__item');
  const loopImg = $('.loop__img');
  const loopNum = $('#loopNum');
  const N = sats.length;
  const ORBIT = { cx: 50, cy: 54, rx: 46, ry: 15 }; // % of stage — matches the SVG track
  const orbit = { pos: 0 };                          // continuous stage index; front = bottom of the ellipse
  let orbitActive = -1;
  function layoutOrbit() {
    sats.forEach((el, i) => {
      const a = (90 + (i - orbit.pos) * (360 / N)) * Math.PI / 180;
      const sin = Math.sin(a);
      const d = (sin + 1) / 2;                       // 0 = far side, 1 = nearest the viewer
      el.style.left = ORBIT.cx + ORBIT.rx * Math.cos(a) + '%';
      el.style.top = ORBIT.cy + ORBIT.ry * sin + '%';
      el.style.transform = `scale(${0.6 + 0.45 * d})`;
      el.style.opacity = 0.28 + 0.72 * d;
      el.style.zIndex = sin > 0 ? 2 : 0;             // behind the loops on the far side (image is screen-blended)
    });
    if (loopImg && MOTION) loopImg.style.transform = `rotate(${-orbit.pos * 7}deg) scale(1.02)`;
    const idx = ((Math.round(orbit.pos) % N) + N) % N;
    if (idx !== orbitActive) setOrbitActive(idx);
  }
  function setOrbitActive(i) {
    orbitActive = i;
    sats.forEach((el, k) => el.classList.toggle('is-on', k === i));
    loopItems.forEach((el, k) => {
      el.classList.toggle('is-active', k === i);
      $('.loopList__head', el).setAttribute('aria-expanded', k === i);
    });
    loopNum.textContent = String(i + 1).padStart(2, '0');
  }
  if (loopImg) loopImg.style.transformOrigin = '50% 47.5%';
  layoutOrbit();

  /* ---------- Responsive scroll scenes ---------- */
  let cycleST = null;
  let cycleAuto = 0;
  if (MOTION) {
    const mm = gsap.matchMedia();

    mm.add(DESKTOP, () => {
      // Path: pin + climb the route
      pathST = ScrollTrigger.create({
        trigger: pathSec, pin: '.path__pin', start: 'top top', end: '+=260%', scrub: 0.7,
        onUpdate: (st) => setPath(st.progress),
      });
      setPath(0);

      // Academies: cards recede as the next one stacks on top
      const cards = $$('.acad');
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next) return;
        const topPx = 96 + (i + 1) * 18;
        const st = { trigger: next, start: 'top bottom', end: `top ${topPx}px`, scrub: true };
        gsap.to(card, { scale: 0.94, ease: 'none', scrollTrigger: st });
        gsap.to($('.acad__shade', card), { opacity: 0.55, ease: 'none', scrollTrigger: { ...st } });
      });

      // Method: horizontal travel
      const track = $('.method__track');
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const fill = $('.bar__fill');
      const phases = $$('.phases li');
      const count = $('.method__count b');
      const mtl = gsap.timeline({
        scrollTrigger: {
          trigger: '.method', pin: '.method__pin', start: 'top top', end: () => '+=' + dist() * 1.1,
          scrub: 0.8, invalidateOnRefresh: true,
          onUpdate: (st) => {
            const p = st.progress;
            fill.style.transform = `scaleX(${p})`;
            const ph = Math.min(phases.length - 1, Math.floor(p * phases.length));
            phases.forEach((l, i) => l.classList.toggle('is-on', i === ph));
            count.textContent = String(Math.min(6, 1 + Math.round(p * 5))).padStart(2, '0');
          },
        },
      });
      mtl.to(track, { x: () => -dist(), ease: 'none' }, 0)
        .to('.method__ghost', { x: () => -dist() * 0.4, ease: 'none' }, 0);

      // Cycle: pin, bring each stage to the front in turn
      cycleST = ScrollTrigger.create({
        trigger: '.cycle', pin: '.cycle__pin', start: 'top top', end: '+=220%', scrub: 0.7,
        snap: { snapTo: 1 / (N - 1), duration: { min: 0.25, max: 0.7 }, ease: 'power2.inOut' },
        onUpdate: (st) => { orbit.pos = st.progress * (N - 1); layoutOrbit(); },
      });

      return () => { cycleST = null; pathST = null; };
    });

    mm.add('(max-width: 900px)', () => {
      setPath(0);
      ScrollTrigger.create({
        trigger: '.ascent', start: 'top 70%', end: 'bottom 20%', scrub: 0.6,
        onUpdate: (st) => setPath(st.progress),
      });
      startCycleAuto();
      return () => clearInterval(cycleAuto);
    });

    // Footer wordmark rise
    gsap.fromTo('.footer__word', { yPercent: 40, opacity: 0 }, {
      yPercent: 0, opacity: 1, ease: 'none',
      scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
    });
  } else {
    route && setPath(1);
  }

  function rotateOrbitTo(i) {
    const target = i + N * Math.round((orbit.pos - i) / N); // nearest way round the loop
    if (MOTION) gsap.to(orbit, { pos: target, duration: 1.1, ease: 'expo.out', overwrite: true, onUpdate: layoutOrbit });
    else { orbit.pos = target; layoutOrbit(); }
  }
  function startCycleAuto() {
    clearInterval(cycleAuto);
    cycleAuto = setInterval(() => {
      if (MOTION) gsap.to(orbit, { pos: Math.round(orbit.pos) + 1, duration: 1.2, ease: 'expo.inOut', overwrite: true, onUpdate: layoutOrbit });
    }, 4200);
  }
  loopItems.forEach((el, i) => $('.loopList__head', el).addEventListener('click', () => {
    if (cycleST) scrollToTarget(cycleST.start + (cycleST.end - cycleST.start) * (i / (N - 1)));
    else {
      rotateOrbitTo(i);
      if (MOTION && innerWidth <= 900) startCycleAuto();
    }
  }));

  // Mobile method progress follows the native horizontal scroller
  const vp = $('.method__viewport');
  vp && vp.addEventListener('scroll', () => {
    if (innerWidth > 900) return;
    const p = vp.scrollLeft / Math.max(1, vp.scrollWidth - vp.clientWidth);
    $('.bar__fill').style.transform = `scaleX(${p})`;
    const phases = $$('.phases li');
    const ph = Math.min(phases.length - 1, Math.floor(p * phases.length));
    phases.forEach((l, i) => l.classList.toggle('is-on', i === ph));
    $('.method__count b').textContent = String(Math.min(6, 1 + Math.round(p * 5))).padStart(2, '0');
  }, { passive: true });

  /* ---------- Spotlight cells ---------- */
  $$('.spot').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', e.clientX - r.left + 'px');
      el.style.setProperty('--my', e.clientY - r.top + 'px');
    });
  });

  /* ---------- Terminal ---------- */
  const term = $('#termBody');
  const SCRIPT = [
    ['u', '> alpha learn --track "AI Productivity"'],
    ['ok', '  ✓ modules loaded: research · writing · data · meetings'],
    ['u', '> summarise ./board-pack-Q3.pdf --for "CEO" --bullets 5'],
    ['dim', '  … reading 42 pages'],
    ['ok', '  ✓ 5 decisions · 3 risks · 2 open questions'],
    ['u', '> build agent weekly-sales-report --source crm'],
    ['dim', '  … connecting CRM · drafting summary · scheduling'],
    ['ok', '  ✓ agent live — runs every Monday 08:00'],
  ];
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  function renderTerm(lines, partial) {
    term.innerHTML = lines.map(([c, t]) => `<span class="${c}">${esc(t)}</span>`).join('\n') +
      (partial != null ? (lines.length ? '\n' : '') + `<span class="u">${esc(partial)}</span>` : '') +
      '<span class="cur"></span>';
  }
  if (term) {
    if (!MOTION) renderTerm(SCRIPT);
    else {
      let running = false, timer = 0;
      const play = () => {
        if (running) return;
        running = true;
        const done = [];
        let li = 0;
        const next = () => {
          if (li >= SCRIPT.length) { timer = setTimeout(() => { running = false; play(); }, 5200); return; }
          const [cls, text] = SCRIPT[li];
          if (cls === 'u') {
            let ci = 0;
            const type = () => {
              renderTerm(done, text.slice(0, ++ci));
              if (ci < text.length) timer = setTimeout(type, 24 + Math.random() * 30);
              else { done.push(SCRIPT[li]); li++; timer = setTimeout(next, 380); }
            };
            type();
          } else {
            done.push(SCRIPT[li]); li++;
            renderTerm(done);
            timer = setTimeout(next, cls === 'dim' ? 700 : 420);
          }
        };
        renderTerm([]);
        next();
      };
      ScrollTrigger.create({
        trigger: term, start: 'top 85%', end: 'bottom top',
        onEnter: play, onEnterBack: play,
        onLeave: () => { clearTimeout(timer); running = false; },
        onLeaveBack: () => { clearTimeout(timer); running = false; },
      });
    }
  }

  /* ---------- Radar ---------- */
  const radar = $('.radar');
  if (radar) {
    const AX = ['Strategy', 'Operations', 'People', 'Technology', 'Governance'];
    const BEFORE = [0.78, 0.52, 0.64, 0.86, 0.42];
    const AFTER = [0.94, 0.86, 0.88, 0.95, 0.84];
    const CX = 120, CY = 118, RR = 82;
    const pt = (i, v) => {
      const a = (-90 + i * (360 / AX.length)) * Math.PI / 180;
      return [CX + Math.cos(a) * RR * v, CY + Math.sin(a) * RR * v];
    };
    const g = $('.radar__grid', radar);
    const lbl = $('.radar__labels', radar);
    const NS = 'http://www.w3.org/2000/svg';
    [0.25, 0.5, 0.75, 1].forEach((v) => {
      const p = document.createElementNS(NS, 'polygon');
      p.setAttribute('points', AX.map((_, i) => pt(i, v).join(',')).join(' '));
      g.appendChild(p);
    });
    AX.forEach((name, i) => {
      const l = document.createElementNS(NS, 'line');
      const [x, y] = pt(i, 1);
      l.setAttribute('x1', CX); l.setAttribute('y1', CY); l.setAttribute('x2', x); l.setAttribute('y2', y);
      g.appendChild(l);
      const t = document.createElementNS(NS, 'text');
      const [tx, ty] = pt(i, 1.2);
      t.setAttribute('x', tx); t.setAttribute('y', ty + 3);
      t.setAttribute('text-anchor', Math.abs(tx - CX) < 4 ? 'middle' : (tx > CX ? 'start' : 'end'));
      t.textContent = name.toUpperCase();
      lbl.appendChild(t);
    });
    const shape = $('.radar__shape', radar);
    const vals = { v: BEFORE.map(() => 0) };
    const draw = () => shape.setAttribute('points', vals.v.map((v, i) => pt(i, v).join(',')).join(' '));
    const note = radar.parentElement.querySelector('.cell__note');
    const to = (arr, dur = 1.2) => MOTION ? gsap.to(vals.v, { ...arr, duration: dur, ease: 'expo.out', onUpdate: draw }) : (vals.v = arr.slice(), draw());
    if (MOTION) {
      draw();
      ScrollTrigger.create({ trigger: radar, start: 'top 85%', once: true, onEnter: () => to(BEFORE, 1.6) });
    } else { vals.v = BEFORE.slice(); draw(); }
    const cell = radar.closest('.cell');
    note.textContent = 'Illustrative · hover for post-roadmap';
    cell.addEventListener('pointerenter', () => { to(AFTER, 0.9); note.textContent = 'Illustrative · after 12-month roadmap'; });
    cell.addEventListener('pointerleave', () => { to(BEFORE, 0.9); note.textContent = 'Illustrative · hover for post-roadmap'; });
  }

  /* ---------- Segmented controls ---------- */
  function initSeg(seg, onChange) {
    const pill = $('.seg__pill', seg);
    const tabs = $$('[role="tab"]', seg);
    const place = (btn) => {
      pill.style.width = btn.offsetWidth + 'px';
      pill.style.height = btn.offsetHeight + 'px';
      pill.style.translate = `${btn.offsetLeft}px ${btn.offsetTop - 4}px`;
    };
    const select = (btn, focus) => {
      tabs.forEach((t) => { t.setAttribute('aria-selected', t === btn); t.tabIndex = t === btn ? 0 : -1; });
      place(btn);
      if (focus) btn.focus();
      onChange && onChange(btn);
    };
    tabs.forEach((t, i) => {
      t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
      });
    });
    const current = () => tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0];
    requestAnimationFrame(() => place(current()));
    addEventListener('resize', () => place(current()));
    document.fonts && document.fonts.ready.then(() => place(current()));
    return { select: (key) => { const t = tabs.find((x) => x.dataset.key === key); t && select(t); } };
  }

  const formatSeg = $('.cell--format .seg');
  const formatDesc = $('.seg__desc');
  formatSeg && initSeg(formatSeg, (btn) => {
    formatDesc.classList.add('is-swap');
    setTimeout(() => { formatDesc.textContent = btn.dataset.desc; formatDesc.classList.remove('is-swap'); }, 180);
  });

  /* ---------- Finder ---------- */
  const FINDER = {
    youth: {
      title: 'AI Native Academy',
      desc: 'Start with AI Creator (10–12), AI Builder (13–15) or AI Founder (16–18) — or try a 2–5 day holiday bootcamp first.',
      format: 'In-person · Holiday bootcamps', dur: 'Term programmes', out: 'A portfolio of real AI projects', cta: 'Reserve a seat',
    },
    pro: {
      title: 'AI Professional Academy',
      desc: 'Begin at Level 1 — AI Productivity — then progress to AI Builder and AI Business Operator as your skills grow.',
      format: 'In-person · Live online', dur: 'Three progressive levels', out: 'Workflows and tools you use on Monday', cta: 'Choose your level',
    },
    exec: {
      title: 'Executive Academy',
      desc: 'Join a 1–2 day Executive Education programme, or the 6–8 week Leadership Programme built around your real challenges.',
      format: 'In-person · Private cohorts', dur: '', out: "Your company's AI transformation blueprint", cta: 'Request an invitation',
    },
    ent: {
      title: 'Enterprise AI Transformation',
      desc: 'Start with an AI Readiness Assessment to understand your starting point — then build the roadmap and pilots together.',
      format: 'On-site · Embedded teams', dur: 'Assessment → long-term partnership', out: 'Measurable business impact', cta: 'Book a readiness call',
    },
  };
  const fcard = $('.fcard');
  function renderFinder(key) {
    const d = FINDER[key];
    fcard.classList.add('is-swap');
    setTimeout(() => {
      $('.fcard__title', fcard).textContent = d.title;
      $('.fcard__desc', fcard).textContent = d.desc;
      $('.fcard__format', fcard).textContent = d.format;
      $('.fcard__dur', fcard).textContent = d.dur;
      $('.fcard__dur', fcard).parentElement.hidden = !d.dur;
      $('.fcard__out', fcard).textContent = d.out;
      $('.fcard__cta', fcard).textContent = d.cta;
      fcard.classList.remove('is-swap');
    }, MOTION ? 240 : 0);
  }
  const finderSeg = $('.finder__seg');
  const finder = finderSeg && initSeg(finderSeg, (btn) => renderFinder(btn.dataset.key));
  function setFinder(key) { finder && finder.select(key); }

  /* ---------- Briefing form ---------- */
  const form = $('#briefForm');
  if (form) {
    const email = $('#briefEmail');
    const msg = $('.brief__msg', form);
    const valid = () => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
    email.addEventListener('input', () => {
      if (email.getAttribute('aria-invalid') === 'true' && valid()) { email.removeAttribute('aria-invalid'); msg.textContent = ''; }
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!valid()) {
        email.setAttribute('aria-invalid', 'true');
        msg.textContent = 'Please enter a valid email address.';
        email.focus();
        return;
      }
      const btn = $('button', form);
      btn.disabled = true;
      $('span', btn).textContent = 'Subscribed ✓';
      email.disabled = true;
      msg.textContent = "You're on the list. The first briefing lands next month.";
    });
  }

  /* ---------- Misc ---------- */
  addEventListener('load', () => hasGSAP && ScrollTrigger.refresh());
})();
