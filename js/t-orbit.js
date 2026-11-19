/* Orbit — time as things going round */
(() => {
  const S = SH, { TAU, PI } = S;
  const MINT = [127, 224, 200], PAPER = [243, 239, 232], PEACH = [255, 179, 138], SKYB = [150, 190, 255];

  function readout(el) {
    const r = S.mk('div', 'o-read', S.mk('div', 'pad orbit-ui', el));
    const row = (k, c) => { const e = S.mk('div', 'o-row', r); e.style.setProperty('--c', c); S.mk('span', 'o-k', e, k); return S.mk('span', 'o-v num', e); };
    const H = row('Hours', 'var(--peach)'), M = row('Minutes', 'var(--paper)'), Sx = row('Seconds', 'var(--mint)'), D = S.mk('div', 'o-date', r);
    return d => { const tm = S.hm(d); S.set(H, tm.h); S.set(M, tm.m); S.set(Sx, tm.s); S.set(D, `Day ${S.dayOfYear(d)} of ${S.daysInYear(d.getFullYear())}${tm.suf ? ' · ' + tm.suf : ''}`); };
  }
  function geo(w, h) {
    const B = S.box(w, h), portrait = h > w;
    const cx = portrait ? w / 2 : B.l + B.cw * .33, cy = B.t + B.ch / 2;
    return { cx, cy, R: Math.max(20, Math.min(portrait ? B.cw / 2 - 16 : B.cw * .29, B.ch / 2 - 14)) };
  }

  const rings = el => {
    el.style.background = '#07090c';
    const c = S.mk('canvas', null, el), ro = readout(el), st = S.stars(140, 11);
    return {
      draw(now, d) {
        const { x, w, h } = S.fit(c), { cx, cy, R } = geo(w, h), f = S.fracs(d);
        x.fillStyle = '#07090c'; x.fillRect(0, 0, w, h); S.starfield(x, w, h, st, now);
        for (const g of [{ r: R, f: f.sec, n: 60, c: MINT, lw: 2 }, { r: R * .76, f: f.min, n: 60, c: PAPER, lw: 3 }, { r: R * .52, f: f.hr, n: 12, c: PEACH, lw: 4 }]) {
          x.lineWidth = 1; x.strokeStyle = 'rgba(243,239,232,.07)'; x.beginPath(); x.arc(cx, cy, g.r, 0, TAU); x.stroke();
          for (let i = 0; i < g.n; i++) { const a = i / g.n * TAU - PI / 2, big = g.n === 12 || i % 5 === 0; x.fillStyle = big ? 'rgba(243,239,232,.32)' : 'rgba(243,239,232,.12)'; x.beginPath(); x.arc(cx + Math.cos(a) * (g.r + 8), cy + Math.sin(a) * (g.r + 8), big ? 1.3 : .7, 0, TAU); x.fill(); }
          const a0 = -PI / 2, a1 = a0 + g.f * TAU;
          let stroke = S.rgba(g.c, .9);
          if (x.createConicGradient) { const cg = x.createConicGradient(a0, cx, cy); cg.addColorStop(0, S.rgba(g.c, 0)); cg.addColorStop(Math.max(.001, g.f), S.rgba(g.c, .95)); cg.addColorStop(1, S.rgba(g.c, .95)); stroke = cg; }
          x.strokeStyle = stroke; x.lineWidth = g.lw; x.lineCap = 'round'; x.shadowColor = S.rgba(g.c, .7); x.shadowBlur = 14;
          x.beginPath(); x.arc(cx, cy, g.r, a0, a1); x.stroke();
          x.shadowBlur = 22; x.fillStyle = S.rgb(g.c); x.beginPath(); x.arc(cx + Math.cos(a1) * g.r, cy + Math.sin(a1) * g.r, g.lw + 2.5, 0, TAU); x.fill();
          x.shadowBlur = 0;
        }
        x.fillStyle = 'rgba(243,239,232,.55)'; x.font = `400 ${Math.max(10, R * .09)}px "DM Mono", monospace`; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText(d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(), cx, cy);
        ro(d);
      }
    };
  };

  const solar = el => {
    el.style.background = '#05070b';
    const c = S.mk('canvas', null, el), ro = readout(el), st = S.stars(180, 5);
    return {
      draw(now, d) {
        const { x, w, h } = S.fit(c), { cx, cy, R } = geo(w, h), f = S.fracs(d), t = now / 1000;
        x.fillStyle = '#05070b'; x.fillRect(0, 0, w, h); S.starfield(x, w, h, st, now);
        let g = x.createRadialGradient(cx, cy, 0, cx, cy, R * .6);
        g.addColorStop(0, 'rgba(255,200,110,.45)'); g.addColorStop(1, 'rgba(255,160,60,0)');
        x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R * .6, 0, TAU); x.fill();
        const sr = R * .12 * (1 + .04 * Math.sin(t * 2));
        g = x.createRadialGradient(cx - sr * .3, cy - sr * .3, 0, cx, cy, sr); g.addColorStop(0, '#fff6d8'); g.addColorStop(1, '#ffb347');
        x.fillStyle = g; x.beginPath(); x.arc(cx, cy, sr, 0, TAU); x.fill();
        const P = [{ r: R * .34, f: f.sec, s: R * .035, c: MINT }, { r: R * .62, f: f.min, s: R * .055, c: SKYB, moon: 1 }, { r: R * .92, f: f.hr, s: R * .075, c: PEACH, ring: 1 }];
        for (const p of P) {
          x.strokeStyle = 'rgba(243,239,232,.08)'; x.lineWidth = 1; x.beginPath(); x.arc(cx, cy, p.r, 0, TAU); x.stroke();
          const a = p.f * TAU - PI / 2, tl = 1.4;
          if (x.createConicGradient) {
            const cg = x.createConicGradient(a - tl, cx, cy); cg.addColorStop(0, S.rgba(p.c, 0)); cg.addColorStop(tl / TAU, S.rgba(p.c, .55)); cg.addColorStop(tl / TAU + .001, S.rgba(p.c, 0)); cg.addColorStop(1, S.rgba(p.c, 0));
            x.strokeStyle = cg; x.lineWidth = p.s * .7; x.lineCap = 'butt'; x.beginPath(); x.arc(cx, cy, p.r, a - tl, a); x.stroke();
          }
          const px = cx + Math.cos(a) * p.r, py = cy + Math.sin(a) * p.r;
          if (p.ring) { x.strokeStyle = S.rgba(p.c, .6); x.lineWidth = 1.5; x.beginPath(); x.ellipse(px, py, p.s * 2.1, p.s * .6, -.4, 0, TAU); x.stroke(); }
          const lx = px - Math.cos(a) * p.s * .5, ly = py - Math.sin(a) * p.s * .5;
          g = x.createRadialGradient(lx, ly, p.s * .1, px, py, p.s);
          g.addColorStop(0, S.rgb(S.mix(p.c, [255, 255, 255], .55))); g.addColorStop(.6, S.rgb(p.c)); g.addColorStop(1, S.rgb(S.mix(p.c, [0, 0, 0], .65)));
          x.fillStyle = g; x.beginPath(); x.arc(px, py, p.s, 0, TAU); x.fill();
          if (p.moon) { const ma = t * 1.3; x.fillStyle = '#d8d4cc'; x.beginPath(); x.arc(px + Math.cos(ma) * p.s * 2.3, py + Math.sin(ma) * p.s * 2.3, Math.max(1.5, p.s * .3), 0, TAU); x.fill(); }
        }
        ro(d);
      }
    };
  };

  const galaxy = el => {
    el.style.background = '#04040a';
    const c = S.mk('canvas', null, el), ui = S.mk('div', 'pad gal-ui', el);
    const time = S.mk('div', 'g-time num', ui), rt = S.rollText(time), date = S.mk('div', 'g-date', ui);
    const r = S.rng(99), st = S.stars(120, 8);
    const pts = Array.from({ length: 1000 }, () => {
      const rr = Math.pow(r(), .75), arm = (r() < .5 ? 0 : PI) + (r() - .5) * (1 - rr * .5);
      return { rr, arm, j: (r() - .5) * .12, s: r() * 1.4 + .5, c: S.mix([255, 232, 205], r() < .55 ? [120, 160, 255] : [255, 120, 210], Math.min(1, rr * 1.4)), p: r() * TAU };
    });
    return {
      draw(now, d) {
        const { x, w, h } = S.fit(c), t = now / 1000 * (S.RM ? .2 : 1);
        x.fillStyle = '#04040a'; x.fillRect(0, 0, w, h); S.starfield(x, w, h, st, now, .8);
        const cx = w / 2, cy = h / 2, R = Math.max(w, h) * .45, tilt = .42, rot = t * .05, ca = Math.cos(-.35), sa = Math.sin(-.35);
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, R * .4); g.addColorStop(0, 'rgba(255,225,200,.35)'); g.addColorStop(1, 'rgba(255,200,180,0)');
        x.fillStyle = g; x.fillRect(0, 0, w, h);
        x.globalCompositeOperation = 'lighter';
        for (const p of pts) {
          const ang = p.arm + p.rr * 5.2 + rot + p.j * Math.sin(t * .5 + p.p), rad = p.rr * R;
          const ex = Math.cos(ang) * rad, ey = Math.sin(ang) * rad * tilt;
          x.fillStyle = S.rgba(p.c, (.35 + .25 * Math.sin(t * 2 + p.p)).toFixed(2));
          x.fillRect(cx + ex * ca - ey * sa, cy + ex * sa + ey * ca, p.s, p.s);
        }
        x.globalCompositeOperation = 'source-over';
        const tm = S.hm(d); rt.set(tm.h + ':' + tm.m);
        S.set(date, (tm.suf ? tm.suf + ' · ' : '') + S.longDate(d));
      }
    };
  };

  S.theme('orbit', 'Orbit', [
    { id: 'rings', name: 'Rings', make: rings },
    { id: 'solar', name: 'Solar system', make: solar },
    { id: 'galaxy', name: 'Galaxy', make: galaxy },
  ]);
})();
