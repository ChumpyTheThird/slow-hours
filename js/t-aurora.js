/* Aurora — big rolling numerals over slow colour fields */
(() => {
  const S = SH;
  function face(paint, cls) {
    return el => {
      el.classList.add('aur'); if (cls) el.classList.add(cls);
      const c = S.mk('canvas', null, el), ui = S.mk('div', 'pad aurora-ui', el);
      const time = S.mk('div', 'a-time num', ui), rt = S.rollText(time), suf = S.mk('span', 'a-suf', time);
      const date = S.mk('div', 'a-date', ui), sec = S.mk('i', null, S.mk('div', 'a-sec', ui));
      return {
        draw(now, d) {
          const { x, w, h } = S.fit(c, .25);
          x.globalCompositeOperation = 'source-over';
          paint(x, w, h, now / 1000 * (S.RM ? .25 : 1), d);
          x.globalCompositeOperation = 'source-over';
          const tm = S.hm(d);
          rt.set(tm.h + ':' + tm.m); S.set(suf, tm.suf); S.set(date, S.longDate(d));
          sec.style.transform = `scaleX(${(d.getSeconds() + d.getMilliseconds() / 1000) / 60})`;
        }
      };
    };
  }
  function blob(x, w, h, bx, by, r, c0, c1) {
    const g = x.createRadialGradient(bx, by, 0, bx, by, r);
    g.addColorStop(0, c0); g.addColorStop(1, c1); x.fillStyle = g; x.fillRect(0, 0, w, h);
  }
  const AB = [{ sx: .07, sy: .09, p: 0, r: .6, dh: 0 }, { sx: .05, sy: .04, p: 2, r: .5, dh: 45 }, { sx: .08, sy: .06, p: 4, r: .45, dh: -55 }, { sx: .04, sy: .07, p: 5.5, r: .62, dh: 100 }];
  function aurora(x, w, h, t, d) {
    const base = ((d.getHours() * 60 + d.getMinutes()) / 1440 * 360 + 200) % 360;
    x.fillStyle = `hsl(${base},45%,7%)`; x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'lighter';
    for (const b of AB) {
      const hue = (base + b.dh + 360) % 360;
      blob(x, w, h, w * (.5 + .4 * Math.sin(t * b.sx + b.p)), h * (.5 + .45 * Math.cos(t * b.sy + b.p * 1.7)), Math.max(w, h) * b.r, `hsla(${hue},80%,56%,.5)`, `hsla(${hue},80%,40%,0)`);
    }
  }
  const LB = Array.from({ length: 6 }, (_, i) => ({ sx: .11 + i * .017, sy: .09 + i * .021, p: i * 1.9, r: .3 + (i % 3) * .07, dh: i * 7 }));
  function lava(x, w, h, t) {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2a0804'); g.addColorStop(1, '#0d0302');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'lighter';
    for (const b of LB) {
      const r = Math.min(w, h) * b.r * 1.5;
      blob(x, w, h, w * (.5 + .42 * Math.sin(t * b.sx * .6 + b.p)), h * (.5 + .6 * Math.sin(t * b.sy + b.p * 1.3)), r, `hsla(${8 + b.dh},95%,55%,.6)`, `hsla(${8 + b.dh},95%,45%,0)`);
    }
  }
  function sea(x, w, h, t) {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0a4a66'); g.addColorStop(1, '#03121e');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const cx = w * (i / 6) + Math.sin(t * .2 + i) * w * .06;
      x.beginPath(); x.moveTo(cx - w * .03, 0); x.lineTo(cx + w * .03, 0); x.lineTo(cx + w * .2, h); x.lineTo(cx - w * .02, h); x.closePath();
      const rg = x.createLinearGradient(0, 0, 0, h);
      rg.addColorStop(0, `rgba(140,230,255,${.1 + .07 * Math.sin(t * .7 + i * 2)})`); rg.addColorStop(1, 'rgba(140,230,255,0)');
      x.fillStyle = rg; x.fill();
    }
    blob(x, w, h, w * (.3 + .2 * Math.sin(t * .05)), h * .8, w * .4, 'rgba(40,200,190,.25)', 'rgba(40,200,190,0)');
    blob(x, w, h, w * (.75 + .1 * Math.cos(t * .04)), h * .3, w * .35, 'rgba(60,120,255,.2)', 'rgba(60,120,255,0)');
  }
  function paper(x, w, h, t) {
    x.fillStyle = '#ebe6dc'; x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'multiply';
    blob(x, w, h, w * (.5 + .35 * Math.sin(t * .06)), h * (.5 + .4 * Math.cos(t * .05)), w * .45, 'rgba(90,100,125,.35)', 'rgba(90,100,125,0)');
    blob(x, w, h, w * (.5 + .4 * Math.cos(t * .045 + 2)), h * (.5 + .4 * Math.sin(t * .07 + 1)), w * .4, 'rgba(210,140,100,.3)', 'rgba(210,140,100,0)');
    blob(x, w, h, w * (.5 + .4 * Math.sin(t * .035 + 4)), h * (.5 + .45 * Math.sin(t * .05 + 3)), w * .35, 'rgba(120,160,150,.28)', 'rgba(120,160,150,0)');
  }
  S.theme('aurora', 'Aurora', [
    { id: 'aurora', name: 'Aurora', make: face(aurora) },
    { id: 'lava', name: 'Lava lamp', make: face(lava, 'lava') },
    { id: 'sea', name: 'Deep sea', make: face(sea, 'deep') },
    { id: 'paper', name: 'Paper', make: face(paper, 'light') },
  ]);
})();
