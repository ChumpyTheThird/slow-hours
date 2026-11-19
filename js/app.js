/* Slow Hours — pager: swipe sideways for themes, up/down for variations */
(() => {
  const S = SH, $ = s => document.querySelector(s), T = S.THEMES;
  const stage = $('#stage'), track = $('#track');

  T.forEach(th => {
    th.col = S.mk('div', 'col', track);
    th.vt = S.mk('div', 'vtrack', th.col);
    th.variants.forEach(v => { v.el = S.mk('section', 'face', th.vt); v.el.dataset.id = th.id + '-' + v.id; });
    th.vi = 0;
  });
  function inst(v) {
    if (!v.inst) { v.inst = v.make(v.el) || {}; v.inst.resize && v.inst.resize(stage.clientWidth, stage.clientHeight); }
    return v.inst;
  }

  let ti = 0;
  try {
    const pos = JSON.parse(localStorage.getItem('slowhours-pos') || 'null');
    if (pos) { ti = S.clamp(pos.ti | 0, 0, T.length - 1); (pos.vi || []).forEach((v, i) => { if (T[i]) T[i].vi = S.clamp(v | 0, 0, T[i].variants.length - 1); }); }
  } catch (e) {}
  function fromHash() {
    const h = location.hash.slice(1); if (!h) return false;
    for (let i = 0; i < T.length; i++) {
      if (T[i].id === h) { ti = i; return true; }
      const j = T[i].variants.findIndex(v => T[i].id + '-' + v.id === h);
      if (j >= 0) { ti = i; T[i].vi = j; return true; }
    }
    return false;
  }
  fromHash();

  const EASE = 'transform .6s cubic-bezier(.2,.8,.2,1)';
  const placeX = (dx = 0, anim) => { track.style.transition = anim && !S.RM ? EASE : 'none'; track.style.transform = `translate3d(calc(${-ti * 100}% + ${dx}px),0,0)`; };
  const placeY = (th, dy = 0, anim) => { th.vt.style.transition = anim && !S.RM ? EASE : 'none'; th.vt.style.transform = `translate3d(0,calc(${-th.vi * 100}% + ${dy}px),0)`; };
  const current = () => T[ti].variants[T[ti].vi];

  /* chrome: dots, label, hint */
  const hd = $('#hdots'), vd = $('#vdots'), label = $('#label');
  T.forEach(() => S.mk('i', null, hd));
  function renderDots() {
    [...hd.children].forEach((d, j) => d.classList.toggle('on', j === ti));
    const n = T[ti].variants.length;
    while (vd.children.length < n) S.mk('i', null, vd);
    while (vd.children.length > n) vd.lastChild.remove();
    [...vd.children].forEach((d, j) => d.classList.toggle('on', j === T[ti].vi));
  }
  let chromeT = 0;
  function wakeChrome() { document.body.classList.remove('quiet'); clearTimeout(chromeT); chromeT = setTimeout(() => document.body.classList.add('quiet'), 3500); }
  let labelT = 0;
  function showLabel(txt) { label.textContent = txt; label.classList.add('show'); clearTimeout(labelT); labelT = setTimeout(() => label.classList.remove('show'), 1800); }

  let animUntil = 0, lastFace = null;
  function changed() {
    const th = T[ti], v = current();
    animUntil = performance.now() + 700;
    if (v !== lastFace) { const i = inst(v); i.onShow && i.onShow(); lastFace = v; showLabel(`${th.name} · ${v.name}`); }
    renderDots(); wakeChrome();
    $('#bar-name').innerHTML = `<b>${th.name}</b> · ${v.name}`;
    try { localStorage.setItem('slowhours-pos', JSON.stringify({ ti, vi: T.map(t => t.vi) })); history.replaceState(null, '', '#' + th.id + '-' + v.id); } catch (e) {}
  }
  function goX(i, anim = true) { ti = S.clamp(i, 0, T.length - 1); placeX(0, anim); changed(); }
  function goY(j, anim = true) { const th = T[ti]; th.vi = S.clamp(j, 0, th.variants.length - 1); placeY(th, 0, anim); changed(); }

  /* gestures */
  let drag = null;
  stage.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, t: performance.now(), dx: 0, dy: 0, axis: null }; try { stage.setPointerCapture(e.pointerId); } catch (_) {} wakeChrome(); });
  stage.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.axis && Math.hypot(dx, dy) > 10) drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (drag.axis === 'x') { let v = dx; if ((ti === 0 && v > 0) || (ti === T.length - 1 && v < 0)) v *= .3; drag.dx = v; placeX(v); }
    else if (drag.axis === 'y') { const th = T[ti]; let v = dy; if ((th.vi === 0 && v > 0) || (th.vi === th.variants.length - 1 && v < 0)) v *= .3; drag.dy = v; placeY(th, v); }
  });
  const end = () => {
    if (!drag) return;
    const D = drag; drag = null;
    const dt = Math.max(1, performance.now() - D.t);
    if (D.axis === 'x') { const W = stage.clientWidth, v = D.dx / dt; if (D.dx < -W * .18 || v < -.45) goX(ti + 1); else if (D.dx > W * .18 || v > .45) goX(ti - 1); else goX(ti); }
    else if (D.axis === 'y') { const H = stage.clientHeight, v = D.dy / dt, th = T[ti]; if (D.dy < -H * .18 || v < -.45) goY(th.vi + 1); else if (D.dy > H * .18 || v > .45) goY(th.vi - 1); else goY(th.vi); }
    else if (dt < 400) toggleBar();
  };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
  addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('#bar')) return;
    const k = e.key;
    if (k === 'ArrowRight') goX(ti + 1); else if (k === 'ArrowLeft') goX(ti - 1);
    else if (k === 'ArrowDown') goY(T[ti].vi + 1); else if (k === 'ArrowUp') goY(T[ti].vi - 1);
    else if (k === ' ' || k === 'Enter') toggleBar(); else return;
    e.preventDefault();
  });
  addEventListener('hashchange', () => { const oti = ti, ovi = T.map(t => t.vi); if (fromHash()) { T.forEach((th, i) => { if (th.vi !== ovi[i]) placeY(th, 0, true); }); if (ti !== oti) placeX(0, true); changed(); } });

  /* settings bar */
  const bar = $('#bar'); let barT = 0;
  function toggleBar(force) {
    const show = force ?? !bar.classList.contains('show');
    bar.classList.toggle('show', show); clearTimeout(barT);
    if (show) barT = setTimeout(() => bar.classList.remove('show'), 9000);
    $('#hint').classList.add('gone'); wake();
  }
  bar.addEventListener('pointerdown', () => { clearTimeout(barT); barT = setTimeout(() => bar.classList.remove('show'), 9000); });
  const ws = $('#b-ws'), we = $('#b-we');
  function fillSelects() {
    [ws, we].forEach((s, j) => {
      s.innerHTML = '';
      for (let h = j ? 1 : 0; h <= (j ? 24 : 23); h++) { const o = document.createElement('option'); o.value = h; o.textContent = S.fmtHour(h); s.appendChild(o); }
    });
    ws.value = S.prefs.ws; we.value = S.prefs.we;
  }
  ws.addEventListener('change', () => { S.prefs.ws = +ws.value; if (S.prefs.we <= S.prefs.ws) { S.prefs.we = Math.min(24, S.prefs.ws + 1); we.value = S.prefs.we; } S.save(); });
  we.addEventListener('change', () => { S.prefs.we = +we.value; if (S.prefs.we <= S.prefs.ws) { S.prefs.ws = Math.max(0, S.prefs.we - 1); ws.value = S.prefs.ws; } S.save(); });
  $('#b-24').addEventListener('click', () => { S.prefs.h24 = !S.prefs.h24; S.save(); syncBar(); fillSelects(); });
  $('#b-shuffle').addEventListener('click', () => { S.prefs.shuffle = !S.prefs.shuffle; S.save(); lastShuffle = Date.now(); syncBar(); });
  $('#b-awake').addEventListener('click', async () => { S.prefs.awake = !S.prefs.awake; S.save(); if (S.prefs.awake) await wake(); else if (lock) { try { await lock.release(); } catch (e) {} lock = null; } syncBar(); });
  $('#b-hide').addEventListener('click', () => toggleBar(false));
  function syncBar() {
    $('#b-24').setAttribute('aria-pressed', S.prefs.h24);
    $('#b-shuffle').setAttribute('aria-pressed', S.prefs.shuffle);
    const a = $('#b-awake'); a.setAttribute('aria-pressed', S.prefs.awake);
    a.textContent = !('wakeLock' in navigator) ? 'Keep screen on (not supported)' : S.prefs.awake ? (lock ? 'Screen stays on' : 'Keep screen on') : 'Screen may sleep';
  }

  /* shuffle: a different clock every five minutes */
  let lastShuffle = Date.now();
  setInterval(() => {
    if (!S.prefs.shuffle || drag || bar.classList.contains('show') || Date.now() - lastShuffle < 5 * 60e3) return;
    lastShuffle = Date.now();
    const all = []; T.forEach((th, i) => th.variants.forEach((v, j) => all.push([i, j])));
    let pick; do { pick = all[Math.floor(Math.random() * all.length)]; } while (pick[0] === ti && pick[1] === T[ti].vi && all.length > 1);
    T[pick[0]].vi = pick[1]; placeY(T[pick[0]], 0, false); goX(pick[0]);
  }, 5000);

  /* wake lock */
  let lock = null;
  async function wake() {
    if (!S.prefs.awake || !('wakeLock' in navigator) || document.visibilityState !== 'visible' || lock) return syncBar();
    try { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; syncBar(); }); } catch (e) { lock = null; }
    syncBar();
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') wake(); });

  /* loop */
  function onResize() {
    S.readInsets();
    T.forEach(th => th.variants.forEach(v => { if (v.inst && v.inst.resize) v.inst.resize(stage.clientWidth, stage.clientHeight); }));
  }
  addEventListener('resize', onResize);
  addEventListener('orientationchange', () => setTimeout(onResize, 250));
  function frame(now) {
    const d = new Date(), th = T[ti], list = [current()];
    if (drag || now < animUntil) {
      if (ti > 0) list.push(T[ti - 1].variants[T[ti - 1].vi]);
      if (ti < T.length - 1) list.push(T[ti + 1].variants[T[ti + 1].vi]);
      if (th.vi > 0) list.push(th.variants[th.vi - 1]);
      if (th.vi < th.variants.length - 1) list.push(th.variants[th.vi + 1]);
    }
    for (const v of list) { try { const i = inst(v); i.draw && i.draw(now, d); } catch (err) { console.error(v.el.dataset.id, err); } }
    requestAnimationFrame(frame);
  }
  S.readInsets(); fillSelects(); syncBar();
  T.forEach(t => placeY(t, 0, false)); placeX(0, false); changed(); wake();
  setTimeout(() => $('#hint').classList.add('gone'), 5000);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
  requestAnimationFrame(frame);
})();
