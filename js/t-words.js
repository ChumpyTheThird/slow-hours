/* Words — the time spelled out in a grid of letters */
(() => {
  const S = SH;
  const ROWS = [['IT', '~', 'IS', '~~', 'HALF', '~', 'TEN.m', '~'], ['QUARTER', '~', 'TWENTY', '~~'], ['FIVE.m', '~', 'PAST', '~', 'TO', '~', 'ONE'], ['TWO', '~', 'THREE', '~', 'FOUR', '~~'], ['FIVE', '~', 'SIX', '~', 'SEVEN', '~~'], ['EIGHT', '~', 'NINE', '~', 'TEN', '~~'], ['ELEVEN', '~', 'TWELVE', '~~~'], ['OCLOCK', '~', 'AM', '~', 'PM', '~~~~']];
  const HOURS = ['TWELVE', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN'];
  const MIN = { 5: ['FIVE.m', 'PAST'], 10: ['TEN.m', 'PAST'], 15: ['QUARTER', 'PAST'], 20: ['TWENTY', 'PAST'], 25: ['TWENTY', 'FIVE.m', 'PAST'], 30: ['HALF', 'PAST'], 35: ['TWENTY', 'FIVE.m', 'TO'], 40: ['TWENTY', 'TO'], 45: ['QUARTER', 'TO'], 50: ['TEN.m', 'TO'], 55: ['FIVE.m', 'TO'] };
  const AB = 'ABCDEFGHIJKLMNOPRSTUVWYZ';

  function phrase(d) {
    const H = d.getHours(), m = d.getMinutes(), m5 = m - m % 5;
    const ids = ['IT', 'IS'];
    if (m5 === 0) ids.push('OCLOCK'); else ids.push(...MIN[m5]);
    ids.splice(m5 === 0 ? 2 : ids.length, 0, HOURS[(m5 >= 35 ? H + 1 : H) % 12]);
    ids.push(H < 12 ? 'AM' : 'PM');
    return { ids, extra: m % 5, key: H + ':' + m };
  }
  function grid(el, cls) {
    el.classList.add('wface', cls);
    const ui = S.mk('div', 'pad words-ui', el), g = S.mk('div', 'wgrid', ui), dw = S.mk('div', 'wdots', ui, '<i></i><i></i><i></i><i></i>');
    const r = S.rng(7), map = {}, cells = [], cols = Array.from({ length: 16 }, () => []);
    ROWS.forEach((row, ri) => {
      let ci = 0;
      for (const tok of row) {
        const filler = tok[0] === '~', word = filler ? null : tok.split('.')[0], n = filler ? tok.length : word.length;
        if (!filler) map[tok] = [];
        for (let i = 0; i < n; i++) {
          const s = S.mk('span', null, g); s.textContent = filler ? AB[Math.floor(r() * AB.length)] : word[i];
          const cell = { s, row: ri, col: ci, word: !filler };
          if (!filler) map[tok].push(cell);
          cells.push(cell); cols[ci].push(cell); ci++;
        }
      }
    });
    return {
      map, cells, cols, dots: [...dw.children],
      resize(w, h) { const B = S.box(w, h), cell = Math.floor(Math.min(B.cw / 16, (B.ch - 10) / 8.7) * .96); ui.style.setProperty('--cell', cell + 'px'); g.style.setProperty('--cell', cell + 'px'); dw.style.setProperty('--cell', cell + 'px'); }
    };
  }
  function light(G, P, onLit) {
    const on = new Map();
    P.ids.forEach((id, i) => G.map[id].forEach(c => on.set(c, i)));
    G.cells.forEach(c => { const lit = on.has(c), was = c.s.classList.contains('lit'); c.s.classList.toggle('lit', lit); if (onLit) onLit(c, lit, was, on.get(c)); });
    G.dots.forEach((dt, i) => dt.classList.toggle('lit', i < P.extra));
  }

  const warm = el => {
    const G = grid(el, 'warm'); let key = '';
    return { resize: G.resize, draw(now, d) { const P = phrase(d); if (P.key === key) return; key = P.key; light(G, P); } };
  };

  const NEON = ['#ff4fd8', '#3ff0ff', '#ffd23f', '#9dff57', '#ff7a3d', '#b78bff'];
  const neon = el => {
    const G = grid(el, 'neon'); let key = '';
    return {
      resize: G.resize,
      onShow() { key = ''; G.cells.forEach(c => c.s.classList.remove('lit')); },
      draw(now, d) {
        const P = phrase(d); if (P.key === key) return; key = P.key;
        light(G, P, (c, lit, was, wi) => {
          if (lit) c.s.style.setProperty('--nc', NEON[wi % NEON.length]);
          if (lit && !was && !S.RM) { c.s.classList.remove('flick'); void c.s.offsetWidth; c.s.classList.add('flick'); }
        });
      }
    };
  };

  const rain = el => {
    const G = grid(el, 'rain'); let key = '', last = 0;
    const r = Math.random, drops = G.cols.map(() => ({ y: -r() * 10, v: 5 + r() * 7 }));
    return {
      resize: G.resize,
      draw(now, d) {
        const P = phrase(d); if (P.key !== key) { key = P.key; light(G, P); }
        if (S.RM) return;
        const dt = last ? Math.min(.1, (now - last) / 1000) : 0; last = now;
        drops.forEach((dr, ci) => {
          dr.y += dr.v * dt; if (dr.y > 14) { dr.y = -r() * 6; dr.v = 5 + r() * 7; }
          for (const c of G.cols[ci]) {
            const dist = dr.y - c.row, st = dist >= 0 && dist < 1 ? 'hot' : dist >= 1 && dist < 4.5 ? 'trail' : '';
            if (c.st !== st) {
              if (c.st) c.s.classList.remove(c.st);
              if (st) c.s.classList.add(st);
              if (st === 'hot' && !c.word) c.s.textContent = AB[Math.floor(r() * AB.length)];
              c.st = st;
            }
          }
        });
      }
    };
  };

  S.theme('words', 'Words', [
    { id: 'warm', name: 'Lamplight', make: warm },
    { id: 'neon', name: 'Neon sign', make: neon },
    { id: 'rain', name: 'Code rain', make: rain },
  ]);
})();
