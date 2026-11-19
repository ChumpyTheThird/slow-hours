/* Sky — the sun and moon cross a sky that follows the hour, over different landscapes */
(() => {
  const S = SH, { TAU, PI } = S;
  const NIGHT = [5, 6, 10];

  function ui(el) {
    const u = S.mk('div', 'pad sky-ui', el), tt = S.mk('div', 'sky-time num', u);
    const t = S.mk('span', null, tt), suf = S.mk('small', null, tt), sub = S.mk('div', 'sky-sub', u);
    const part = S.mk('em', null, sub), date = S.mk('span', null, sub);
    return d => { const tm = S.hm(d); S.set(t, tm.h + ':' + tm.m); S.set(suf, tm.suf.toLowerCase()); S.set(part, S.partOfDay(d.getHours())); S.set(date, S.shortDate(d)); };
  }
  /* Paints sky, stars and the sun or moon. Returns colours and the body's position. */
  function sky(x, w, h, B, d, now, st, horizon) {
    const hf = S.hoursF(d), [top, bot] = S.skyAt(hf), night = S.nightAmt(hf);
    const g = x.createLinearGradient(0, 0, 0, horizon); g.addColorStop(0, S.rgb(top)); g.addColorStop(1, S.rgb(bot));
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    if (night > 0) for (const s of st) { if (s.y * h > horizon - 6) continue; x.fillStyle = `rgba(255,255,255,${night * (.25 + .5 * (.5 + .5 * Math.sin(now / 1000 * s.sp + s.p)))})`; x.beginPath(); x.arc(s.x * w, s.y * h, s.r, 0, TAU); x.fill(); }
    const isSun = hf >= 5.8 && hf <= 18.2, tt = isSun ? (hf - 6) / 12 : (((hf - 18) + 24) % 24) / 12;
    const top0 = B.t + 20, bx = B.l + B.cw * (.04 + .92 * tt), by = horizon + 8 - Math.sin(PI * tt) * (horizon - top0);
    const alt = Math.sin(PI * tt);
    const core = isSun ? S.mix(S.hex('#ff9a5a'), S.hex('#fff4dc'), S.clamp(alt * 2.2, 0, 1)) : S.hex('#eeeadf');
    const gr = x.createRadialGradient(bx, by, 0, bx, by, isSun ? Math.min(w, h) * .55 : Math.min(w, h) * .25);
    gr.addColorStop(0, S.rgba(core, isSun ? .55 : .18)); gr.addColorStop(1, S.rgba(core, 0));
    x.fillStyle = gr; x.fillRect(0, 0, w, h);
    const br = isSun ? Math.max(12, h * .045) : Math.max(9, h * .03);
    x.fillStyle = S.rgb(core); x.beginPath(); x.arc(bx, by, br, 0, TAU); x.fill();
    return { hf, top, bot, night, isSun, bx, by, br, core };
  }

  const hills = el => {
    const c = S.mk('canvas', null, el), up = ui(el), st = S.stars(160, 23);
    const L = [{ y: .68, a: .05, f: [1.3, 2.9, 5.1], k: .5 }, { y: .79, a: .05, f: [.9, 2.2, 4.3], k: .7 }, { y: .9, a: .05, f: [1.7, 3.3, 6.2], k: .86 }];
    return {
      draw(now, d) {
        const { x, w, h } = S.fit(c), B = S.box(w, h), K = sky(x, w, h, B, d, now, st, h * .74);
        for (const l of L) {
          x.beginPath(); x.moveTo(0, h);
          for (let px = 0; px <= w + 8; px += 8) { const u = px / w; x.lineTo(px, h * l.y - h * l.a * (Math.sin(u * l.f[0] * PI + 1) + .5 * Math.sin(u * l.f[1] * PI + 2) + .25 * Math.sin(u * l.f[2] * PI + .5))); }
          x.lineTo(w, h); x.closePath(); x.fillStyle = S.rgb(S.mix(S.mix(K.bot, K.top, .3), NIGHT, l.k)); x.fill();
        }
        up(d);
      }
    };
  };

  const sea = el => {
    const c = S.mk('canvas', null, el), up = ui(el), st = S.stars(160, 31), r = S.rng(3);
    const waves = Array.from({ length: 60 }, () => ({ x: r(), y: r(), l: 6 + r() * 26, v: .004 + r() * .01 }));
    return {
      draw(now, d) {
        const { x, w, h } = S.fit(c), B = S.box(w, h), hz = Math.round(h * .62), t = now / 1000;
        const K = sky(x, w, h, B, d, now, st, hz);
        const g = x.createLinearGradient(0, hz, 0, h);
        g.addColorStop(0, S.rgb(S.mix(K.bot, [12, 24, 44], .5))); g.addColorStop(1, S.rgb(S.mix(K.top, [0, 0, 0], .72)));
        x.fillStyle = g; x.fillRect(0, hz, w, h - hz);
        if (K.by < hz + K.br) {
          const strength = K.isSun ? 1 : .55;
          for (let yy = hz + 2; yy < h; yy += 3) {
            const k = (yy - hz) / (h - hz), wd = (14 + k * 70) * (.55 + .45 * Math.sin(t * 2.6 + yy * .7));
            x.fillStyle = S.rgba(K.core, (.5 * (1 - k * .8) * strength).toFixed(3));
            x.fillRect(K.bx - wd / 2 + Math.sin(t * 1.7 + yy * .3) * 5, yy, wd, 1.6);
          }
        }
        x.fillStyle = 'rgba(255,255,255,.07)';
        for (const wv of waves) { const yy = hz + 4 + wv.y * (h - hz - 4), k = (yy - hz) / (h - hz), xx = ((wv.x + t * wv.v) % 1.2 - .1) * w; x.fillRect(xx, yy, wv.l * (.4 + k), 1); }
        x.fillStyle = S.rgba(K.bot, .5); x.fillRect(0, hz, w, 1);
        up(d);
      }
    };
  };

  const city = el => {
    const c = S.mk('canvas', null, el), up = ui(el), st = S.stars(140, 41);
    let geoKey = '', far = [], near = [], wins = [], tallest = null;
    function gen(w, h) {
      const r = S.rng(77); far = []; near = []; wins = [];
      for (let x0 = -10; x0 < w; ) { const bw = 18 + r() * 40, bh = h * (.18 + r() * .28); far.push([x0, bw, bh]); x0 += bw + 2; }
      tallest = null;
      for (let x0 = -6; x0 < w; ) {
        const bw = 22 + r() * 46, bh = h * (.12 + r() * .3); near.push([x0, bw, bh]);
        if (!tallest || bh > tallest[2]) tallest = [x0, bw, bh];
        const cols = Math.floor((bw - 8) / 7), rows = Math.floor((bh - 10) / 9);
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) wins.push({ x: x0 + 5 + i * 7, y: h - bh + 6 + j * 9, s: r(), o: r() * 100 });
        x0 += bw + 3 + r() * 6;
      }
    }
    return {
      draw(now, d) {
        const { x, w, h } = S.fit(c), B = S.box(w, h), t = now / 1000;
        if (geoKey !== w + 'x' + h) { geoKey = w + 'x' + h; gen(w, h); }
        const K = sky(x, w, h, B, d, now, st, h * .78);
        x.fillStyle = S.rgb(S.mix(K.bot, NIGHT, .5)); for (const [x0, bw, bh] of far) x.fillRect(x0, h - bh - h * .08, bw, bh + h * .08);
        x.fillStyle = S.rgb(S.mix(K.bot, NIGHT, .85)); for (const [x0, bw, bh] of near) x.fillRect(x0, h - bh, bw, bh);
        const prob = .12 + .6 * K.night;
        for (const wn of wins) {
          const flick = (Math.sin(wn.o + Math.floor(t / 9 + wn.s * 7) * 12.9898) * 43758.5453) % 1;
          const on = Math.abs(flick) < prob;
          if (!on) continue;
          x.fillStyle = K.night > .3 ? `rgba(255,214,140,${.55 + .35 * wn.s})` : 'rgba(200,225,255,.18)';
          x.fillRect(wn.x, wn.y, 3, 4);
        }
        if (tallest) { const ax = tallest[0] + tallest[1] / 2, ay = h - tallest[2]; x.fillStyle = S.rgb(S.mix(K.bot, NIGHT, .85)); x.fillRect(ax - .5, ay - 18, 1.5, 18); if (now % 1600 < 260) { x.fillStyle = '#ff3b3b'; x.beginPath(); x.arc(ax + .25, ay - 19, 2, 0, TAU); x.fill(); } }
        const ph = (t % 55) / 55;
        if (ph < .55) { const px = w * (ph / .55) * 1.1 - w * .05, py = h * .16 + Math.sin(ph * 5) * 4; x.fillStyle = (now % 900 < 120) ? '#ffffff' : 'rgba(255,90,90,.9)'; x.fillRect(px, py, 2, 2); x.fillStyle = 'rgba(255,255,255,.5)'; x.fillRect(px - 4, py + .5, 2, 1); }
        up(d);
      }
    };
  };

  const desert = el => {
    const c = S.mk('canvas', null, el), up = ui(el), st = S.stars(220, 53);
    let shoot = null;
    const L = [{ y: .7, a: .04, f: [.8, 1.9], k: .25 }, { y: .8, a: .05, f: [.6, 1.4], k: .45 }, { y: .92, a: .06, f: [.9, 2.3], k: .65 }];
    const SAND = S.hex('#d79a5c');
    return {
      draw(now, d) {
        const { x, w, h } = S.fit(c), B = S.box(w, h), t = now / 1000, K = sky(x, w, h, B, d, now, st, h * .74);
        if (K.night > .5) {
          if (!shoot && Math.random() < .004) shoot = { x: Math.random() * w * .8 + w * .1, y: Math.random() * h * .3 + 10, t: 0 };
          if (shoot) { shoot.t += .016; const k = shoot.t / .8, len = 60; x.strokeStyle = `rgba(255,255,255,${(1 - k) * .9})`; x.lineWidth = 1.5; x.beginPath(); x.moveTo(shoot.x + k * 140, shoot.y + k * 50); x.lineTo(shoot.x + k * 140 - len, shoot.y + k * 50 - len * .36); x.stroke(); if (k >= 1) shoot = null; }
        }
        let duneY = [];
        L.forEach((l, li) => {
          x.beginPath(); x.moveTo(0, h);
          for (let px = 0; px <= w + 8; px += 6) { const u = px / w, yy = h * l.y - h * l.a * (Math.sin(u * l.f[0] * PI * 2 + li * 2) + .6 * Math.sin(u * l.f[1] * PI * 2 + li)); x.lineTo(px, yy); if (li === 2) duneY.push([px, yy]); }
          x.lineTo(w, h); x.closePath();
          x.fillStyle = S.rgb(S.mix(S.mix(SAND, K.bot, .35 + li * .05), NIGHT, Math.min(.95, l.k * .6 + K.night * .55))); x.fill();
        });
        const cx = w * .8, base = (duneY.find(p => p[0] >= cx) || [0, h * .9])[1] + 4, ch = h * .22, cw = Math.max(6, h * .03);
        x.fillStyle = S.rgb(S.mix(K.bot, NIGHT, .92));
        const rr = (X, Y, W, H) => { x.beginPath(); x.roundRect ? x.roundRect(X, Y, W, H, W / 2) : x.rect(X, Y, W, H); x.fill(); };
        rr(cx - cw / 2, base - ch, cw, ch);
        rr(cx - cw * 2.1, base - ch * .7, cw * .8, ch * .35); rr(cx - cw * 2.1, base - ch * .42, cw * 1.8, cw * .8);
        rr(cx + cw * 1.3, base - ch * .85, cw * .8, ch * .4); rr(cx + cw * .4, base - ch * .5, cw * 1.7, cw * .8);
        up(d);
      }
    };
  };

  S.theme('sky', 'Sky', [
    { id: 'hills', name: 'Hills', make: hills },
    { id: 'sea', name: 'Sea', make: sea },
    { id: 'city', name: 'City', make: city },
    { id: 'desert', name: 'Desert', make: desert },
  ]);
})();
