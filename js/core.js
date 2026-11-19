/* Slow Hours — shared helpers and the theme registry */
window.SH = (() => {
  const TAU = Math.PI * 2, PI = Math.PI;
  const pad2 = n => String(n).padStart(2, '0');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const set = (el, v) => { if (el._v !== v) { el._v = v; el.textContent = v; } };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const prefs = { h24: false, awake: true, ws: 9, we: 17, shuffle: false };
  try { Object.assign(prefs, JSON.parse(localStorage.getItem('slowhours') || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem('slowhours', JSON.stringify(prefs)); } catch (e) {} };

  function hm(d) {
    const h = d.getHours();
    return { h: prefs.h24 ? pad2(h) : String(h % 12 || 12), m: pad2(d.getMinutes()), s: pad2(d.getSeconds()), suf: prefs.h24 ? '' : (h < 12 ? 'AM' : 'PM') };
  }
  const fmtHour = h => prefs.h24 ? pad2(h % 24) + ':00' : ((h % 12 || 12) + (h % 24 < 12 ? 'am' : 'pm'));

  const INS = { t: 0, r: 0, b: 0, l: 0 };
  function readInsets() {
    const p = document.getElementById('probe'); if (!p) return;
    const cs = getComputedStyle(p);
    INS.t = parseFloat(cs.paddingTop) || 0; INS.r = parseFloat(cs.paddingRight) || 0;
    INS.b = parseFloat(cs.paddingBottom) || 0; INS.l = parseFloat(cs.paddingLeft) || 0;
  }
  function fit(c, scale = 1) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2) * scale;
    const w = c.clientWidth || 1, h = c.clientHeight || 1;
    const W = Math.max(1, Math.round(w * dpr)), H = Math.max(1, Math.round(h * dpr));
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { x, w, h };
  }
  function box(w, h) {
    const l = Math.max(16, INS.l), r = Math.max(16, INS.r), t = Math.max(12, INS.t), b = Math.max(14, INS.b);
    return { l, r, t, b, cw: w - l - r, ch: h - t - b };
  }
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const rgb = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  function rng(seed) { let s = (seed >>> 0) % 2147483647 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function stars(n, seed) { const r = rng(seed); return Array.from({ length: n }, () => ({ x: r(), y: r(), r: r() * 1.1 + .25, p: r() * TAU, sp: .5 + r() * 1.5 })); }
  function starfield(x, w, h, st, now, a = 1) {
    for (const s of st) { x.fillStyle = `rgba(243,239,232,${a * (.12 + .35 * (.5 + .5 * Math.sin(now / 1000 * s.sp + s.p)))})`; x.fillRect(s.x * w, s.y * h, s.r, s.r); }
  }

  function moonPhase(d) { const syn = 29.530588853, ref = Date.UTC(2000, 0, 6, 18, 14); let p = ((d.getTime() - ref) / 864e5 / syn) % 1; return p < 0 ? p + 1 : p; }
  function moonName(p) { return p < .03 || p > .97 ? 'New moon' : p < .22 ? 'Waxing crescent' : p < .28 ? 'First quarter' : p < .47 ? 'Waxing gibbous' : p < .53 ? 'Full moon' : p < .72 ? 'Waning gibbous' : p < .78 ? 'Last quarter' : 'Waning crescent'; }
  function dayOfYear(d) { const s = new Date(d.getFullYear(), 0, 1); return Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - s) / 864e5) + 1; }
  const daysInYear = y => Math.round((new Date(y + 1, 0, 1) - new Date(y, 0, 1)) / 864e5);
  const longDate = d => d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const shortDate = d => d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const hoursF = d => d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  const fracs = d => { const sec = (d.getSeconds() + d.getMilliseconds() / 1000) / 60, min = (d.getMinutes() + sec) / 60, hr = ((d.getHours() % 12) + min) / 12; return { sec, min, hr }; };

  function mk(tag, cls, parent, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }

  /* Sky colours through the day: [hour, zenith, horizon] */
  const SKY = [[0, '#04060e', '#0b1024'], [4.5, '#070a18', '#151b38'], [5.5, '#1f2148', '#6d4a72'], [6.3, '#3d4f8a', '#f29a6b'], [7.5, '#5a8fd0', '#f3d2a4'], [10, '#3f86d8', '#a9d3f2'], [15, '#3a7fd2', '#b2d8f0'], [17.2, '#5874b8', '#f5b780'], [18.1, '#3a3672', '#e8785a'], [19, '#17183d', '#5a3558'], [20, '#080b1c', '#161a35'], [24, '#04060e', '#0b1024']].map(r => [r[0], hex(r[1]), hex(r[2])]);
  function skyAt(hf) {
    for (let i = 0; i < SKY.length - 1; i++) {
      const a = SKY[i], b = SKY[i + 1];
      if (hf >= a[0] && hf <= b[0]) { let k = (hf - a[0]) / (b[0] - a[0]); k = k * k * (3 - 2 * k); return [mix(a[1], b[1], k), mix(a[2], b[2], k)]; }
    }
    return [SKY[0][1], SKY[0][2]];
  }
  const nightAmt = hf => hf >= 20 || hf < 4.5 ? 1 : hf >= 18.5 ? (hf - 18.5) / 1.5 : hf < 6 ? (6 - hf) / 1.5 : 0;
  const partOfDay = h => h < 4 ? 'the small hours' : h < 6 ? 'before dawn' : h < 9 ? 'morning' : h < 12 ? 'late morning' : h < 13 ? 'midday' : h < 16 ? 'afternoon' : h < 18 ? 'late afternoon' : h < 20 ? 'evening' : h < 23 ? 'night' : 'nearly tomorrow';

  /* A character that rolls up, blurred, when it changes */
  function roller(parent, cls) {
    const el = mk('span', 'roll' + (cls ? ' ' + cls : ''), parent);
    let cur = null;
    return {
      el, set(v) {
        if (v === cur) return;
        const first = cur === null; cur = v;
        const old = el.querySelector('.r-cur');
        const n = mk('span', 'r-cur' + (first || RM ? '' : ' r-in')); n.textContent = v;
        if (old) { if (first || RM) old.remove(); else { old.className = 'r-out'; setTimeout(() => old.remove(), 700); } }
        el.appendChild(n);
      }
    };
  }
  function rollText(parent, cls) {
    const el = mk('span', 'rolltext' + (cls ? ' ' + cls : ''), parent), rs = [];
    return {
      el, set(str) {
        while (rs.length < str.length) rs.push(roller(el));
        while (rs.length > str.length) rs.pop().el.remove();
        for (let i = 0; i < str.length; i++) rs[i].set(str[i]);
      }
    };
  }
  function span(ms, secs = true) {
    ms = Math.max(0, ms);
    const s = Math.floor(ms / 1000), D = Math.floor(s / 86400), H = Math.floor(s % 86400 / 3600), M = Math.floor(s % 3600 / 60), Sx = s % 60;
    const tail = secs ? ` ${pad2(Sx)}s` : '';
    if (D) return `${D}d ${H}h ${pad2(M)}m` + tail;
    if (H) return `${H}h ${pad2(M)}m` + tail;
    return `${M}m` + (secs ? ` ${pad2(Sx)}s` : '');
  }
  function workInfo(d) {
    const t = d.getTime(), y = d.getFullYear(), mo = d.getMonth(), da = d.getDate(), dow = (d.getDay() + 6) % 7;
    const ws = new Date(y, mo, da, prefs.ws).getTime(), we = new Date(y, mo, da, prefs.we).getTime();
    const base = { t, ws, we, dow };
    if (dow >= 5) return { ...base, state: 'weekend', frac: 0 };
    if (t < ws) return { ...base, state: 'before', frac: 0 };
    if (t >= we) return { ...base, state: 'after', frac: 1 };
    return { ...base, state: 'during', frac: (t - ws) / (we - ws) };
  }

  const THEMES = [];
  const theme = (id, name, variants) => THEMES.push({ id, name, variants });

  return { TAU, PI, pad2, RM, set, clamp, prefs, save, hm, fmtHour, INS, readInsets, fit, box, hex, mix, rgb, rgba, rng, stars, starfield, moonPhase, moonName, dayOfYear, daysInYear, longDate, shortDate, hoursF, fracs, mk, skyAt, nightAmt, partOfDay, roller, rollText, span, workInfo, THEMES, theme };
})();
