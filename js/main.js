// Nou Cafè mar · comportamiento de la página
// - Estado "abierto ahora" con la hora real de Blanes (Europe/Madrid). Horario de Google: todos los días 8:30–23:30.
// - El día: en escritorio la sección se queda fija y el scroll recorre de 8:30 a 23:30 (desayunos, comidas, meriendas, cenas).
// - Menú móvil, cabecera, barra de acciones, entrada de la portada y toldo de la terraza.
(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const T = (m) => (window.I18N ? I18N.t(m) : m.es);

  // ---------- horario ----------
  const OPEN = 8.5, CLOSE = 23.5;                 // 8:30 a 23:30, todos los días
  const PARTS = [8.5, 12.5, 16.5, 20, 23.5];       // desayunos · comidas · meriendas · cenas (franjas de costumbre)
  function blanesNow() {
    try {
      const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      const h = +p.find((x) => x.type === 'hour').value % 24, m = +p.find((x) => x.type === 'minute').value;
      return { h, m, t: h + m / 60 };
    } catch (_) {
      const d = new Date(); return { h: d.getHours(), m: d.getMinutes(), t: d.getHours() + d.getMinutes() / 60 };
    }
  }
  const pad = (n) => String(n).padStart(2, '0');
  const TXT = {
    open: { es: 'Abierto ahora · hasta las 23:30', ca: 'Obert ara · fins a les 23:30', en: 'Open now · until 11:30 pm', fr: 'Ouvert maintenant · jusqu’à 23 h 30' },
    closed: { es: 'Cerrado ahora · abrimos a las 8:30', ca: 'Tancat ara · obrim a les 8:30', en: 'Closed now · opens at 8:30 am', fr: 'Fermé pour le moment · ouverture à 8 h 30' },
    // versión corta para la barra superior en pantallas estrechas
    openS: { es: 'Abierto · hasta las 23:30', ca: 'Obert · fins a les 23:30', en: 'Open · until 11:30 pm', fr: 'Ouvert · jusqu’à 23 h 30' },
    closedS: { es: 'Cerrado · abre a las 8:30', ca: 'Tancat · obre a les 8:30', en: 'Closed · opens 8:30 am', fr: 'Fermé · ouvre à 8 h 30' }
  };
  const narrow = matchMedia('(max-width: 560px)');
  function renderEstado() {
    const now = blanesNow();
    const open = now.t >= OPEN && now.t < CLOSE;
    $$('[data-estado]').forEach((el) => {
      const short = el.dataset.estado === 'short' && narrow.matches;
      el.textContent = T(open ? (short ? TXT.openS : TXT.open) : (short ? TXT.closedS : TXT.closed));
    });
    $$('[data-estado-wrap]').forEach((el) => { el.dataset.open = open ? '1' : '0'; });
    // momento del día que toca ahora (para la etiqueta "Ahora")
    let cur = -1;
    if (open) for (let i = 0; i < 4; i++) if (now.t >= PARTS[i] && now.t < PARTS[i + 1]) cur = i;
    $$('.moment').forEach((m, i) => { const b = $('.m-ara', m); if (b) b.hidden = i !== cur; });
    const ara = $('.dl-ara');
    if (ara) {
      ara.hidden = !open;
      if (open) {
        const pct = Math.min(95, Math.max(5, (now.t - OPEN) / (CLOSE - OPEN) * 100));
        ara.style.setProperty('--ara', pct.toFixed(2) + '%');
        const tm = $('[data-ara-hora]', ara);
        tm.textContent = now.h + ':' + pad(now.m);
        tm.setAttribute('datetime', pad(now.h) + ':' + pad(now.m));
      }
    }
    return cur;
  }
  let nowPart = renderEstado();
  setInterval(() => { nowPart = renderEstado(); }, 30000);
  narrow.addEventListener('change', () => { nowPart = renderEstado(); });
  document.addEventListener('langchange', () => { nowPart = renderEstado(); });

  // ---------- entrada de la portada (una sola vez) ----------
  const heroImg = $('.hero-foto img');
  let ready = false;
  const go = () => { if (ready) return; ready = true; requestAnimationFrame(() => root.classList.add('is-ready')); };
  if (reduce.matches) root.classList.add('is-ready');
  else if (heroImg && !heroImg.complete) { heroImg.addEventListener('load', go, { once: true }); heroImg.addEventListener('error', go, { once: true }); setTimeout(go, 1400); }
  else go();
  // si el navegador no pinta (pestaña oculta), que nada se quede escondido
  setTimeout(() => root.classList.add('is-ready'), 2600);

  // ---------- cabecera ----------
  const hdr = $('.hdr'), topbar = $('.topbar');
  const onHdr = () => hdr.classList.toggle('is-stuck', window.scrollY > (topbar ? topbar.offsetHeight : 0) + 4);

  // ---------- menú ----------
  const menuBtn = $('.menu-btn'), menu = $('#menu');
  let lastFocus = null;
  function setMenu(open) {
    if (!menu) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', T(open ? { es: 'Cerrar el menú', ca: 'Tanca el menú', en: 'Close the menu', fr: 'Fermer le menu' } : { es: 'Abrir el menú', ca: 'Obre el menú', en: 'Open the menu', fr: 'Ouvrir le menu' }));
    root.classList.toggle('menu-open', open);
    if (open) {
      lastFocus = document.activeElement;
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
      const first = $('a', menu); if (first) first.focus({ preventScroll: true });
    } else {
      menu.classList.remove('is-open');
      setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, reduce.matches ? 0 : 280);
      if (lastFocus && menu.contains(document.activeElement)) lastFocus.focus({ preventScroll: true });
    }
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') { setMenu(false); menuBtn.focus(); }
      // el foco no sale del menú abierto
      if (e.key === 'Tab' && menuBtn.getAttribute('aria-expanded') === 'true') {
        const items = [menuBtn, ...$$('a, button', menu)].filter((x) => x.offsetParent !== null);
        const i = items.indexOf(document.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      }
    });
    matchMedia('(min-width: 1101px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
    document.addEventListener('langchange', () => {
      const open = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-label', T(open ? { es: 'Cerrar el menú', ca: 'Tanca el menú', en: 'Close the menu', fr: 'Fermer le menu' } : { es: 'Abrir el menú', ca: 'Obre el menú', en: 'Open the menu', fr: 'Ouvrir le menu' }));
    });
  }

  // ---------- el día ----------
  const track = $('[data-dia]');
  const moments = $$('.moment', track || document);
  const goBtns = $$('[data-go]', track || document);
  const desk = matchMedia('(min-width: 1024px) and (min-height: 660px)');
  const STOPS = PARTS.map((t) => (t - OPEN) / (CLOSE - OPEN)); // 0 · .2667 · .5333 · .7667 · 1
  let active = 0;
  function setActive(i) {
    if (i === active) return;
    const prev = moments[active];
    moments.forEach((m) => m.classList.remove('was-on'));
    if (prev) { prev.classList.remove('is-on'); prev.classList.add('was-on'); }
    moments[i].classList.add('is-on');
    active = i;
    goBtns.forEach((b, k) => { if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    clearTimeout(setActive.t);
    setActive.t = setTimeout(() => moments.forEach((m) => m.classList.remove('was-on')), 1000);
  }
  function trackMetrics() {
    const r = track.getBoundingClientRect();
    const stage = $('.dia-stage', track);
    const total = Math.max(1, track.offsetHeight - stage.offsetHeight);
    return { top: r.top + window.scrollY, total, p: Math.min(1, Math.max(0, -r.top / total)) };
  }
  function onDia() {
    if (!track) return;
    if (!desk.matches) { track.style.removeProperty('--p'); return; }
    const { p } = trackMetrics();
    track.style.setProperty('--p', p.toFixed(4));
    let i = 0; for (let k = 1; k < 4; k++) if (p >= STOPS[k] - 0.0001) i = k;
    setActive(i);
  }
  goBtns.forEach((b) => b.addEventListener('click', () => {
    const i = +b.dataset.go;
    if (!desk.matches) { moments[i].scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' }); return; }
    const { top, total } = trackMetrics();
    const mid = (STOPS[i] + STOPS[i + 1]) / 2;
    window.scrollTo({ top: Math.round(top + mid * total), behavior: reduce.matches ? 'auto' : 'smooth' });
  }));
  desk.addEventListener('change', () => { moments.forEach((m, k) => { m.classList.toggle('is-on', k === active); m.classList.remove('was-on'); }); onDia(); });

  // ---------- toldo de la terraza (se despliega una vez al llegar) ----------
  const toldo = $('[data-toldo]');
  function onToldo() {
    if (!toldo || toldo.classList.contains('is-in')) return;
    const r = toldo.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.82 && r.bottom > 0) toldo.classList.add('is-in');
  }

  // ---------- secciones en el menú y barra de acciones ----------
  const navLinks = $$('.hdr-nav a[href^="#"]');
  const sections = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const bar = $('.actionbar'), heroCta = $('.hero-cta'), visita = $('#visita');
  function onNav() {
    const y = window.innerHeight * 0.35;
    let cur = null;
    sections.forEach((s) => { const r = s.getBoundingClientRect(); if (r.top <= y && r.bottom > y) cur = s.id; });
    navLinks.forEach((a) => { if (a.getAttribute('href') === '#' + cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    if (bar && heroCta) {
      const past = heroCta.getBoundingClientRect().bottom < 0;
      const vr = visita ? visita.getBoundingClientRect() : null;
      const inVisit = vr ? (vr.top < window.innerHeight && vr.bottom > 0) : false;
      bar.classList.toggle('is-on', past && !inVisit);
    }
  }

  // ---------- un solo bucle de scroll ----------
  let ticking = false;
  function update() { ticking = false; onHdr(); onDia(); onToldo(); onNav(); }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', update);
  update();

  // ---------- año del pie ----------
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

  // para pruebas: estado actual
  window.NOUCAFE = { update, setActive: (i) => { setActive(i); }, get active() { return active; }, nowPart: () => nowPart };
})();
