/* Drain — how much of the day has gone, three ways */
(() => {
  const S = SH, { TAU, PI } = S;

  const bars = el => {
    el.classList.add('drain-face');
    const ui = S.mk('div', 'pad drain', el), head = S.mk('header', 'd-head', ui);
    S.mk('span', 'd-title', head, 'Slipping by'); const now = S.mk('span', 'd-now num', head);
    const grid = S.mk('div', 'd-grid', ui), cards = {};
    [['day', 'var(--mint)'], ['work', 'var(--ember)'], ['week', 'var(--paper)'], ['year', 'var(--lilac)']].forEach(([k, c]) => {
      const a = S.mk('article', 'd-card', grid); a.style.setProperty('--c', c);
      const kk = S.mk('div', 'd-k', a), v = S.mk('div', 'd-v num', a), pct = S.mk('span', null, v); S.mk('small', null, v, '% gone');
      const bar = S.mk('i', null, S.mk('div', 'd-bar', a)), left = S.mk('div', 'd-left num', a);
      cards[k] = { k: kk, pct, bar, left };
    });
    const fill = (c, frac, dec, left, label) => { frac = S.clamp(frac, 0, 1); S.set(c.pct, (frac * 100).toFixed(dec)); c.bar.style.transform = `scaleX(${frac})`; S.set(c.left, left); S.set(c.k, label); };
    return {
      draw(_, d) {
        const t = d.getTime(), y = d.getFullYear(), mo = d.getMonth(), da = d.getDate();
        const d0 = new Date(y, mo, da).getTime(), d1 = new Date(y, mo, da + 1).getTime();
        fill(cards.day, (t - d0) / (d1 - d0), 3, `${S.span(d1 - t)} left today`, 'Today');
        const W = S.workInfo(d), wl = `Workday ${S.fmtHour(S.prefs.ws)}–${S.fmtHour(S.prefs.we)}`;
        if (W.state === 'weekend') fill(cards.work, 0, 3, 'Weekend. Not your problem.', wl);
        else if (W.state === 'before') fill(cards.work, 0, 3, `Starts in ${S.span(W.ws - t)}`, wl);
        else if (W.state === 'after') fill(cards.work, 1, 3, 'Clocked off. Go rest.', wl);
        else fill(cards.work, W.frac, 3, `${S.span(W.we - t)} to go`, wl);
        const k0 = new Date(y, mo, da - W.dow).getTime(), k1 = new Date(y, mo, da - W.dow + 7).getTime();
        fill(cards.week, (t - k0) / (k1 - k0), 4, `${S.span(k1 - t)} until Monday`, 'This week');
        const y0 = new Date(y, 0, 1).getTime(), y1 = new Date(y + 1, 0, 1).getTime();
        fill(cards.year, (t - y0) / (y1 - y0), 5, `${S.span(y1 - t)} until ${y + 1}`, String(y));
        const tm = S.hm(d); S.set(now, `${tm.h}:${tm.m}:${tm.s}${tm.suf ? ' ' + tm.suf : ''}`);
      }
    };
  };

  /* Hourglass: the workday as sand */
  const prof = u => .07 + .93 * Math.pow(Math.sin((1 - u) * PI / 2), .6); // half-width at depth u (0 = wide end, 1 = neck)
  const N = 120, cum = new Float64Array(N + 1); // area from the neck outward
  for (let i = N - 1; i >= 0; i--) cum[i] = cum[i + 1] + prof((i + .5) / N) / N;
  const levelFor = frac => { const target = frac * cum[0]; for (let i = N; i >= 0; i--) if (cum[i] >= target) return i / N; return 0; };

  const hourglass = el => {
    el.classList.add('hg-face');
    const c = S.mk('canvas', null, el), tx = S.mk('div', 'hg-text', S.mk('div', 'pad hg-ui', el));
    const k = S.mk('div', 'hg-k', tx), big = S.mk('div', 'hg-big num', tx), sub = S.mk('div', 'hg-sub', tx), small = S.mk('div', 'hg-small num', tx);
    const grains = Array.from({ length: 26 }, (_, i) => ({ o: i / 26, j: Math.random() }));
    const SAND = '#e8b46a', SAND2 = '#c98f45';
    return {
      draw(now, d) {
        const { x, w, h } = S.fit(c), B = S.box(w, h), t = now / 1000;
        x.clearRect(0, 0, w, h);
        const W = S.workInfo(d);
        const frac = W.state === 'during' ? W.frac : W.state === 'after' ? 1 : 0;
        const H = B.ch * .86, bh = H * .46, BW = H * .26, cx = B.l + B.cw * .25, top = B.t + (B.ch - H) / 2, neck = top + H / 2;
        const glassPath = () => {
          x.beginPath();
          for (let i = 0; i <= 40; i++) { const u = i / 40; x.lineTo(cx - prof(u) * BW, top + (H / 2 - bh) + u * bh); }
          for (let i = 40; i >= 0; i--) { const u = i / 40; x.lineTo(cx - prof(u) * BW, neck + (1 - u) * bh); }
          for (let i = 0; i <= 40; i++) { const u = i / 40; x.lineTo(cx + prof(u) * BW, neck + (1 - u) * bh); }
          for (let i = 40; i >= 0; i--) { const u = i / 40; x.lineTo(cx + prof(u) * BW, top + (H / 2 - bh) + u * bh); }
          x.closePath();
        };
        const tTop = top + (H / 2 - bh);
        // top sand: remaining
        if (frac < 1) {
          const uL = levelFor(1 - frac);
          x.beginPath();
          for (let i = 0; i <= 30; i++) { const u = uL + (1 - uL) * i / 30; x.lineTo(cx - prof(u) * BW, tTop + u * bh); }
          for (let i = 30; i >= 0; i--) { const u = uL + (1 - uL) * i / 30; x.lineTo(cx + prof(u) * BW, tTop + u * bh); }
          x.closePath(); const g = x.createLinearGradient(cx - BW, 0, cx + BW, 0); g.addColorStop(0, SAND2); g.addColorStop(.45, SAND); g.addColorStop(1, SAND2); x.fillStyle = g; x.fill();
          if (W.state === 'during') { x.fillStyle = 'rgba(0,0,0,.18)'; x.beginPath(); x.ellipse(cx, tTop + uL * bh, prof(uL) * BW * .5, 3, 0, 0, TAU); x.fill(); }
        }
        // bottom sand: elapsed
        let pileTop = neck + bh;
        if (frac > 0) {
          // bottom bulb mirrors the top: at height y its depth is u = 1 - (y - neck) / bh
          const bBase = neck + bh, hFill = levelFor(1 - frac) * bh;
          x.beginPath();
          for (let i = 0; i <= 30; i++) { const yy = bBase - hFill * i / 30, u = 1 - (yy - neck) / bh; x.lineTo(cx - prof(u) * BW, yy); }
          const mound = Math.min(hFill * .5, bh * .12) * Math.min(1, frac * 6);
          x.lineTo(cx, bBase - hFill - mound);
          for (let i = 30; i >= 0; i--) { const yy = bBase - hFill * i / 30, u = 1 - (yy - neck) / bh; x.lineTo(cx + prof(u) * BW, yy); }
          x.closePath(); const g = x.createLinearGradient(cx - BW, 0, cx + BW, 0); g.addColorStop(0, SAND2); g.addColorStop(.5, SAND); g.addColorStop(1, SAND2); x.fillStyle = g; x.fill();
          pileTop = bBase - hFill - mound;
        }
        // falling stream
        if (W.state === 'during') {
          x.fillStyle = 'rgba(232,180,106,.55)'; x.fillRect(cx - .75, neck, 1.5, pileTop - neck);
          x.fillStyle = SAND;
          for (const gr of grains) { const k = (t * 1.6 + gr.o) % 1, yy = neck + k * (pileTop - neck); x.fillRect(cx - 1 + (gr.j - .5) * 2, yy, 2, 2); }
        }
        // glass
        glassPath(); x.fillStyle = 'rgba(255,255,255,.04)'; x.fill(); x.strokeStyle = 'rgba(255,245,230,.35)'; x.lineWidth = 1.5; x.stroke();
        x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 2; x.beginPath();
        for (let i = 2; i <= 22; i++) { const u = i / 40; x.lineTo(cx - prof(u) * BW * .8, tTop + u * bh); } x.stroke();
        // wooden frame
        const capW = BW * 2.5, capH = H * .045;
        const wood = (yy) => { const g = x.createLinearGradient(0, yy, 0, yy + capH); g.addColorStop(0, '#8a5d3b'); g.addColorStop(1, '#4e321f'); x.fillStyle = g; x.beginPath(); x.roundRect ? x.roundRect(cx - capW / 2, yy, capW, capH, 3) : x.rect(cx - capW / 2, yy, capW, capH); x.fill(); };
        wood(tTop - capH); wood(neck + bh);
        x.fillStyle = '#5b3b25'; x.fillRect(cx - capW / 2 + 4, tTop, 3, bh * 2); x.fillRect(cx + capW / 2 - 7, tTop, 3, bh * 2);
        // text
        const wl = `Workday ${S.fmtHour(S.prefs.ws)}–${S.fmtHour(S.prefs.we)}`, len = S.prefs.we - S.prefs.ws;
        S.set(k, wl);
        if (W.state === 'during') { S.set(big, S.span(W.we - W.t)); S.set(sub, `left of ${len} hours`); S.set(small, `${(W.frac * 100).toFixed(3)}% of the sand has fallen`); }
        else if (W.state === 'before') { S.set(big, S.span(W.ws - W.t)); S.set(sub, 'until the sand starts'); S.set(small, 'Full glass. Enjoy it.'); }
        else if (W.state === 'after') { S.set(big, 'Done.'); S.set(sub, 'The glass is empty. Go rest.'); S.set(small, `Flips again tomorrow at ${S.fmtHour(S.prefs.ws)}`); }
        else { S.set(big, 'Weekend.'); S.set(sub, 'The hourglass is on its side.'); S.set(small, `Back on ${S.fmtHour(S.prefs.ws)} Monday`); }
      }
    };
  };

  /* Countdown to the weekend, with confetti once it arrives */
  const weekend = el => {
    el.classList.add('wk-face');
    const c = S.mk('canvas', null, el), u = S.mk('div', 'pad wk-ui', el);
    const k = S.mk('div', 'wk-k', u), big = S.mk('div', 'wk-big num', u), rt = S.rollText(big), sub = S.mk('div', 'wk-sub', u), bar = S.mk('i', null, S.mk('div', 'wk-bar', u));
    const r = Math.random, motes = Array.from({ length: 40 }, () => ({ x: r(), y: r(), s: 1 + r() * 2, v: .005 + r() * .015, p: r() * TAU }));
    const COLS = ['#8ff0d6', '#ffd36b', '#ff7aa8', '#9db8ff', '#ffffff'];
    let conf = []; let last = 0;
    return {
      draw(now, d) {
        const { x, w, h } = S.fit(c), t = now / 1000, dt = last ? Math.min(.1, (now - last) / 1000) : 0; last = now;
        x.clearRect(0, 0, w, h);
        const y = d.getFullYear(), mo = d.getMonth(), da = d.getDate(), dow = (d.getDay() + 6) % 7, T = d.getTime();
        const fri = new Date(y, mo, da + (4 - dow), S.prefs.we).getTime(), mon = new Date(y, mo, da - dow, S.prefs.ws).getTime();
        const isWeekend = dow >= 5 || T >= fri;
        if (isWeekend) {
          const nextMon = new Date(y, mo, da - dow + 7, S.prefs.ws).getTime();
          S.set(k, "It's the weekend"); rt.set('Freedom'); S.set(sub, `Monday ${S.fmtHour(S.prefs.ws)} is ${S.span(nextMon - T, false)} away. Close this app.`);
          bar.style.transform = 'scaleX(1)';
          if (!S.RM && conf.length < 140) for (let i = 0; i < 3; i++) conf.push({ x: r() * w, y: -10, vx: (r() - .5) * 30, vy: 40 + r() * 60, a: r() * TAU, va: (r() - .5) * 8, c: COLS[Math.floor(r() * COLS.length)], s: 4 + r() * 5 });
        } else {
          const ms = fri - T, D = Math.floor(ms / 864e5), rest = ms % 864e5;
          const hh = S.pad2(Math.floor(rest / 36e5)), mm = S.pad2(Math.floor(rest % 36e5 / 6e4)), ss = S.pad2(Math.floor(rest % 6e4 / 1e3));
          S.set(k, 'Until the weekend'); rt.set((D ? D + 'd ' : '') + `${hh}:${mm}:${ss}`);
          S.set(sub, D === 0 ? (ms < 36e5 ? 'Nearly there. Hold on.' : 'Today is the day.') : `Friday at ${S.fmtHour(S.prefs.we)}`);
          bar.style.transform = `scaleX(${S.clamp((T - mon) / (fri - mon), 0, 1)})`;
        }
        for (const m of motes) { const yy = ((m.y - t * m.v) % 1 + 1) % 1; x.fillStyle = `rgba(160,255,230,${.15 + .15 * Math.sin(t + m.p)})`; x.beginPath(); x.arc(m.x * w + Math.sin(t * .4 + m.p) * 10, yy * h, m.s, 0, TAU); x.fill(); }
        conf = conf.filter(p => p.y < h + 20);
        for (const p of conf) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt;
          x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.scale(1, Math.cos(p.a * 1.7)); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore();
        }
      }
    };
  };

  S.theme('drain', 'Drain', [
    { id: 'bars', name: 'Slipping by', make: bars },
    { id: 'hourglass', name: 'Hourglass', make: hourglass },
    { id: 'weekend', name: 'Weekend countdown', make: weekend },
  ]);
})();
