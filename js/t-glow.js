/* Glow — hardware displays: nixie tubes, a hi-fi VFD, a split-flap clock */
(() => {
  const S = SH;
  const timeStr = d => { const tm = S.hm(d); return (tm.h.length < 2 ? ' ' + tm.h : tm.h) + tm.m + tm.s; };

  const nixie = el => {
    el.classList.add('nixie-face');
    const nx = S.mk('div', 'pad nx', el), wrap = S.mk('div', 'tubes', nx), foot = S.mk('div', 'nx-foot', nx);
    const tubes = [], colons = []; let cs = 0;
    for (const k of 'ddcddcdd') {
      const cell = S.mk('div', 'cell', wrap), t = S.mk('div', 'tube' + (k === 'c' ? ' narrow' : ''), cell);
      if (k === 'd') { const ds = []; for (let n = 0; n < 10; n++) { const s = S.mk('span', 'd', t); s.textContent = n; ds.push(s); } tubes.push({ ds, cur: null }); }
      else colons.push(S.mk('div', 'dots2', t, '<i></i><i></i>'));
      S.mk('div', 'sock', cell);
    }
    const show = (i, ch) => { const T = tubes[i]; if (T.cur === ch) return; if (T.cur !== null && T.cur !== ' ') T.ds[+T.cur].classList.remove('on'); if (ch !== ' ') T.ds[+ch].classList.add('on'); T.cur = ch; };
    return {
      onShow() { cs = performance.now(); },
      draw(now, d) {
        const str = timeStr(d), tm = S.hm(d);
        for (let i = 0; i < 6; i++) { let ch = str[i]; if (!S.RM && now < cs + 300 + i * 160) ch = String((Math.floor(now / 55) + i * 7) % 10); show(i, ch); }
        const on = d.getMilliseconds() < 500; colons.forEach(c => c.classList.toggle('on', on));
        S.set(foot, (tm.suf ? tm.suf + ' · ' : '') + d.toLocaleDateString(undefined, { weekday: 'long' }));
      }
    };
  };

  /* Seven-segment vacuum fluorescent display with a bouncing spectrum analyser */
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
  const SEGS = { a: [0, 0, 1], b: [1, 0, 0], c: [1, 1, 0], d: [0, 2, 1], e: [0, 1, 0], f: [0, 0, 0], g: [0, 1, 1] };
  function seg7(x, ox, oy, w, h, ch, on, off) {
    const th = w * .2, g = th * .5, pad = th * .18;
    x.save(); x.translate(ox, oy); x.transform(1, 0, -.09, 1, .09 * h, 0);
    for (const k in SEGS) {
      const [sx, sy, hz] = SEGS[k], lit = ch !== ' ' && SEG[ch].includes(k);
      x.fillStyle = lit ? on : off; x.shadowColor = on; x.shadowBlur = lit ? 14 : 0;
      x.beginPath();
      if (hz) { const Y = sy * h / 2; x.moveTo(pad, Y); x.lineTo(pad + g, Y - g); x.lineTo(w - pad - g, Y - g); x.lineTo(w - pad, Y); x.lineTo(w - pad - g, Y + g); x.lineTo(pad + g, Y + g); }
      else { const X = sx * w, Y = sy * h / 2, L = h / 2; x.moveTo(X, Y + pad); x.lineTo(X + g, Y + pad + g); x.lineTo(X + g, Y + L - pad - g); x.lineTo(X, Y + L - pad); x.lineTo(X - g, Y + L - pad - g); x.lineTo(X - g, Y + pad + g); }
      x.closePath(); x.fill();
    }
    x.restore();
  }
  const vfd = el => {
    el.classList.add('vfd-face');
    const c = S.mk('canvas', null, el); S.mk('div', 'mesh', el); S.mk('div', 'glass', el);
    const ON = '#7ef9e3', OFF = 'rgba(126,249,227,.07)', AMBER = '#ffb347';
    const lv = new Array(28).fill(0);
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    return {
      draw(now, d) {
        const { x, w, h } = S.fit(c), B = S.box(w, h), t = now / 1000;
        x.fillStyle = '#020b0c'; x.fillRect(0, 0, w, h);
        const dh = B.ch * .46, dw = dh * .52, gap = dw * .32, sdh = dh * .5, sdw = sdh * .52;
        const total = 4 * dw + 3 * gap + gap * 1.2 + 2 * sdw + gap * .6 + gap;
        const ox = B.l + (B.cw - total) / 2, oy = B.t + B.ch * .2;
        const str = timeStr(d), tm = S.hm(d);
        let px = ox;
        for (let i = 0; i < 4; i++) { seg7(x, px, oy, dw, dh, str[i], ON, OFF); px += dw + gap; if (i === 1) { const on = d.getMilliseconds() < 500; x.fillStyle = on ? ON : OFF; x.shadowColor = ON; x.shadowBlur = on ? 12 : 0; const r = dw * .09; x.beginPath(); x.arc(px + gap * .1, oy + dh * .32, r, 0, 7); x.arc(px + gap * .1 - dh * .03, oy + dh * .7, r, 0, 7); x.fill(); x.shadowBlur = 0; px += gap * 1.2; } }
        px += gap * .6;
        for (let i = 4; i < 6; i++) { seg7(x, px, oy + dh - sdh, sdw, sdh, str[i], ON, OFF); px += sdw + gap * .5; }
        const fs = Math.max(9, B.ch * .055);
        x.font = `400 ${fs}px "DM Mono", monospace`; x.textBaseline = 'middle'; x.textAlign = 'left';
        const dow = (d.getDay() + 6) % 7, rowY = B.t + B.ch * .08, step = total / 7;
        days.forEach((dn, i) => { const lit = i === dow; x.fillStyle = lit ? ON : OFF; x.shadowColor = ON; x.shadowBlur = lit ? 10 : 0; x.fillText(dn, ox + i * step, rowY); });
        x.shadowBlur = 0;
        const sufX = ox - fs * 2.6;
        ['AM', 'PM'].forEach((s, i) => { const lit = tm.suf === s; x.fillStyle = lit ? AMBER : 'rgba(255,179,71,.08)'; x.shadowColor = AMBER; x.shadowBlur = lit ? 10 : 0; x.fillText(s, Math.max(B.l, sufX), oy + dh * (.25 + i * .3)); });
        x.shadowBlur = 0;
        // spectrum analyser
        const sy = B.t + B.ch * .78, sh = B.ch * .2, n = lv.length, bw = total / n;
        for (let i = 0; i < n; i++) {
          const target = Math.max(0, (.5 + .5 * Math.sin(t * (1.6 + i * .21) + i)) * (.55 + .45 * Math.sin(t * .9 * (i % 5 + 1) + i * 1.7)) * (1 - Math.abs(i - n * .3) / n * .8));
          lv[i] += (target - lv[i]) * .18;
          const blocks = 8, lit = Math.round(lv[i] * blocks);
          for (let k = 0; k < blocks; k++) {
            const on = k < lit, hot = k >= 6;
            x.fillStyle = on ? (hot ? AMBER : ON) : OFF; x.shadowColor = hot ? AMBER : ON; x.shadowBlur = on ? 6 : 0;
            x.fillRect(ox + i * bw + 1, sy + sh - (k + 1) * (sh / blocks) + 1, bw - 3, sh / blocks - 2);
          }
        }
        x.shadowBlur = 0; x.textAlign = 'right'; x.fillStyle = AMBER; x.shadowColor = AMBER; x.shadowBlur = 8;
        x.fillText('▶ LO-FI', ox + total, rowY); x.shadowBlur = 0;
      }
    };
  };

  /* Split-flap cards */
  function card(parent) {
    const c = S.mk('div', 'card', parent);
    const mkH = cls => S.mk('div', 'half ' + cls, c, '<span></span>').firstChild;
    const top = mkH('top'), bot = mkH('bot'), ft = mkH('top flap'), fb = mkH('bot flap');
    let cur = null, tmr = 0;
    return v => {
      if (v === cur) return;
      const old = cur === null ? v : cur; cur = v;
      top.textContent = v; ft.textContent = old; fb.textContent = v; bot.textContent = old;
      if (S.RM || old === v) { bot.textContent = v; return; }
      c.classList.remove('go'); void c.offsetWidth; c.classList.add('go');
      clearTimeout(tmr); tmr = setTimeout(() => { bot.textContent = v; }, 600);
    };
  }
  const flip = el => {
    el.classList.add('flip-face');
    const ui = S.mk('div', 'pad flip', el), row = S.mk('div', 'fl-row', ui);
    const H1 = card(row), H2 = card(row); S.mk('div', 'fl-gap', row); const M1 = card(row), M2 = card(row);
    const sec = S.mk('div', 'fl-sec', row), S1 = card(sec), S2 = card(sec);
    const foot = S.mk('div', 'fl-foot', ui);
    return {
      draw(now, d) {
        const str = timeStr(d), tm = S.hm(d);
        H1(str[0] === ' ' ? '' : str[0]); H2(str[1]); M1(str[2]); M2(str[3]); S1(str[4]); S2(str[5]);
        S.set(foot, (tm.suf ? tm.suf + ' · ' : '') + S.longDate(d));
      }
    };
  };

  S.theme('glow', 'Glow', [
    { id: 'nixie', name: 'Nixie tubes', make: nixie },
    { id: 'vfd', name: 'Hi-fi display', make: vfd },
    { id: 'flip', name: 'Split flap', make: flip },
  ]);
})();
