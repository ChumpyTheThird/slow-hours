/* Dial — analogue faces and a radar sweep */
(() => {
  const S = SH, { TAU, PI } = S;
  const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } })();
  const city = (tz.split('/').pop() || 'Local').replace(/_/g, ' ');
  const utc = d => { const off = -d.getTimezoneOffset(), oh = Math.trunc(off / 60), om = Math.abs(off % 60); return `UTC${off >= 0 ? '+' : '−'}${Math.abs(oh)}${om ? ':' + S.pad2(om) : ''}`; };

  function hand(x, a, len, tail, w0, w1, col) {
    x.save(); x.rotate(a); x.beginPath();
    x.moveTo(-w0 / 2, tail); x.lineTo(-w1 / 2, -len); x.lineTo(w1 / 2, -len); x.lineTo(w0 / 2, tail);
    x.closePath(); x.fillStyle = col; x.fill(); x.restore();
  }
  function moon(x, cx, cy, r, p, lit, dark) {
    x.save(); x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fillStyle = dark; x.fill(); x.clip();
    const k = Math.cos(TAU * p);
    x.fillStyle = lit; x.beginPath();
    if (p < .5) x.arc(cx, cy, r, -PI / 2, PI / 2); else x.arc(cx, cy, r, PI / 2, PI * 1.5);
    x.closePath(); x.fill();
    x.beginPath(); x.ellipse(cx, cy, Math.max(.01, r * Math.abs(k)), r, 0, 0, TAU); x.fillStyle = k > 0 ? dark : lit; x.fill();
    x.restore();
  }

  const PAL = {
    classic: { page: '#0b0a09', bg0: '#1c1915', bg1: '#080707', d0: '#1d1a16', d1: '#110f0d', ring: 'rgba(236,229,216,.1)', major: '#ece5d8', minor: 'rgba(236,229,216,.35)', hand: '#ece5d8', sec: '#ff8a3d', win: '#ece5d8', winT: '#16130f', alt: 'rgba(236,229,216,.08)', altT: 'rgba(236,229,216,.75)', brand: 'rgba(236,229,216,.45)', moonL: '#e9e1d3', moonD: '#24211d', foot: 'rgba(236,229,216,.42)', shadow: 'rgba(0,0,0,.6)' },
    paper: { page: '#e4ded1', bg0: '#efe9dd', bg1: '#d9d2c3', d0: '#f7f3ea', d1: '#ebe5d8', ring: 'rgba(28,36,51,.18)', major: '#1c2433', minor: 'rgba(28,36,51,.4)', hand: '#1c2433', sec: '#c2452d', win: '#fffdf8', winT: '#1c2433', alt: 'rgba(28,36,51,.07)', altT: 'rgba(28,36,51,.75)', brand: 'rgba(28,36,51,.5)', moonL: '#f4e7c4', moonD: '#1c2433', foot: 'rgba(28,36,51,.55)', shadow: 'rgba(60,50,30,.25)', nums: 'roman' },
    bauhaus: { page: '#d8d0bf', bg0: '#e3dccc', bg1: '#cfc6b3', d0: '#f1ebdd', d1: '#ece4d4', ring: 'rgba(20,20,20,.9)', major: '#151515', minor: 'rgba(21,21,21,0)', hand: '#151515', hour: '#1f4fa0', sec: '#d6372b', win: '#f2b705', winT: '#151515', alt: 'rgba(0,0,0,0)', altT: 'rgba(0,0,0,0)', brand: 'rgba(21,21,21,.6)', moonL: '#f2b705', moonD: '#151515', foot: 'rgba(21,21,21,.55)', shadow: 'rgba(0,0,0,.18)', nums: 'arabic', bauhaus: true },
  };

  const dial = P => el => {
    el.style.background = P.page;
    const c = S.mk('canvas', null, el), foot = S.mk('div', 'sw-foot', el); foot.style.color = P.foot;
    const tzEl = S.mk('span', null, foot), moEl = S.mk('span', null, foot);
    return {
      draw(now, d) {
        const { x, w, h } = S.fit(c), B = S.box(w, h);
        const cx = w / 2, cy = B.t + B.ch / 2, R = Math.max(30, Math.min(B.ch, B.cw) / 2 - 6);
        const bg = x.createRadialGradient(cx, cy, R * .2, cx, cy, Math.max(w, h) * .75); bg.addColorStop(0, P.bg0); bg.addColorStop(1, P.bg1);
        x.fillStyle = bg; x.fillRect(0, 0, w, h);
        if (P.bauhaus) { // a few flat shapes behind the dial
          x.fillStyle = '#1f4fa0'; x.fillRect(B.l, B.t + B.ch * .55, B.cw * .12, B.ch * .45);
          x.fillStyle = '#d6372b'; x.beginPath(); x.arc(w - B.r - B.cw * .08, B.t + B.ch * .22, B.ch * .14, 0, TAU); x.fill();
          x.fillStyle = '#f2b705'; x.beginPath(); x.moveTo(w - B.r, h - B.b); x.lineTo(w - B.r - B.cw * .14, h - B.b); x.lineTo(w - B.r, h - B.b - B.ch * .3); x.closePath(); x.fill();
        }
        const dg = x.createRadialGradient(cx, cy - R * .4, R * .1, cx, cy, R); dg.addColorStop(0, P.d0); dg.addColorStop(1, P.d1);
        x.save(); x.shadowColor = P.shadow; x.shadowBlur = R * .08; x.shadowOffsetY = R * .03;
        x.fillStyle = dg; x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.fill(); x.restore();
        x.strokeStyle = P.ring; x.lineWidth = P.bauhaus ? R * .025 : 1; x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.stroke();
        x.save(); x.translate(cx, cy);
        for (let i = 0; i < 60; i++) {
          x.save(); x.rotate(i / 60 * TAU);
          if (i % 5 === 0) { x.fillStyle = P.major; if (P.bauhaus) x.fillRect(-R * .02, -R * .93, R * .04, R * .1); else x.fillRect(-R * .014, -R * .95, R * .028, R * .11); }
          else if (!P.bauhaus) { x.fillStyle = P.minor; x.fillRect(-.5, -R * .95, 1, R * .04); }
          x.restore();
        }
        x.restore();
        x.textAlign = 'center'; x.textBaseline = 'middle';
        if (P.nums) {
          const labels = P.nums === 'roman' ? ['XII', 'III', 'VI', 'IX'] : ['12', '3', '6', '9'];
          x.fillStyle = P.major; x.font = P.nums === 'roman' ? `400 ${R * .15}px "Instrument Serif", serif` : `500 ${R * .17}px "Space Grotesk", sans-serif`;
          labels.forEach((l, i) => { if (P.nums === 'roman' && i % 2 === 1) return; const a = i * PI / 2 - PI / 2; x.fillText(l, cx + Math.cos(a) * R * .7, cy + Math.sin(a) * R * .7 + R * .01); });
        }
        const fs = Math.max(9, R * .075), ww = R * .2, wh = R * .12;
        x.font = `400 ${fs}px "DM Mono", monospace`;
        const winX = P.bauhaus ? cx + R * .38 : cx + R * .62;
        if (!(P.nums === 'arabic')) { x.fillStyle = P.win; x.fillRect(winX - ww / 2, cy - wh / 2, ww, wh); x.fillStyle = P.winT; x.fillText(String(d.getDate()), winX, cy + 1); }
        if (!P.bauhaus) { x.fillStyle = P.alt; x.fillRect(cx - R * .62 - ww * .65, cy - wh / 2, ww * 1.3, wh); x.fillStyle = P.altT; x.fillText(d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(), cx - R * .62, cy + 1); }
        x.font = `500 ${Math.max(8, R * .045)}px "Space Grotesk", sans-serif`; x.fillStyle = P.brand;
        x.fillText(P.bauhaus ? 'F O R M  ·  F U N C T I O N' : 'S L O W   H O U R S', cx, cy - R * .38);
        const p = S.moonPhase(d), my = cy + R * .44;
        if (!P.bauhaus) { x.strokeStyle = P.ring; x.lineWidth = 1; x.beginPath(); x.arc(cx, my, R * .15, 0, TAU); x.stroke(); moon(x, cx, my, R * .1, p, P.moonL, P.moonD); }
        const f = S.fracs(d);
        x.save(); x.translate(cx, cy);
        x.shadowColor = P.shadow; x.shadowBlur = R * .04; x.shadowOffsetY = R * .018;
        if (P.bauhaus) {
          hand(x, f.hr * TAU, R * .5, R * .1, R * .09, R * .09, P.hour);
          hand(x, f.min * TAU, R * .82, R * .12, R * .05, R * .05, P.hand);
          x.save(); x.rotate(f.sec * TAU); x.fillStyle = P.sec; x.fillRect(-1.25, -R * .9, 2.5, R * 1.12);
          x.fillStyle = '#f2b705'; x.beginPath(); x.arc(0, -R * .66, R * .05, 0, TAU); x.fill(); x.restore();
        } else {
          hand(x, f.hr * TAU, R * .52, R * .08, R * .06, R * .032, P.hand);
          hand(x, f.min * TAU, R * .8, R * .1, R * .045, R * .022, P.hand);
          x.save(); x.rotate(f.sec * TAU); x.fillStyle = P.sec; x.fillRect(-1, -R * .9, 2, R * 1.1); x.beginPath(); x.arc(0, R * .17, R * .03, 0, TAU); x.fill(); x.restore();
        }
        x.shadowBlur = 0; x.shadowOffsetY = 0;
        x.fillStyle = P.sec; x.beginPath(); x.arc(0, 0, R * .03, 0, TAU); x.fill();
        x.fillStyle = P.winT; x.beginPath(); x.arc(0, 0, R * .012, 0, TAU); x.fill();
        x.restore();
        S.set(tzEl, `${city} · ${utc(d)}`);
        S.set(moEl, `${S.moonName(p)} · ${Math.round((1 - Math.cos(TAU * p)) / 2 * 100)}% lit`);
      }
    };
  };

  const radar = el => {
    el.style.background = '#010603';
    const c = S.mk('canvas', null, el); S.mk('div', 'crt', el);
    const hud = S.mk('div', 'pad radar-hud', el), L = S.mk('div', 'rh-l', hud), Rt = S.mk('div', 'rh-r', hud);
    const r = S.rng(42), noise = Array.from({ length: 14 }, () => ({ a: r() * TAU, r: .15 + r() * .8 }));
    const G = [89, 255, 156];
    return {
      draw(now, d) {
        const { x, w, h } = S.fit(c), B = S.box(w, h);
        const cx = w / 2, cy = B.t + B.ch / 2, R = Math.max(30, Math.min(B.ch, B.cw) / 2 - 4);
        x.fillStyle = '#010603'; x.fillRect(0, 0, w, h);
        const bg = x.createRadialGradient(cx, cy, 0, cx, cy, R); bg.addColorStop(0, 'rgba(20,80,40,.35)'); bg.addColorStop(1, 'rgba(10,40,20,.1)');
        x.fillStyle = bg; x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.fill();
        x.strokeStyle = S.rgba(G, .2); x.lineWidth = 1;
        for (let k = 1; k <= 4; k++) { x.beginPath(); x.arc(cx, cy, R * k / 4, 0, TAU); x.stroke(); }
        x.beginPath(); x.moveTo(cx - R, cy); x.lineTo(cx + R, cy); x.moveTo(cx, cy - R); x.lineTo(cx, cy + R); x.stroke();
        for (let i = 0; i < 72; i++) { const a = i / 72 * TAU, l = i % 6 === 0 ? 8 : 4; x.beginPath(); x.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); x.lineTo(cx + Math.cos(a) * (R - l), cy + Math.sin(a) * (R - l)); x.stroke(); }
        const f = S.fracs(d), A = f.sec * TAU - PI / 2, tl = 1.1;
        if (x.createConicGradient) {
          const cg = x.createConicGradient(A - tl, cx, cy); cg.addColorStop(0, S.rgba(G, 0)); cg.addColorStop(tl / TAU, S.rgba(G, .42)); cg.addColorStop(tl / TAU + .001, S.rgba(G, 0)); cg.addColorStop(1, S.rgba(G, 0));
          x.fillStyle = cg; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, R, A - tl, A); x.closePath(); x.fill();
        }
        x.strokeStyle = S.rgba(G, .95); x.lineWidth = 2; x.shadowColor = S.rgb(G); x.shadowBlur = 10;
        x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(A) * R, cy + Math.sin(A) * R); x.stroke();
        const fade = a => { const dl = ((A - a) % TAU + TAU) % TAU; return Math.exp(-dl * .9); };
        for (const n of noise) { const al = fade(n.a - PI / 2) * .5; if (al < .03) continue; x.fillStyle = S.rgba(G, al); x.beginPath(); x.arc(cx + Math.cos(n.a - PI / 2) * R * n.r, cy + Math.sin(n.a - PI / 2) * R * n.r, 1.6, 0, TAU); x.fill(); }
        x.font = `400 ${Math.max(9, R * .06)}px "DM Mono", monospace`; x.textAlign = 'left'; x.textBaseline = 'middle';
        for (const b of [{ a: f.hr * TAU - PI / 2, r: .5, l: 'H', s: 6 }, { a: f.min * TAU - PI / 2, r: .82, l: 'M', s: 4.5 }]) {
          const al = .25 + .75 * fade(b.a), bx = cx + Math.cos(b.a) * R * b.r, by = cy + Math.sin(b.a) * R * b.r;
          x.fillStyle = S.rgba([200, 255, 215], al); x.beginPath(); x.arc(bx, by, b.s, 0, TAU); x.fill();
          x.strokeStyle = S.rgba(G, al * .7); x.lineWidth = 1; x.beginPath(); x.arc(bx, by, b.s + 4 + 3 * Math.sin(now / 300), 0, TAU); x.stroke();
          x.fillStyle = S.rgba(G, al); x.fillText(b.l, bx + b.s + 6, by - b.s - 2);
        }
        x.shadowBlur = 0;
        const tm = S.hm(d), deg = n => String(Math.round(n * 360) % 360).padStart(3, '0');
        S.set(L, `TGT H  ${tm.h.padStart(2, '0')}  BRG ${deg(f.hr)}°\nTGT M  ${tm.m}  BRG ${deg(f.min)}°\nSWEEP  ${tm.s}s`);
        S.set(Rt, `${tm.suf || 'LOCAL'}\n${S.shortDate(d).toUpperCase()}\n${city.toUpperCase()}`);
      }
    };
  };

  S.theme('dial', 'Dial', [
    { id: 'classic', name: 'Classic', make: dial(PAL.classic) },
    { id: 'paper', name: 'Paper', make: dial(PAL.paper) },
    { id: 'bauhaus', name: 'Bauhaus', make: dial(PAL.bauhaus) },
    { id: 'radar', name: 'Radar', make: radar },
  ]);
})();
