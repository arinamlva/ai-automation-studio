/* =========================================================
   AI AUTOMATION STUDIO · site runtime (vanilla, no build)
   ========================================================= */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (p, e0, e1) => { const t = clamp((p - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const rng = seed => { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const SVGNS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs = {}, parent) => { const el = document.createElementNS(SVGNS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); if (parent) parent.appendChild(el); return el; };

  const CFG = window.SITE_CONFIG || { contacts: {}, form: {} };
  const I18N = window.I18N;
  const RMQ = matchMedia('(prefers-reduced-motion: reduce)');
  let RM = RMQ.matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------------------------------------------------------
     LANGUAGE
     --------------------------------------------------------- */
  let LANG = 'en';
  const enCache = new Map();
  $$('[data-i18n]').forEach(el => enCache.set(el, el.innerHTML));
  const D = () => I18N.dyn[LANG];
  const langListeners = [];

  function applyLang(lang, save) {
    LANG = lang === 'ru' ? 'ru' : 'en';
    document.documentElement.lang = LANG;
    document.title = LANG === 'ru' ? 'AI Automation Studio · Автоматизация и AI для бизнеса' : 'AI Automation Studio · AI infrastructure for business';
    $$('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const html = LANG === 'en' ? enCache.get(el) : (I18N.ru[key] != null ? I18N.ru[key] : enCache.get(el));
      if (el.classList.contains('split')) { el.dataset.src = html; splitEl(el); }
      else if (el.innerHTML !== html) el.innerHTML = html;
    });
    if (save) store.set('aas-lang', LANG);
    langListeners.forEach(fn => fn());
  }
  $('[data-lang-toggle]').addEventListener('click', () => applyLang(LANG === 'en' ? 'ru' : 'en', true));

  /* ---------------------------------------------------------
     TEXT SPLITTING (seeded, done once per language)
     --------------------------------------------------------- */
  function splitEl(el) {
    const src = el.dataset.src || el.innerHTML;
    el.dataset.src = src;
    const lines = src.split(/<br\s*\/?>/i).map(s => s.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
    const type = el.dataset.split;
    const r = rng(type.length * 977 + lines.join('').length * 31);
    const total = lines.join('').replace(/\s/g, '').length || 1;
    const words = lines.join(' ').split(/\s+/).length || 1;
    let ci = 0, wi = 0;
    const sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = lines.join(' ');
    const vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true');
    lines.forEach((line, li) => {
      if (li) vis.appendChild(document.createElement('br'));
      line.split(/\s+/).forEach((word, k, arr) => {
        const w = document.createElement('span'); w.className = 'w';
        if (/^AI[.,]?$/.test(word) && type === 'rise') w.classList.add('em');
        if (type === 'drift' || type === 'rise') w.style.setProperty('--th', (wi / words * 0.5).toFixed(3));
        [...word].forEach(ch => {
          const c = document.createElement('span'); c.className = 'c'; c.textContent = ch;
          if (type === 'grid') {
            c.style.setProperty('--th', (ci / total * 0.5 + r() * 0.06).toFixed(3));
            c.style.setProperty('--jx', ((r() < .5 ? -1 : 1) * (18 + r() * 34)).toFixed(1) + 'px');
          } else if (type === 'weave') {
            c.style.setProperty('--th', (r() * 0.5).toFixed(3));
            c.style.setProperty('--jy', ((ci % 2 ? 1 : -1) * (16 + r() * 16)).toFixed(1) + 'px');
          }
          w.appendChild(c); ci++;
        });
        vis.appendChild(w); wi++;
        if (k < arr.length - 1) vis.appendChild(document.createTextNode(' '));
      });
    });
    el.textContent = ''; el.appendChild(sr); el.appendChild(vis);
  }

  /* ---------------------------------------------------------
     PRELOADER
     --------------------------------------------------------- */
  const booting = document.documentElement.classList.contains('booting');
  const bootDelay = booting ? 1150 : 0;
  if (booting) {
    setTimeout(() => {
      document.documentElement.classList.add('booted');
      try { sessionStorage.setItem('aas-booted', '1'); } catch (e) {}
      setTimeout(() => document.documentElement.classList.remove('booting'), 520);
    }, bootDelay);
  }

  /* ---------------------------------------------------------
     CURSOR (fine pointers only, native cursor kept)
     --------------------------------------------------------- */
  (function cursor() {
    const root = $('.cursor'); if (!root) return;
    const dot = $('.cursor__dot', root), ring = $('.cursor__ring', root);
    let mx = -100, my = -100, rx = -100, ry = -100, raf = null, on = false;
    const HOT = 'a,button,summary,select,input,textarea,label,[role="tab"],.net__mod,.net__core,.tech';
    function loop() {
      rx = lerp(rx, mx, 0.2); ry = lerp(ry, my, 0.2);
      ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      if (Math.abs(rx - mx) + Math.abs(ry - my) > 0.3) raf = requestAnimationFrame(loop); else raf = null;
    }
    addEventListener('pointermove', e => {
      if (!FINE.matches || e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
      if (!on) { on = true; rx = mx; ry = my; root.classList.add('is-on'); }
      root.classList.remove('is-hidden');
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('pointerover', e => root.classList.toggle('is-hover', !!(e.target.closest && e.target.closest(HOT))));
    document.addEventListener('pointerdown', () => root.classList.add('is-down'));
    document.addEventListener('pointerup', () => root.classList.remove('is-down'));
    document.documentElement.addEventListener('pointerleave', () => root.classList.add('is-hidden'));
  })();

  /* ---------------------------------------------------------
     NAV
     --------------------------------------------------------- */
  const nav = $('.nav'), burger = $('.burger'), mnav = $('#mnav');
  function navSolid() { nav.classList.toggle('is-solid', scrollY > 40 || !burger.matches('[aria-expanded="false"]')); }
  addEventListener('scroll', navSolid, { passive: true });
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open); mnav.hidden = !open; navSolid();
  });
  mnav.addEventListener('click', e => { if (e.target.closest('a')) { burger.setAttribute('aria-expanded', 'false'); mnav.hidden = true; navSolid(); } });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !mnav.hidden) { burger.click(); burger.focus(); } });
  const navLinks = $$('.nav__links a');
  const secObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['services', 'process', 'scenarios', 'contact', 'about', 'stack', 'why'].forEach(id => { const s = document.getElementById(id); if (s) secObs.observe(s); });

  /* ---------------------------------------------------------
     NETWORK: AI CORE + modules
     --------------------------------------------------------- */
  const net = (function network() {
    const wrap = $('#net'), svg = $('#netSvg'), tip = $('.net-tip', wrap);
    const MODS = ['CRM', 'TELEGRAM', 'EMAIL', 'API', 'AI AGENT', 'DATABASE', 'ANALYTICS'];
    const LAYOUT = {
      video: { vb: [1728, 976], par: 'xMidYMid slice', fs: 15, h: 44, core: [864, 836],
        pos: { TELEGRAM: [330, 300], CRM: [300, 470], EMAIL: [372, 640], API: [864, 548], 'AI AGENT': [1398, 300], DATABASE: [1428, 470], ANALYTICS: [1356, 640] } },
      card: { vb: [600, 620], par: 'xMidYMid meet', fs: 19, h: 50, core: [300, 318], pos: null }
    };
    const CROSS = [['TELEGRAM', 'CRM'], ['CRM', 'EMAIL'], ['AI AGENT', 'DATABASE'], ['DATABASE', 'ANALYTICS'], ['API', 'DATABASE'], ['API', 'CRM'], ['EMAIL', 'AI AGENT']];
    let mode = null, edges = [], modEls = {}, focus = null, running = false, raf = null, last = 0, visible = false, active = false;

    function cardPos() {
      const p = {}; const [cx, cy] = LAYOUT.card.core;
      MODS.forEach((m, i) => { const a = -Math.PI / 2 + i * (Math.PI * 2 / MODS.length); p[m] = [cx + Math.cos(a) * 205, cy + Math.sin(a) * 228]; });
      return p;
    }
    function bez(e, t) {
      const u = 1 - t, [p0, p1, p2, p3] = e.pts;
      return [u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0], u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]];
    }
    function build(m) {
      mode = m; const L = LAYOUT[m]; const pos = m === 'card' ? cardPos() : L.pos; const [cx, cy] = L.core;
      svg.textContent = ''; edges = []; modEls = {};
      svg.setAttribute('viewBox', `0 0 ${L.vb[0]} ${L.vb[1]}`);
      svg.setAttribute('preserveAspectRatio', L.par);
      svg.style.setProperty('--nfs', L.fs + 'px');
      const gE = svgEl('g', {}, svg), gP = svgEl('g', {}, svg), gM = svgEl('g', {}, svg);
      const mkEdge = (a, b, pa, pb, cross) => {
        let pts;
        if (cross) { const mxp = (pa[0] + pb[0]) / 2, myp = (pa[1] + pb[1]) / 2; pts = [pa, [lerp(pa[0], mxp, .6), lerp(pa[1], myp, .2)], [lerp(pb[0], mxp, .6), lerp(pb[1], myp, .2)], pb]; }
        else if (m === 'video') pts = [pa, [lerp(pa[0], pb[0], .5), pa[1]], [lerp(pa[0], pb[0], .85), pb[1] - 40], pb];
        else pts = [pa, [lerp(pa[0], pb[0], .35), lerp(pa[1], pb[1], .1)], [lerp(pa[0], pb[0], .7), lerp(pa[1], pb[1], .75)], pb];
        const d = `M${pts[0]} C${pts[1]} ${pts[2]} ${pts[3]}`;
        const path = svgEl('path', { d, class: 'net__edge' + (cross ? ' net__edge--x' : '') }, gE);
        let len = 0; try { len = path.getTotalLength(); } catch (e) { len = 800; }
        path.style.setProperty('--len', Math.ceil(len));
        const pulse = svgEl('circle', { r: m === 'video' ? 4.5 : 5.5, class: 'net__pulse' }, gP);
        const e = { a, b, pts, path, pulse, cross, t: Math.random(), v: (cross ? 0.12 : 0.22) + Math.random() * 0.12, dir: Math.random() < .5 ? 1 : -1 };
        edges.push(e); return e;
      };
      MODS.forEach(mn => mkEdge(mn, 'CORE', pos[mn], [cx, cy], false));
      CROSS.forEach(([a, b]) => mkEdge(a, b, pos[a], pos[b], true));
      // core
      const core = svgEl('g', { class: 'net__core', tabindex: '0', role: 'button', 'data-id': 'CORE', transform: `translate(${cx} ${cy})` }, gM);
      svgEl('circle', { r: m === 'video' ? 92 : 56, class: 'core-ring' }, core);
      const cw = L.fs * 7.4 + 30;
      svgEl('rect', { x: -cw / 2, y: -L.h / 2, width: cw, height: L.h, rx: L.h / 2, class: 'core-pill' }, core);
      const ct = svgEl('text', { class: 'core-label' }, core); ct.textContent = 'AI CORE';
      modEls.CORE = core;
      // modules
      MODS.forEach((mn, i) => {
        const [x, y] = pos[mn];
        const w = mn.length * L.fs * 0.78 + L.fs * 3.6;
        const g = svgEl('g', { class: 'net__mod', tabindex: '0', role: 'button', 'data-id': mn, transform: `translate(${x} ${y})` }, gM);
        svgEl('rect', { x: -w / 2, y: -L.h / 2, width: w, height: L.h, rx: 3 }, g);
        svgEl('circle', { cx: -w / 2 + L.fs * 0.9, cy: 0, r: L.fs * 0.2, class: 'net__dot' }, g);
        const t = svgEl('text', { x: L.fs * 0.5 }, g); t.textContent = mn;
        const idx = svgEl('text', { class: 'net__idx', x: w / 2 - L.fs * 0.2, y: -L.h / 2 - L.fs * 0.6, 'text-anchor': 'end' }, g); idx.textContent = '0' + (i + 1);
        modEls[mn] = g;
      });
      labels(); bind(); placePulses();
    }
    function labels() {
      Object.entries(modEls).forEach(([id, g]) => { const [n, d] = D().net[id]; g.setAttribute('aria-label', `${n}: ${d}`); });
      if (focus) showTip(focus);
    }
    function setFocus(id) {
      focus = id;
      svg.classList.toggle('has-focus', !!id);
      Object.entries(modEls).forEach(([k, g]) => g.classList.toggle('is-focus', k === id || (id === 'CORE' && k !== 'CORE')));
      edges.forEach(e => { const on = !!id && (e.a === id || e.b === id || (id === 'CORE' && !e.cross)); e.path.classList.toggle('is-focus', on); e.pulse.classList.toggle('is-focus', on); });
      if (id) showTip(id); else tip.classList.remove('is-on');
    }
    function showTip(id) {
      const [n, d] = D().net[id];
      tip.innerHTML = `<b>${n}</b>${d}`;
      const g = modEls[id]; const wr = wrap.getBoundingClientRect(); const r = g.getBoundingClientRect();
      const tw = Math.min(280, wr.width - 24);
      let x = r.left - wr.left + r.width / 2 - tw / 2; x = clamp(x, 12, wr.width - tw - 12);
      let y = r.bottom - wr.top + 12; if (y + 90 > wr.height) y = r.top - wr.top - 96;
      tip.style.width = tw + 'px';
      tip.style.transform = ''; tip.style.left = x + 'px'; tip.style.top = y + 'px';
      tip.classList.add('is-on');
    }
    function bind() {
      Object.entries(modEls).forEach(([id, g]) => {
        g.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') setFocus(id); });
        g.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') setFocus(null); });
        g.addEventListener('click', () => setFocus(focus === id ? null : id));
        g.addEventListener('focus', () => setFocus(id));
        g.addEventListener('blur', () => setFocus(null));
        g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFocus(focus === id ? null : id); } });
      });
    }
    document.addEventListener('pointerdown', e => { if (focus && !e.target.closest('.net__mod,.net__core')) setFocus(null); });
    function placePulses() { edges.forEach(e => { const [x, y] = bez(e, e.dir > 0 ? e.t : 1 - e.t); e.pulse.setAttribute('cx', x.toFixed(1)); e.pulse.setAttribute('cy', y.toFixed(1)); }); }
    function tick(now) {
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      edges.forEach(e => { e.t += e.v * dt; if (e.t > 1) { e.t -= 1; e.dir = e.cross ? -e.dir : 1; if (!e.cross) e.dir = Math.random() < .55 ? 1 : -1; } });
      placePulses();
      raf = requestAnimationFrame(tick);
    }
    function sync() {
      const should = visible && active && !RM && !document.hidden;
      if (should === running) return;
      running = should; svg.classList.toggle('is-running', running);
      if (running) { last = 0; raf = requestAnimationFrame(tick); } else if (raf) { cancelAnimationFrame(raf); raf = null; }
    }
    new IntersectionObserver(en => { visible = en[0].isIntersecting; sync(); }).observe(wrap);
    document.addEventListener('visibilitychange', sync);
    langListeners.push(labels);
    return {
      build, sync,
      get mode() { return mode; },
      setActive(v) { if (v !== active) { active = v; sync(); if (!v && focus) setFocus(null); } },
      setDraw(k) { svg.style.setProperty('--draw', k.toFixed(3)); },
      refreshTip() { if (focus) showTip(focus); }
    };
  })();

  /* ---------------------------------------------------------
     HERO: scroll-scrubbed video with live static gates
     --------------------------------------------------------- */
  (function hero() {
    const heroEl = $('#hero'), stage = $('.stage', heroEl), video = $('#heroVideo'), posterLayer = $('.poster', heroEl);
    const ring = $('.ring', heroEl), netWrap = $('#net');
    const VIDEO_URL = 'assets/hero-scrub.mp4', POSTER = 'assets/hero-poster.jpg', VIDEO_BYTES = 2078777;
    const bands = $$('.band', heroEl).map((el, i, arr) => {
      const [a, b] = el.dataset.band.split(',').map(Number);
      return { el, a, b, i, last: i === arr.length - 1, ramp: Number(el.dataset.ramp) || Math.min(0.025, (b - a) * 0.35), op: -1, k: -1, ks: -1, kb: -1 };
    });
    $$('.split').forEach(splitEl);

    let target = 0, shown = 0, rafId = null, lastTick = 0, heroOnScreen = true, scrubOn = false, loadK = RM ? 1 : 0, inited = false;
    let seekBusy = false, pendingTime = null, lastNetOp = -1, lastFlags = '';

    function heroProgress() {
      const r = heroEl.getBoundingClientRect(); const range = heroEl.offsetHeight - innerHeight;
      return range > 0 ? clamp(-r.top / range, 0, 1) : 0;
    }
    function requestSeek(t) {
      if (!video.duration || !isFinite(video.duration)) return;
      t = clamp(t, 0, video.duration - 0.04);
      if (seekBusy) { pendingTime = t; return; }
      seekBusy = true; video.currentTime = t;
    }
    video.addEventListener('seeked', () => { seekBusy = false; if (pendingTime !== null) { const t = pendingTime; pendingTime = null; requestSeek(t); } });
    video.addEventListener('error', () => { seekBusy = false; pendingTime = null; stage.classList.add('video-failed'); });

    function updateCaptions(p) {
      bands.forEach(B => {
        const f = Math.min(0.02, (B.b - B.a) / 3);
        const inO = B.i === 0 ? 1 : smoothstep(p, B.a, B.a + f);
        const outO = B.last ? 1 : 1 - smoothstep(p, B.b - f, B.b);
        const op = +(inO * outO).toFixed(3);
        let k = clamp((p - B.a) / B.ramp, 0, 1);
        if (B.i === 0) k = Math.max(Math.min(k, 1), loadK);
        k = +k.toFixed(3);
        if (op !== B.op) { B.op = op; B.el.style.opacity = op; B.el.classList.toggle('is-live', op > 0.5); B.el.setAttribute('aria-hidden', op < 0.05 && B.i !== 0 ? 'true' : 'false'); }
        if (Math.abs(k - B.k) >= 0.008 || (k === 1 && B.k !== 1) || (k === 0 && B.k !== 0)) {
          B.k = k; B.el.style.setProperty('--k', k);
          if (B.i === 0) {
            B.el.style.setProperty('--ks', clamp((k - 0.5) * 3, 0, 1).toFixed(3));
            B.el.style.setProperty('--kb', clamp((k - 0.68) * 3.5, 0, 1).toFixed(3));
            B.el.style.setProperty('--kc0', clamp(k * 3, 0, 1).toFixed(3));
          } else B.el.style.setProperty('--ks', clamp((k - 0.5) * 2.5, 0, 1).toFixed(3));
          if (B.last) net.setDraw(k);
        }
        if (B.last && op !== lastNetOp) {
          lastNetOp = op; netWrap.style.opacity = op;
          netWrap.classList.toggle('is-live', op > 0.5); net.setActive(op > 0.05);
          if (op > 0.5) net.refreshTip();
        }
      });
      const flags = (p > 0.02 ? 's' : '') + (p > 0.78 ? 'e' : '');
      if (flags !== lastFlags) { lastFlags = flags; heroEl.classList.toggle('scrolled', p > 0.02); heroEl.classList.toggle('at-end', p > 0.78); }
    }

    function tick(now) {
      const dt = Math.min(100, now - (lastTick || now)); lastTick = now;
      const k = 0.16;
      shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));
      if (Math.abs(target - shown) < 0.0005) { shown = target; rafId = null; lastTick = 0; }
      else rafId = requestAnimationFrame(tick);
      requestSeek(shown * (video.duration || 0));
      updateCaptions(shown);
    }
    function onScroll() {
      target = heroProgress();
      if (rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick);
    }
    new IntersectionObserver(en => { heroOnScreen = en[0].isIntersecting; if (heroOnScreen && scrubOn) onScroll(); }).observe(heroEl);

    // band one: one-time load ramp, hands over to scroll
    function loadRamp() {
      const start = performance.now() + (booting ? bootDelay + 150 : 150);
      const step = now => {
        loadK = easeOut(clamp((now - start) / 1300, 0, 1));
        if (scrubOn) { bands[0].k = -1; updateCaptions(shown); }
        if (loadK < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    // video load: poster first, then streamed Blob with honest ring
    function initHeroOnce() {
      if (inited) return; inited = true;
      posterLayer.style.backgroundImage = `url('${POSTER}')`;
      let started = false;
      const startBlobFetch = () => { if (started) return; started = true; loadHeroBlob().catch(failVideo); };
      const img = new Image(); img.onload = startBlobFetch; img.onerror = startBlobFetch; img.src = POSTER;
      setTimeout(startBlobFetch, 4000);
    }
    async function loadHeroBlob() {
      if (location.protocol === 'file:') throw new Error('file protocol');
      const ctrl = new AbortController();
      let watchdog = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(VIDEO_URL, { priority: 'low', signal: ctrl.signal });
      if (!res.ok) throw new Error('video ' + res.status);
      const total = Number(res.headers.get('Content-Length')) || VIDEO_BYTES;
      const reader = res.body.getReader(); const chunks = []; let got = 0, lastRing = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        clearTimeout(watchdog); watchdog = setTimeout(() => ctrl.abort(), 20000);
        chunks.push(value); got += value.length;
        const frac = Math.min(1, got / total); const now = performance.now();
        if (now - lastRing > 100 || frac === 1) { lastRing = now; ring.style.setProperty('--ld', Math.round(126 * (1 - frac))); }
      }
      clearTimeout(watchdog);
      ring.style.setProperty('--ld', 0);
      video.src = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
      video.load();
      video.addEventListener('loadeddata', () => {
        requestSeek(heroProgress() * video.duration);
        stage.classList.add('video-ready');
      }, { once: true });
    }
    function failVideo() { stage.classList.add('video-failed'); ring.style.opacity = '0'; }

    const GATES = [
      '(max-width: 720px)',
      '(orientation: portrait) and (max-width: 1024px)',
      '(orientation: portrait) and (pointer: coarse)',
      '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
      '(prefers-reduced-motion: reduce)'
    ];
    const MQLS = GATES.map(q => matchMedia(q));
    function enableScrub() {
      if (scrubOn) return; scrubOn = true;
      net.build('video');
      initHeroOnce();
      if (inited) posterLayer.style.backgroundImage = `url('${POSTER}')`;
      addEventListener('scroll', onScroll, { passive: true });
      bands.forEach(b => { b.op = -1; b.k = -1; }); lastNetOp = -1;
      shown = target = heroProgress();
      updateCaptions(shown);
      onScroll();
    }
    function disableScrub() {
      if (!scrubOn && net.mode) return;
      scrubOn = false;
      removeEventListener('scroll', onScroll);
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      bands.forEach(b => { b.el.style.removeProperty('opacity'); b.el.style.setProperty('--k', 1); b.el.classList.add('is-live'); b.el.removeAttribute('aria-hidden'); });
      ['--ks', '--kb', '--kc0'].forEach(v => bands[0].el.style.removeProperty(v));
      posterLayer.style.removeProperty('background-image');
      netWrap.style.removeProperty('opacity'); netWrap.classList.add('is-live');
      net.build('card'); net.setDraw(1); net.setActive(true);
      heroEl.classList.remove('at-end', 'scrolled'); lastFlags = '';
    }
    function applyHeroMode() { if (MQLS.some(m => m.matches)) disableScrub(); else enableScrub(); }
    MQLS.forEach(m => m.addEventListener('change', applyHeroMode));
    applyHeroMode();
    loadRamp();
    addEventListener('resize', () => { if (scrubOn) { onScroll(); net.refreshTip(); } }, { passive: true });
    langListeners.push(() => { bands.forEach(b => b.k = -1); if (scrubOn) updateCaptions(shown); });
  })();

  /* ---------------------------------------------------------
     REVEALS, section lines, live demos
     --------------------------------------------------------- */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); revealObs.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  $$('.reveal').forEach(el => revealObs.observe(el));
  // stagger services modules on first reveal, then retire the delay
  $$('.mod').forEach((m, i) => { m.style.transitionDelay = (i % 2) * 90 + 'ms'; m.addEventListener('transitionend', () => m.style.removeProperty('transition-delay'), { once: true }); });
  const drawObs = new IntersectionObserver(entries => { entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-drawn'); drawObs.unobserve(en.target); } }); }, { threshold: 0.05 });
  $$('.sec').forEach(s => drawObs.observe(s));
  const liveObs = new IntersectionObserver(entries => entries.forEach(en => en.target.classList.toggle('live', en.isIntersecting)), { threshold: 0.15 });
  $$('.mod').forEach(m => liveObs.observe(m));

  /* ---------------------------------------------------------
     ABOUT: chaos to system, driven by scroll
     --------------------------------------------------------- */
  (function chaos() {
    const cv = $('#chaosCanvas'); if (!cv) return;
    const ctx = cv.getContext('2d'); const fig = cv.parentElement; const meter = $('.chaos__meter', fig);
    let W = 0, H = 0, dpr = 1, pts = [], chaosLines = [], hub = [0, 0], visible = false, raf = null, t = 0, tt = 0, cols = 0, rows = 0;
    function setup() {
      const r = cv.getBoundingClientRect(); if (!r.width) return;
      dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const R = rng(42); const small = W < 560;
      cols = small ? 6 : 9; rows = small ? 5 : 6;
      const mx = W * 0.1, my = H * 0.14, gw = W * 0.56, gh = H * 0.62;
      hub = [W * 0.86, H * 0.45];
      pts = [];
      for (let r0 = 0; r0 < rows; r0++) for (let c = 0; c < cols; c++) {
        pts.push({ ox: mx + c * gw / (cols - 1), oy: my + r0 * gh / (rows - 1), cx: R() * W * 0.92 + W * 0.04, cy: R() * H * 0.8 + H * 0.06, ph: R() * 6.28, sp: 0.6 + R(), d: R(), r0, c });
      }
      chaosLines = []; for (let i = 0; i < pts.length * 0.9; i++) chaosLines.push([Math.floor(R() * pts.length), Math.floor(R() * pts.length)]);
      draw(performance.now());
    }
    function progress() { const r = fig.getBoundingClientRect(); return clamp(1 - (r.top + r.height / 2 - innerHeight * 0.4) / (innerHeight * 0.55), 0, 1); }
    function draw(now) {
      const time = now / 1000;
      ctx.clearRect(0, 0, W, H);
      const P = pts.map(p => {
        const tp = easeOut(clamp((tt - p.d * 0.35) / 0.65, 0, 1)); const j = (1 - tp) * (RM ? 0 : 6);
        return [lerp(p.cx, p.ox, tp) + Math.sin(time * p.sp + p.ph) * j, lerp(p.cy, p.oy, tp) + Math.cos(time * p.sp * 1.3 + p.ph) * j, tp];
      });
      // chaos lines
      const ca = (1 - tt) * 0.5;
      if (ca > 0.01) { ctx.strokeStyle = `rgba(242,244,245,${ca * 0.35})`; ctx.lineWidth = 1; ctx.beginPath(); chaosLines.forEach(([a, b]) => { ctx.moveTo(P[a][0], P[a][1]); ctx.lineTo(P[b][0], P[b][1]); }); ctx.stroke(); }
      // order lines
      const oa = smoothstep(tt, 0.45, 1);
      if (oa > 0.01) {
        ctx.strokeStyle = `rgba(242,244,245,${oa * 0.22})`; ctx.beginPath();
        pts.forEach((p, i) => { if (p.c < cols - 1) { ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[i + 1][0], P[i + 1][1]); } if (p.r0 < rows - 1) { ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[i + cols][0], P[i + cols][1]); } });
        ctx.stroke();
        ctx.strokeStyle = `rgba(182,255,74,${oa * 0.6})`; ctx.beginPath();
        for (let r0 = 0; r0 < rows; r0++) { const i = r0 * cols + cols - 1; const x0 = P[i][0], y0 = P[i][1]; ctx.moveTo(x0, y0); ctx.bezierCurveTo(lerp(x0, hub[0], .5), y0, lerp(x0, hub[0], .5), hub[1], hub[0] - 16, hub[1]); }
        ctx.stroke();
        // routed pulses
        if (oa > 0.6 && !RM) {
          ctx.fillStyle = `rgba(182,255,74,${oa})`;
          for (let r0 = 0; r0 < rows; r0++) { const q = ((time * 0.18 + r0 * 0.37) % 1); const i0 = r0 * cols; const x = lerp(P[i0][0], P[i0 + cols - 1][0], q); ctx.beginPath(); ctx.arc(x, P[i0][1], 2.2, 0, 6.29); ctx.fill(); }
        }
        // hub
        ctx.fillStyle = `rgba(182,255,74,${oa})`; ctx.beginPath(); ctx.arc(hub[0], hub[1], 7, 0, 6.29); ctx.fill();
        ctx.strokeStyle = `rgba(182,255,74,${oa * 0.4})`; ctx.beginPath(); ctx.arc(hub[0], hub[1], 18 + (RM ? 0 : Math.sin(time * 2) * 2), 0, 6.29); ctx.stroke();
      }
      // points
      P.forEach(([x, y, tp]) => { ctx.fillStyle = tp > 0.98 ? 'rgba(242,244,245,.85)' : `rgba(133,141,152,${0.55 + tp * 0.3})`; ctx.fillRect(x - 1.6, y - 1.6, 3.2, 3.2); });
      meter.style.setProperty('--t', tt.toFixed(3));
    }
    function loop(now) {
      t = RM ? 1 : progress();
      tt += (t - tt) * 0.12;
      draw(now);
      raf = visible && !document.hidden ? requestAnimationFrame(loop) : null;
    }
    new IntersectionObserver(en => { visible = en[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(fig);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && visible && !raf) raf = requestAnimationFrame(loop); });
    let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(setup, 150); });
    setup();
  })();

  /* ---------------------------------------------------------
     PROCESS TIMELINE
     --------------------------------------------------------- */
  (function processTl() {
    const root = $('.tl'); if (!root) return;
    const steps = $$('.tl__step', root), fill = $('.tl__fill', root), svg = $('.pv', root);
    const num = $('.tl__num', root), title = $('.tl__title', root), desc = $('.tl__desc', root), state = $('.tl__state', root), text = $('.tl__text', root);
    const gGrid = $('.pv__grid', svg), gLinks = $('.pv__links', svg), gNodes = $('.pv__nodes', svg), lens = $('.pv__lens', svg);
    for (let x = 0; x <= 400; x += 25) svgEl('line', { x1: x, y1: 0, x2: x, y2: 260 }, gGrid);
    for (let y = 0; y <= 260; y += 25) svgEl('line', { x1: 0, y1: y, x2: 400, y2: y }, gGrid);
    const R = rng(7);
    const grid = []; for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) grid.push([70 + c * 87, 85 + r * 90]);
    const scatter = grid.map(() => [40 + R() * 320, 30 + R() * 200]);
    const hot = [1, 4, 6];
    grid.forEach(([x, y], i) => {
      if (i % 4 < 3) { const l = svgEl('line', { x1: x, y1: y, x2: grid[i + 1][0], y2: grid[i + 1][1], class: i % 2 ? 'd' : '' }, gLinks); l.style.setProperty('--l', 90); }
      if (i < 4) { const l = svgEl('line', { x1: x, y1: y, x2: grid[i + 4][0], y2: grid[i + 4][1], class: 'd' }, gLinks); l.style.setProperty('--l', 90); }
    });
    const nodes = grid.map((p, i) => { const g = svgEl('g', { class: 'pv__node' }, gNodes); svgEl('rect', { x: -14, y: -14, width: 28, height: 28, rx: 3 }, g); return g; });
    let cur = 0, auto = true, timer = null, inView = false, lensI = 0, lensTimer = null;
    function render(i, animate) {
      cur = i; svg.dataset.stage = i;
      steps.forEach((s, k) => { s.setAttribute('aria-selected', k === i); s.tabIndex = k === i ? 0 : -1; s.classList.toggle('is-done', k < i); });
      $('#tl-panel').setAttribute('aria-labelledby', 'tl-' + i);
      fill.style.setProperty('--p', i / 3);
      nodes.forEach((g, k) => {
        const [x, y] = i === 0 ? scatter[k] : grid[k];
        g.style.transform = `translate(${x}px,${y}px)`;
        g.classList.toggle('hot', (i === 0 && hot.includes(k)) || i === 2);
        g.classList.toggle('ok', i === 3);
      });
      clearInterval(lensTimer);
      if (i === 0) { const moveLens = () => { const [x, y] = scatter[hot[lensI++ % hot.length]]; lens.style.transform = `translate(${x}px,${y}px)`; }; moveLens(); if (!RM) lensTimer = setInterval(moveLens, 1400); }
      const S = D().stages[i];
      const swap = () => { num.textContent = `0${i + 1} / 04`; title.textContent = S.t; desc.textContent = S.d; state.innerHTML = S.s; text.classList.remove('swap'); };
      if (animate && !RM) { text.classList.add('swap'); setTimeout(swap, 260); } else swap();
    }
    function go(i, user) { if (user) { auto = false; clearInterval(timer); } render((i + 4) % 4, true); }
    steps.forEach((s, i) => {
      s.addEventListener('click', () => go(i, true));
      s.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const n = (i + (e.key === 'ArrowRight' ? 1 : 3)) % 4; go(n, true); steps[n].focus(); } });
    });
    new IntersectionObserver(en => {
      inView = en[0].isIntersecting; clearInterval(timer);
      if (inView && auto && !RM) timer = setInterval(() => { if (!document.hidden) go(cur + 1, false); }, 5200);
    }, { threshold: 0.4 }).observe(root);
    langListeners.push(() => render(cur, false));
    render(0, false);
  })();

  /* ---------------------------------------------------------
     SCENARIOS (the interactive moment)
     --------------------------------------------------------- */
  (function scenarios() {
    const root = $('.sc'); if (!root) return;
    const tabs = $$('.sc__tab', root), list = $('.sc__nodes', root), track = $('.sc__track', root), pulse = $('.sc__pulse', root);
    const desc = $('.sc__desc', root), log = $('.sc__log ul', root), run = $('.sc__run', root), discuss = $('.sc__discuss', root);
    let cur = 0, timers = [], ran = false, inView = false, status = 'idle';
    const ts = () => { const d = new Date(); return [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => String(n).padStart(2, '0')).join(':'); };
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function setRunLabel() { $('span', run).textContent = D().ui[status === 'running' ? 'running' : status === 'done' ? 'again' : 'run']; run.disabled = status === 'running'; }
    function geometry() {
      const dots = $$('.sc__dot', list); if (dots.length < 2) return;
      const pr = $('.sc__pipe', root).getBoundingClientRect(); const a = dots[0].getBoundingClientRect(), b = dots[dots.length - 1].getBoundingClientRect();
      const top = a.top + a.height / 2 - pr.top, bot = b.top + b.height / 2 - pr.top;
      track.style.top = top + 'px'; track.style.bottom = 'auto'; track.style.height = (bot - top) + 'px';
      track.style.left = (a.left + a.width / 2 - pr.left) + 'px';
      track.style.setProperty('--th', (bot - top) + 'px');
    }
    function render(keepState) {
      const S = D().scen[cur];
      list.classList.remove('in');
      list.innerHTML = S.n.map(([n, tag], i) => `<li class="sc__node"><span class="sc__dot">0${i + 1}</span><span class="sc__box"><b>${n}</b><em>${tag}</em></span></li>`).join('');
      desc.textContent = S.d;
      requestAnimationFrame(() => { geometry(); list.classList.add('in'); });
      if (!keepState) { log.innerHTML = ''; setProg(0, 0); pulse.style.setProperty('--po', 0); status = 'idle'; }
      else if (status === 'done') { $$('.sc__node', list).forEach(n => n.classList.add('on')); }
      setRunLabel();
    }
    function setProg(p, dur) { track.style.setProperty('--dur', dur + 's'); track.style.setProperty('--prog', p); pulse.style.setProperty('--dur', dur + 's'); pulse.style.setProperty('--prog', p); }
    function addLog(html, cls) { const li = document.createElement('li'); if (cls) li.className = cls; li.innerHTML = html; log.appendChild(li); while (log.children.length > 7) log.removeChild(log.firstChild); }
    function start() {
      clear(); render(false); status = 'running'; setRunLabel();
      const S = D().scen[cur]; const nodes = () => $$('.sc__node', list); const STEP = RM ? 0 : 820;
      pulse.style.setProperty('--po', 1);
      S.n.forEach((n, i) => {
        timers.push(setTimeout(() => {
          nodes().forEach((el, k) => { el.classList.toggle('on', k <= i); el.classList.toggle('cur', k === i); });
          setProg(i / (S.n.length - 1), RM ? 0 : STEP / 1000);
          addLog(`<b>[${ts()}]</b> ${n[0]} · ${S.log[i]}`);
        }, 150 + i * STEP));
      });
      timers.push(setTimeout(() => {
        nodes().forEach(el => el.classList.remove('cur'));
        addLog(`<b>[${ts()}]</b> ✓ ${D().ui.complete}`, 'done');
        pulse.style.setProperty('--po', 0); status = 'done'; setRunLabel();
      }, 150 + S.n.length * STEP + 200));
    }
    function select(i, autoRun) {
      cur = i; clear();
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; });
      render(false);
      if (autoRun) start();
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i, true));
      t.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const n = (i + (e.key === 'ArrowRight' ? 1 : 3)) % 4; select(n, true); tabs[n].focus(); } });
    });
    run.addEventListener('click', start);
    discuss.addEventListener('click', e => {
      e.preventDefault();
      const sel = $('#form select[name="topic"]'); sel.value = D().scen[cur].topic;
      const f = sel.closest('.f'); f.classList.add('pre'); f.classList.remove('bad');
      $('.form__status').textContent = D().ui.preselected;
      $('#form').scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
      setTimeout(() => $('#form input[name="name"]').focus({ preventScroll: true }), RM ? 0 : 700);
    });
    new IntersectionObserver(en => { inView = en[0].isIntersecting; if (inView && !ran) { ran = true; setTimeout(start, 400); } }, { threshold: 0.35 }).observe(root);
    addEventListener('resize', () => geometry(), { passive: true });
    langListeners.push(() => {
      const wasRunning = status === 'running'; clear();
      if (wasRunning) status = 'done';
      render(true);
    });
    render(false);
  })();

  /* ---------------------------------------------------------
     STACK network
     --------------------------------------------------------- */
  (function stack() {
    const root = $('.stk'); if (!root) return;
    const grid = $('.stk__grid', root), svg = $('.stk__net', root), nameEl = $('.stk__n', root), descEl = $('.stk__d', root);
    let hubs = [], paths = [], current = null;
    const hintKey = descEl.dataset.i18n;
    function build() {
      const data = D().stack;
      grid.innerHTML = data.map((cat, ci) => `<div class="stk__cat" data-c="${ci}"><h3><span class="stk__hub"></span>${cat.c}</h3><div class="stk__chips">${cat.t.map(([n], ti) => `<button type="button" class="tech" data-c="${ci}" data-t="${ti}">${n}</button>`).join('')}</div></div>`).join('');
      $$('.tech', grid).forEach(b => {
        const on = () => focusTech(b);
        b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') on(); });
        b.addEventListener('focus', on);
        b.addEventListener('click', on);
      });
      grid.addEventListener('pointerleave', () => { if (current && !current.matches(':focus')) unfocus(); });
      requestAnimationFrame(lines);
    }
    function lines() {
      const rr = root.getBoundingClientRect(); svg.textContent = '';
      hubs = $$('.stk__hub', grid).map(h => { const r = h.getBoundingClientRect(); return [r.left + r.width / 2 - rr.left, r.top + r.height / 2 - rr.top]; });
      const cols = Math.max(1, Math.round(rr.width / ($('.stk__cat', grid).getBoundingClientRect().width || rr.width)));
      const pairs = [];
      hubs.forEach((_, i) => { if ((i + 1) % cols && i + 1 < hubs.length) pairs.push([i, i + 1]); if (i + cols < hubs.length) pairs.push([i, i + cols]); });
      paths = pairs.map(([a, b]) => {
        const [x1, y1] = hubs[a], [x2, y2] = hubs[b];
        const d = y1 === y2 ? `M${x1} ${y1} C${x1 + 40} ${y1 - 30} ${x2 - 40} ${y2 - 30} ${x2} ${y2}` : `M${x1} ${y1} C${x1 - 30} ${lerp(y1, y2, .4)} ${x2 - 30} ${lerp(y1, y2, .6)} ${x2} ${y2}`;
        const p = svgEl('path', { d, 'data-a': a, 'data-b': b }, svg);
        let len = 400; try { len = Math.ceil(p.getTotalLength()); } catch (e) {}
        p.style.setProperty('--len', len);
        return p;
      });
    }
    function focusTech(b) {
      current = b; const c = +b.dataset.c, t = +b.dataset.t; const [n, d] = D().stack[c].t[t];
      $$('.tech', grid).forEach(x => x.classList.toggle('is-on', x === b));
      $$('.stk__cat', grid).forEach(x => x.classList.toggle('is-hot', +x.dataset.c === c));
      paths.forEach(p => p.classList.toggle('is-hot', +p.dataset.a === c || +p.dataset.b === c));
      nameEl.textContent = n; descEl.textContent = d;
    }
    function unfocus() {
      current = null; $$('.tech.is-on,.stk__cat.is-hot', grid).forEach(x => x.classList.remove('is-on', 'is-hot'));
      paths.forEach(p => p.classList.remove('is-hot'));
      nameEl.textContent = '--'; descEl.innerHTML = LANG === 'en' ? enCache.get(descEl) : I18N.ru[hintKey];
    }
    let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(lines, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(lines);
    langListeners.push(() => { build(); unfocus(); });
    build();
  })();

  /* ---------------------------------------------------------
     FORM
     --------------------------------------------------------- */
  (function form() {
    const f = $('#form'); if (!f) return;
    const status = $('.form__status', f);
    const reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const reTg = /^(?:@|https?:\/\/t\.me\/|t\.me\/)?[A-Za-z][A-Za-z0-9_]{4,31}$/;
    const rules = {
      name: v => v.trim().length >= 2,
      contact: v => reEmail.test(v.trim()) || (/^@|t\.me\//.test(v.trim()) && reTg.test(v.trim())),
      topic: v => !!v,
      task: v => v.trim().length >= 8
    };
    function check(el) { const rule = rules[el.name]; if (!rule) return true; const ok = rule(el.value); el.closest('.f').classList.toggle('bad', !ok); el.setAttribute('aria-invalid', !ok); return ok; }
    Object.keys(rules).forEach(n => {
      const el = f.elements[n];
      el.addEventListener('blur', () => { if (el.value) check(el); });
      el.addEventListener('input', () => { if (el.closest('.f').classList.contains('bad')) check(el); });
      el.addEventListener('change', () => { el.closest('.f').classList.remove('pre'); });
    });
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const bad = Object.keys(rules).map(n => f.elements[n]).filter(el => !check(el));
      if (bad.length) { bad[0].focus(); return; }
      if (f.elements.website.value) { done(); return; }
      const payload = { name: f.elements.name.value.trim(), company: f.elements.company.value.trim(), contact: f.elements.contact.value.trim(), topic: f.elements.topic.value, task: f.elements.task.value.trim(), lang: LANG, page: location.href, sentAt: new Date().toISOString() };
      f.classList.add('is-sending'); status.textContent = D().ui.sending;
      try {
        const url = (CFG.form && CFG.form.endpoint) || '';
        if (url) {
          const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 12000);
          const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctrl.signal });
          clearTimeout(to); if (!res.ok) throw new Error('HTTP ' + res.status);
        } else {
          await new Promise(r => setTimeout(r, 700)); // demo mode: no endpoint configured yet
        }
        done();
      } catch (err) { status.textContent = D().ui.fail; }
      finally { f.classList.remove('is-sending'); }
    });
    function done() {
      f.classList.add('is-done'); status.textContent = '';
      const ok = $('.form__ok', f); ok.setAttribute('aria-hidden', 'false');
      const t = $('.form__okt', ok); t.tabIndex = -1; t.focus({ preventScroll: true });
    }
    $('.form__again', f).addEventListener('click', () => {
      f.reset(); f.classList.remove('is-done'); $('.form__ok', f).setAttribute('aria-hidden', 'true');
      $$('.f', f).forEach(x => x.classList.remove('bad', 'pre')); f.elements.name.focus();
    });
    // contacts from config
    const c = CFG.contacts || {}; const ul = $('#contacts'); const items = [];
    if (c.email) items.push(`<li>EMAIL: <a href="mailto:${encodeURI(c.email)}">${c.email}</a></li>`);
    if (c.telegram) items.push(`<li>TELEGRAM: <a href="https://t.me/${encodeURIComponent(c.telegram.replace(/^@/, ''))}" target="_blank" rel="noopener">@${c.telegram.replace(/^@/, '')}</a></li>`);
    if (c.phone) items.push(`<li>PHONE: <a href="tel:${c.phone.replace(/[^+\d]/g, '')}">${c.phone}</a></li>`);
    if (items.length) { ul.innerHTML = items.join(''); ul.hidden = false; }
  })();

  /* ---------------------------------------------------------
     GLOBAL: pause loops on hidden tabs, reduced motion live
     --------------------------------------------------------- */
  document.addEventListener('visibilitychange', () => document.body.classList.toggle('paused', document.hidden));
  RMQ.addEventListener('change', e => { RM = e.matches; net.sync(); if (RM) $$('.reveal').forEach(el => el.classList.add('in')); });

  /* initial language: ?lang=, then saved choice, else Russian */
  const qp = new URLSearchParams(location.search).get('lang');
  const initial = qp || store.get('aas-lang') || 'ru';
  applyLang(initial, !!qp);
  document.documentElement.classList.remove('i18n-pending');
})();
