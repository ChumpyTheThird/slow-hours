/* Pixel — lo-fi pixel-art scenes drawn on a tiny canvas and scaled up crisp */
(() => {
  const S = SH;

  /* 3×5 bitmap font */
  const FONT = { '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001', '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111', 'A': '010101111101101', 'P': '110101110100100', 'M': '101111111101101', ':': '000010000010000', ';': '000000000000000', ' ': '000000000000000' };
  const narrow = ch => ch === ':' || ch === ';';
  const pw = (str, s) => { let w = 0; for (const ch of str) w += (narrow(ch) ? 2 : 4) * s; return w - s; };
  function ptext(x, str, px, py, s, col, sh) {
    // sh: a colour for a drop shadow, or { o: colour } for a full outline
    const offs = sh && sh.o ? [[-s, 0], [s, 0], [0, -s], [0, s], [s, s]] : [[s, s]], shc = sh && sh.o ? sh.o : sh;
    for (const pass of sh ? [0, 1] : [1]) {
      let cx = px;
      for (const ch of str) {
        const g = FONT[ch] || FONT[' '], nr = narrow(ch);
        for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {
          if (g[r * 3 + c] !== '1' || (nr && c !== 1)) continue;
          const X = nr ? cx : cx + c * s;
          if (pass === 0) { x.fillStyle = shc; for (const [ox, oy] of offs) x.fillRect(X + ox, py + r * s + oy, s, s); }
          else { x.fillStyle = typeof col === 'function' ? col(r) : col; x.fillRect(X, py + r * s, s, s); }
        }
        cx += (nr ? 2 : 4) * s;
      }
    }
  }
  function sprite(x, rows, pal, px, py, flip) {
    const w = rows[0].length;
    for (let r = 0; r < rows.length; r++) for (let c = 0; c < rows[r].length; c++) {
      const k = rows[r][c]; if (k === '.') continue;
      x.fillStyle = pal[k]; x.fillRect(Math.round(px + (flip ? w - 1 - c : c)), Math.round(py + r), 1, 1);
    }
  }
  function disc(x, cx, cy, r, col) { for (let dy = -r; dy <= r; dy++) { const hw = Math.floor(Math.sqrt(r * r - dy * dy)); x.fillStyle = col; x.fillRect(Math.round(cx - hw), Math.round(cy + dy), hw * 2 + 1, 1); } }
  const clockStr = d => { const tm = S.hm(d); return tm.h + (d.getMilliseconds() < 500 ? ':' : ';') + tm.m; };
  function pfit(c, PW) {
    const w = c.clientWidth || 1, h = c.clientHeight || 1, W = PW, H = Math.max(40, Math.round(PW * h / w));
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.imageSmoothingEnabled = false;
    return { x, W, H, sx: W / w };
  }
  function scene(PW, init, draw, label) {
    return el => {
      el.classList.add('pix');
      const c = S.mk('canvas', 'pc', el); S.mk('div', 'crt', el);
      const lab = S.mk('div', 'pix-label', el); if (label) lab.style.setProperty('--pl', label);
      const st = init ? init() : {}; let last = 0;
      return {
        onShow() { last = 0; },
        draw(now, d) {
          const P = pfit(c, PW), dt = last ? Math.min(.1, (now - last) / 1000) : 0; last = now;
          const ins = { l: Math.max(16, S.INS.l) * P.sx, r: Math.max(16, S.INS.r) * P.sx, t: Math.max(12, S.INS.t) * P.sx, b: Math.max(14, S.INS.b) * P.sx };
          draw(P.x, P.W, P.H, now / 1000, S.RM ? 0 : dt, d, st, ins);
          const tm = S.hm(d);
          S.set(lab, (tm.suf ? tm.suf + ' · ' : '') + S.shortDate(d).toUpperCase());
        }
      };
    };
  }
  const bandSky = (x, W, top, bot, y0, y1, band = 3) => { for (let r = y0; r < y1; r++) { const k = Math.floor((r - y0) / band) * band / Math.max(1, y1 - y0); x.fillStyle = S.rgb(S.mix(top, bot, Math.min(1, k))); x.fillRect(0, r, W, 1); } };

  /* ---------- Rainy room ---------- */
  const CAT = ['.k.k............', '.kkk..kkkkkkk...', 'kkkkkkkkkkkkkkk.', 'pgkgkkkkkkkkkkkk', 'kkkkkkkkkkkkkkkk', '.kkkkkkkkkkkkkk.'];
  const CATP = { k: '#141019', g: '#6b6075', p: '#c97b8e' };
  const MUG = ['wcccw..', 'wwwwwss', 'wwwww.s', 'wwwwwss', '.www...'];
  const MUGP = { w: '#e9e2d6', c: '#5b3a2a', s: '#cfc6b8' };
  const LEAF = ['...g...', '.g.d.g.', 'gdg.gdg', '.gdgdg.', '..ddd..', '...d...'];
  const LEAFP = { g: '#6fb07d', d: '#3f7a52' };
  const SHADE = ['..sssss..', '.sssssss.', 'sssssssss', 'yyyyyyyyy'];
  const SHADEP = { s: '#d9964a', y: '#ffe2a8' };
  const room = scene(200, () => {
    const r = S.rng(12);
    return {
      drops: Array.from({ length: 70 }, () => ({ x: r(), y: r(), v: .7 + r() * .5 })),
      stars: Array.from({ length: 30 }, () => ({ x: r(), y: r(), p: r() * 6 })),
      bld: (() => { const a = []; for (let x0 = 0; x0 < 1; ) { const bw = .06 + r() * .12; a.push({ x: x0, w: bw, h: .12 + r() * .3, s: r() }); x0 += bw + .01; } return a; })(),
      books: Array.from({ length: 9 }, () => ({ w: 2 + Math.floor(r() * 2), h: 6 + Math.floor(r() * 4), c: ['#c86b5a', '#e0b45c', '#6f9a8d', '#8a6fb0', '#d98aa0', '#5d7fb5'][Math.floor(r() * 6)] })),
      flash: 0
    };
  }, (x, W, H, t, dt, d, st) => {
    const hf = S.hoursF(d), [top, bot] = S.skyAt(hf), night = S.nightAmt(hf);
    x.fillStyle = '#2a2135'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#2f2539'; for (let i = 3; i < W; i += 8) x.fillRect(i, 0, 1, H);
    const wx = Math.round(W * .07), wy = Math.round(H * .1), ww = Math.round(W * .36), wh = Math.round(H * .48);
    // view through the window
    x.save(); x.beginPath(); x.rect(wx, wy, ww, wh); x.clip();
    bandSky(x, W, top, bot, wy, wy + wh, 2);
    if (night > 0) for (const s of st.stars) { x.fillStyle = `rgba(255,255,255,${night * (Math.sin(t * 2 + s.p) > -.3 ? .8 : .25)})`; x.fillRect(wx + Math.floor(s.x * ww), wy + Math.floor(s.y * wh * .55), 1, 1); }
    if (hf >= 6 && hf <= 18) { const k = (hf - 6) / 12; disc(x, wx + ww * k, wy + wh * .75 - Math.sin(Math.PI * k) * wh * .55, 4, '#ffe9b0'); }
    else { const k = (((hf - 18) + 24) % 24) / 12; disc(x, wx + ww * k, wy + wh * .75 - Math.sin(Math.PI * k) * wh * .55, 3, '#eeeadf'); }
    for (const b of st.bld) {
      const bx = wx + Math.round(b.x * ww), bh = Math.round(b.h * wh), bw = Math.max(3, Math.round(b.w * ww));
      x.fillStyle = S.rgb(S.mix(bot, [12, 10, 22], .8)); x.fillRect(bx, wy + wh - bh, bw, bh);
      if (night > .3) { x.fillStyle = '#ffd27a'; for (let yy = wy + wh - bh + 2; yy < wy + wh - 1; yy += 3) for (let xx = bx + 1; xx < bx + bw - 1; xx += 2) if (((xx * 7 + yy * 13 + Math.floor(b.s * 50)) % 5) === 0) x.fillRect(xx, yy, 1, 1); }
    }
    x.fillStyle = 'rgba(170,195,255,.55)';
    for (const p of st.drops) { p.y += p.v * dt * 1.2; p.x -= p.v * dt * .25; if (p.y > 1) { p.y -= 1; } if (p.x < 0) p.x += 1; x.fillRect(wx + Math.floor(p.x * ww), wy + Math.floor(p.y * wh), 1, 2); }
    if (st.flash > 0) { x.fillStyle = `rgba(230,235,255,${st.flash * 4})`; x.fillRect(wx, wy, ww, wh); st.flash -= dt; }
    else if (dt && Math.random() < dt / 50) st.flash = .14;
    x.restore();
    // frame, mullions, sill, curtains
    x.fillStyle = '#17111d'; x.fillRect(wx - 2, wy - 2, ww + 4, 2); x.fillRect(wx - 2, wy + wh, ww + 4, 2); x.fillRect(wx - 2, wy, 2, wh); x.fillRect(wx + ww, wy, 2, wh);
    x.fillRect(wx + Math.floor(ww / 2), wy, 1, wh); x.fillRect(wx, wy + Math.floor(wh / 2), ww, 1);
    x.fillStyle = '#4a3344'; x.fillRect(wx - 4, wy + wh + 2, ww + 8, 2);
    for (let rr = -3; rr < wh + 6; rr++) {
      const sway = Math.round(Math.sin(rr * .15 + t * .8) * .8), cw = 6 + sway + (rr > wh * .6 ? 1 : 0);
      for (const side of [0, 1]) {
        const x0 = side ? wx + ww + 3 - cw + 4 : wx - 7;
        for (let i = 0; i < cw; i++) { x.fillStyle = (i + (side ? 1 : 0)) % 3 === 0 ? '#5f2d46' : '#7b3d5a'; x.fillRect(x0 + i, wy + rr, 1, 1); }
      }
    }
    x.fillStyle = '#3a2a3a'; x.fillRect(wx - 9, wy - 5, ww + 18, 2);
    // big clock on the wall
    const str = clockStr(d), areaX = wx + ww + 14, areaW = W - areaX - 8;
    let s = 4; while (s > 1 && pw(str, s) > areaW) s--;
    const tw = pw(str, s), cx = areaX + Math.floor((areaW - tw) / 2), cy = wy + 2;
    x.fillStyle = 'rgba(255,190,110,.06)'; x.fillRect(cx - 4, cy - 3, tw + 8, 5 * s + 6);
    ptext(x, str, cx, cy, s, '#ffcf8a', '#1a131f');
    const tm = S.hm(d); if (tm.suf) ptext(x, tm.suf, cx + tw - pw(tm.suf, 1), cy + 5 * s + 3, 1, '#c99a6a');
    // shelf with books
    const shY = cy + 5 * s + 16;
    x.fillStyle = '#4a3344'; x.fillRect(areaX + 6, shY, Math.min(56, areaW - 6), 2);
    let bx = areaX + 9; for (const b of st.books) { if (bx + b.w > areaX + Math.min(56, areaW - 6)) break; x.fillStyle = b.c; x.fillRect(bx, shY - b.h, b.w, b.h); bx += b.w + (b.h < 7 ? 1 : 0); }
    sprite(x, LEAF, LEAFP, bx + 3 + Math.round(Math.sin(t * .9) * .6), shY - 9);
    x.fillStyle = '#b0603e'; x.fillRect(bx + 4, shY - 3, 5, 3);
    // night tint
    if (night > 0) { x.fillStyle = `rgba(8,6,28,${.28 * night})`; x.fillRect(0, 0, W, H); }
    // desk
    const dy = H - Math.round(H * .22);
    x.fillStyle = '#7a5140'; x.fillRect(0, dy, W, 2);
    x.fillStyle = '#4b3024'; x.fillRect(0, dy + 2, W, H - dy - 2);
    x.fillStyle = '#3e271d'; for (let i = 9; i < W; i += 23) x.fillRect(i, dy + 5, 12, 1);
    // lamp + light
    const lx = Math.round(W * .86), fl = .12 + .015 * Math.sin(t * 13) + .01 * Math.sin(t * 7.3);
    x.fillStyle = `rgba(255,214,150,${fl})`; x.beginPath(); x.moveTo(lx - 3, dy - 15); x.lineTo(lx + 5, dy - 15); x.lineTo(lx + 22, dy); x.lineTo(lx - 20, dy); x.closePath(); x.fill();
    x.fillStyle = `rgba(255,214,150,${fl + .1})`; x.fillRect(lx - 18, dy, 38, 1);
    x.fillStyle = '#3a3a44'; x.fillRect(lx, dy - 16, 1, 16); x.fillRect(lx - 3, dy - 1, 8, 1);
    sprite(x, SHADE, SHADEP, lx - 4, dy - 19);
    // mug + steam
    const mx = Math.round(W * .7), my = dy - 5;
    sprite(x, MUG, MUGP, mx, my);
    for (let i = 0; i < 2; i++) for (let k = 0; k < 7; k++) {
      const yy = (k + t * 3 + i * 3.5) % 7, a = (1 - yy / 7) * .5;
      x.fillStyle = `rgba(235,230,240,${a})`; x.fillRect(mx + 1 + i * 2 + Math.round(Math.sin(t * 2 + yy * .8 + i) * 1), Math.round(my - 2 - yy), 1, 1);
    }
    // sleeping cat, breathing, tail flicking, dreaming
    const kx = Math.round(W * .38), ky = dy - 6, breath = Math.sin(t * 1.6) > .2;
    sprite(x, CAT, CATP, kx, ky);
    x.fillStyle = CATP.k; if (breath) x.fillRect(kx + 6, ky, 7, 1);
    for (let c = 4; c < 16; c++) x.fillRect(kx + c, ky + 6, 1, 1);
    x.fillRect(kx + 16, ky + 4, 1, 2);
    x.fillRect(kx + 3, ky + 6 - (Math.sin(t * 2.2) > .55 ? 1 : 0), 1, 1);
    const zt = (t % 3) / 3, za = 1 - zt;
    if (za > .1) { x.fillStyle = `rgba(220,215,240,${za * .8})`; const zx = kx - 2 - Math.round(zt * 3), zy = ky - 3 - Math.round(zt * 8); x.fillRect(zx, zy, 3, 1); x.fillRect(zx + 1, zy + 1, 1, 1); x.fillRect(zx, zy + 2, 3, 1); }
    // little plant on the desk
    const px = Math.round(W * .1);
    sprite(x, LEAF, LEAFP, px + Math.round(Math.sin(t * .7) * .6), dy - 10);
    x.fillStyle = '#b0603e'; x.fillRect(px + 1, dy - 4, 5, 4); x.fillStyle = '#8c4a30'; x.fillRect(px + 1, dy - 4, 5, 1);
  }, '#ffcf8a');

  /* ---------- Night drive ---------- */
  const CAR = ['....pppppppppp....', '...pccccccccccp...', '..pccccccccccccp..', 'pppppppppppppppppp', 'pRRRhhhhhhhhhhRRRp', 'pppppppppppppppppp', '.kkk..........kkk.'];
  const CARP = { p: '#3b1e6d', c: '#2de2ff', R: '#ff2050', h: '#1a0f33', k: '#05010c' };
  const drive = scene(200, () => ({ stars: S.stars(60, 9) }), (x, W, H, t, dt, d, st, ins) => {
    const hz = Math.round(H * .58);
    for (let r = 0; r < hz; r++) { const k = r / hz, c = k < .6 ? S.mix([20, 5, 46], [74, 15, 92], k / .6) : S.mix([74, 15, 92], [255, 92, 138], (k - .6) / .4); x.fillStyle = S.rgb(c); x.fillRect(0, r, W, 1); }
    for (const s of st.stars) { if (s.y > .5) continue; x.fillStyle = `rgba(255,255,255,${.3 + .5 * (Math.sin(t * s.sp * 2 + s.p) > 0 ? 1 : .2)})`; x.fillRect(Math.floor(s.x * W), Math.floor(s.y * hz), 1, 1); }
    const sr = Math.round(H * .24), scx = Math.round(W / 2), scy = hz - Math.round(sr * .2);
    for (let r = -sr; r <= sr; r++) {
      const yy = scy + r; if (yy >= hz) break;
      const half = Math.floor(Math.sqrt(sr * sr - r * r)), k = (r + sr) / (2 * sr);
      if (k > .5) { const gap = Math.floor((k - .5) * 9); if (((yy + Math.floor(t * 5)) % 6) < gap) continue; }
      x.fillStyle = S.rgb(S.mix([255, 232, 100], [255, 60, 140], k)); x.fillRect(scx - half, yy, half * 2 + 1, 1);
    }
    for (let px = 0; px < W; px++) {
      const edge = Math.pow(Math.abs(px - W / 2) / (W / 2), .7);
      const mh = Math.round(H * .17 * edge * (Math.abs(Math.sin(px * .045 + 1)) * .7 + Math.abs(Math.sin(px * .11)) * .3));
      if (mh <= 0) continue;
      x.fillStyle = '#2a0b45'; x.fillRect(px, hz - mh, 1, mh); x.fillStyle = '#ff4fd8'; x.fillRect(px, hz - mh, 1, 1);
    }
    x.fillStyle = '#0b0220'; x.fillRect(0, hz, W, H - hz);
    const phase = (t * 1.3) % 1;
    for (let i = 0; i < 16; i++) { const zz = i + 1 - phase, yy = hz + Math.round((H - hz) * 1.1 / zz); if (yy >= H || yy <= hz) continue; x.fillStyle = `rgba(255,43,214,${Math.min(1, (yy - hz) / ((H - hz) * .3)) * .85})`; x.fillRect(0, yy, W, 1); }
    x.fillStyle = 'rgba(45,226,255,.7)';
    for (let j = -14; j <= 14; j++) for (let yy = hz + 1; yy < H; yy++) { const xx = W / 2 + j * 16 * (yy - hz) / (H - hz); if (xx >= 0 && xx < W) x.fillRect(Math.round(xx), yy, 1, 1); }
    for (let yy = hz + 1; yy < H; yy++) {
      const k = (yy - hz) / (H - hz), half = Math.round(2 + k * W * .2);
      x.fillStyle = '#140733'; x.fillRect(W / 2 - half, yy, half * 2, 1);
      x.fillStyle = '#2de2ff'; x.fillRect(W / 2 - half, yy, 1, 1); x.fillRect(W / 2 + half - 1, yy, 1, 1);
      const z = (H - hz) / (yy - hz + .5); if (Math.floor(z * 1.5 + t * 6) % 2 === 0) { x.fillStyle = '#ffe66b'; x.fillRect(W / 2, yy, 1, 1); }
    }
    const bounce = Math.sin(t * 9) > .6 ? 1 : 0, carY = H - 9 - Math.round(ins.b * .4) - bounce;
    x.fillStyle = 'rgba(255,32,80,.25)'; x.fillRect(W / 2 - 11, carY + 3, 22, 3);
    sprite(x, CAR, CARP, W / 2 - 9, carY);
    const str = clockStr(d); let s = 4; while (s > 1 && pw(str, s) > W * .6) s--;
    const ROWC = ['#e8fbff', '#9ff3ff', '#ffffff', '#ff9fe6', '#ff4fd8'];
    ptext(x, str, Math.round((W - pw(str, s)) / 2), Math.round(ins.t) + 2, s, r => ROWC[r], { o: '#1a0533' });
  }, '#ff9fe6');

  /* ---------- Pong (hours vs minutes) ---------- */
  const pong = scene(160, () => ({ bx: 80, by: 30, vx: 70, vy: 30, lp: 30, rp: 30 }), (x, W, H, t, dt, d, st, ins) => {
    x.fillStyle = '#08090a'; x.fillRect(0, 0, W, H);
    const top = Math.round(ins.t * .5), bot = H - Math.round(ins.b * .5);
    x.fillStyle = '#34383c'; for (let y = top; y < bot; y += 4) x.fillRect(W / 2, y, 1, 2);
    const tm = S.hm(d), sNow = d.getSeconds(), m = d.getMinutes();
    const L = tm.h.padStart(2, ' ').replace(' ', ';');
    ptext(x, L, Math.round(W / 4 - pw(L, 3) / 2), top + 4, 3, '#e8e8e8');
    ptext(x, tm.m, Math.round(W * 3 / 4 - pw(tm.m, 3) / 2), top + 4, 3, '#e8e8e8');
    const ph = Math.max(10, Math.round(H * .17)), lx = 6 + Math.round(ins.l * .3), rx = W - 8 - Math.round(ins.r * .3);
    const missL = sNow >= 57 && m !== 59, missR = sNow >= 57 && m === 59;
    const ai = (p, mine, miss) => { let target = mine ? st.by : (top + bot) / 2; if (miss && mine) target = st.by > (top + bot) / 2 ? top + ph / 2 : bot - ph / 2; const sp = 95 * dt; return p + S.clamp(target - p, -sp, sp); };
    st.lp = S.clamp(ai(st.lp, st.vx < 0, missL), top + ph / 2, bot - ph / 2);
    st.rp = S.clamp(ai(st.rp, st.vx > 0, missR), top + ph / 2, bot - ph / 2);
    st.bx += st.vx * dt; st.by += st.vy * dt;
    if (st.by < top) { st.by = top; st.vy = Math.abs(st.vy); } if (st.by > bot - 2) { st.by = bot - 2; st.vy = -Math.abs(st.vy); }
    if (st.vx < 0 && st.bx <= lx + 2 && st.bx >= lx - 1 && Math.abs(st.by - st.lp) <= ph / 2 + 1) { st.vx = Math.abs(st.vx); st.vy = S.clamp((st.by - st.lp) * 5 + (Math.random() - .5) * 10, -65, 65); }
    if (st.vx > 0 && st.bx >= rx - 2 && st.bx <= rx + 1 && Math.abs(st.by - st.rp) <= ph / 2 + 1) { st.vx = -Math.abs(st.vx); st.vy = S.clamp((st.by - st.rp) * 5 + (Math.random() - .5) * 10, -65, 65); }
    if (st.bx < -6 || st.bx > W + 6) { const toRight = st.bx < 0; st.bx = W / 2; st.by = (top + bot) / 2; st.vx = toRight ? 70 : -70; st.vy = (Math.random() - .5) * 60; }
    x.fillStyle = '#e8e8e8';
    x.fillRect(lx, Math.round(st.lp - ph / 2), 2, ph); x.fillRect(rx, Math.round(st.rp - ph / 2), 2, ph);
    x.fillRect(Math.round(st.bx), Math.round(st.by), 2, 2);
  }, '#e8e8e8');

  /* ---------- Campfire ---------- */
  const TENT = ['.....o.....', '....ooo....', '...ooooo...', '..oooDooo..', '.ooooDDooo.', 'oooooDDDooo'];
  const camp = scene(200, () => {
    const r = S.rng(21);
    return {
      parts: [], stars: Array.from({ length: 50 }, () => ({ x: r(), y: r() * .55, p: r() * 6 })),
      flies: Array.from({ length: 14 }, () => ({ x: r(), y: .55 + r() * .35, p: r() * 6 })),
      far: Array.from({ length: 26 }, (_, i) => ({ x: i / 25 + (r() - .5) * .03, h: .16 + r() * .12 })),
      near: [{ x: .04, h: .55 }, { x: .13, h: .42 }, { x: .9, h: .5 }, { x: .98, h: .62 }]
    };
  }, (x, W, H, t, dt, d, st, ins) => {
    const hf = S.hoursF(d), [top, bot] = S.skyAt(hf), night = S.nightAmt(hf), gy = H - Math.round(H * .2);
    bandSky(x, W, top, bot, 0, gy, 3);
    for (const s of st.stars) { x.fillStyle = `rgba(255,255,255,${night * (Math.sin(t * 1.5 + s.p) > -.2 ? .85 : .3)})`; x.fillRect(Math.floor(s.x * W), Math.floor(s.y * H), 1, 1); }
    if (night > .2) { disc(x, W * .82, H * .2, 5, '#f1ecdc'); disc(x, W * .82 + 2, H * .2 - 1, 4, S.rgb(S.mix(top, bot, .2))); }
    const pine = (cx, base, h, col) => { x.fillStyle = col; const tiers = 3, th = h / tiers; for (let r = 0; r < h; r++) { const inTier = r % Math.ceil(th), half = Math.floor(1 + inTier * .55 + r * .12); x.fillRect(Math.round(cx - half), Math.round(base - h + r), half * 2 + 1, 1); } x.fillRect(Math.round(cx), Math.round(base), 1, 2); };
    const farC = S.rgb(S.mix(bot, [6, 12, 14], .72));
    for (const p of st.far) pine(p.x * W, gy, Math.round(p.h * H), farC);
    x.fillStyle = '#0d140f'; x.fillRect(0, gy, W, H - gy);
    const fx = Math.round(W / 2), fy = gy + 7, flick = .8 + .2 * Math.sin(t * 11) * Math.sin(t * 7.7);
    const g = x.createRadialGradient(fx, fy - 4, 0, fx, fy - 4, 46); g.addColorStop(0, `rgba(255,150,60,${.4 * flick})`); g.addColorStop(1, 'rgba(255,120,40,0)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    sprite(x, TENT, { o: '#c8642e', D: '#3a1d12' }, fx - 42, gy + 1);
    for (const p of st.near) pine(p.x * W, H, Math.round(p.h * H), '#050b08');
    x.fillStyle = '#5a3520'; x.fillRect(fx - 6, fy, 12, 2); x.fillStyle = '#3d2415'; x.fillRect(fx - 4, fy - 1, 3, 3); x.fillRect(fx + 2, fy - 1, 3, 3);
    if (dt) for (let i = 0; i < 70 * dt; i++) st.parts.push({ x: fx + (Math.random() - .5) * 8, y: fy - 1, vx: (Math.random() - .5) * 4, vy: -(12 + Math.random() * 16), life: 0, max: .35 + Math.random() * .6, spark: Math.random() < .04 });
    st.parts = st.parts.filter(p => p.life < (p.spark ? 2.2 : p.max));
    for (const p of st.parts) {
      p.life += dt; p.x += p.vx * dt + Math.sin(t * 6 + p.y) * .1; p.y += p.vy * dt * (p.spark ? 1.6 : 1);
      const k = p.life / p.max;
      if (p.spark) { x.fillStyle = '#ffd27a'; x.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); continue; }
      x.fillStyle = k < .2 ? '#fff3b0' : k < .45 ? '#ffc23d' : k < .72 ? '#ff7a1f' : '#c2321c';
      const sz = k < .35 ? 2 : 1; x.fillRect(Math.round(p.x), Math.round(p.y), sz, sz);
    }
    for (const f of st.flies) {
      f.x += Math.sin(t * .7 + f.p) * dt * .03; f.y += Math.cos(t * .9 + f.p * 1.3) * dt * .02;
      f.x = (f.x + 1) % 1; f.y = S.clamp(f.y, .45, .95);
      const b = Math.sin(t * 2.2 + f.p * 3); if (b < .4) continue;
      const X = Math.round(f.x * W), Y = Math.round(f.y * H);
      x.fillStyle = `rgba(232,255,122,${(b - .4) * .5})`; x.fillRect(X - 1, Y, 3, 1); x.fillRect(X, Y - 1, 1, 3);
      x.fillStyle = '#efff9a'; x.fillRect(X, Y, 1, 1);
    }
    const str = clockStr(d); let s = 4; while (s > 1 && pw(str, s) > W * .5) s--;
    ptext(x, str, Math.round((W - pw(str, s)) / 2), Math.round(ins.t) + 3, s, '#ffe6c2', '#1d1410');
  }, '#ffe6c2');

  /* ---------- Aquarium ---------- */
  const FISH = ['f...oo..', 'ff.owoo.', 'fffowoko', 'ff.owoo.', 'f...oo..'];
  const FISHP = [{ o: '#ff8a3d', w: '#ffffff', k: '#111111', f: '#e0602a' }, { o: '#3d7bff', w: '#ffe14d', k: '#111111', f: '#2a55c0' }, { o: '#ff6fb5', w: '#ffd1e8', k: '#111111', f: '#d94f94' }];
  const CHEST = ['.bbbbbbb.', 'byyyyyyyb', 'bbbbybbbb', 'bcccyccb.', 'bcccccccb'];
  const tank = scene(180, () => {
    const r = S.rng(33);
    return {
      fish: Array.from({ length: 6 }, (_, i) => ({ x: r(), y: .35 + r() * .4, v: .05 + r() * .06, dir: r() < .5 ? 1 : -1, pal: FISHP[i % 3], p: r() * 6 })),
      bubbles: [], weeds: Array.from({ length: 9 }, () => ({ x: r(), h: .2 + r() * .35, p: r() * 6 })),
      specks: Array.from({ length: 60 }, () => ({ x: r(), y: r() })), school: { p: 0 }
    };
  }, (x, W, H, t, dt, d, st, ins) => {
    for (let r = 0; r < H; r++) { const k = Math.floor(r / 4) * 4 / H; x.fillStyle = S.rgb(S.mix([15, 76, 110], [7, 26, 44], k)); x.fillRect(0, r, W, 1); }
    for (let i = 0; i < 4; i++) { const rx = (i * W / 3 + t * 4) % (W + 40) - 20; x.fillStyle = 'rgba(180,240,255,.05)'; for (let r = 0; r < H * .8; r++) x.fillRect(Math.round(rx + r * .45 + Math.sin(t * .3 + i) * 4), r, 5, 1); }
    const sy = H - Math.round(H * .15);
    for (let px = 0; px < W; px++) { const yy = sy + Math.round(Math.sin(px * .12) * 1.2); x.fillStyle = '#c9a86a'; x.fillRect(px, yy, 1, H - yy); }
    x.fillStyle = '#a9864e'; for (const s of st.specks) x.fillRect(Math.floor(s.x * W), sy + 2 + Math.floor(s.y * (H - sy - 2)), 1, 1);
    for (const w of st.weeds) {
      const h = Math.round(w.h * H), bx = Math.round(w.x * W);
      for (let k = 0; k < h; k++) { const xx = bx + Math.round(Math.sin(t * 1.4 + k * .35 + w.p) * (k / h) * 3); x.fillStyle = k % 4 < 2 ? '#3f9a5c' : '#2f7a48'; x.fillRect(xx, sy - k, 2, 1); }
    }
    const cx = Math.round(W * .72);
    sprite(x, CHEST, { b: '#6b4423', y: '#e0b84a', c: '#4a2e17' }, cx, sy - 4);
    if (dt && Math.random() < dt * 1.5) st.bubbles.push({ x: cx + 4, y: sy - 5, r: 1, v: 12 + Math.random() * 8, p: Math.random() * 6 });
    if (dt && Math.random() < dt * 2.5) st.bubbles.push({ x: W * .12, y: sy - 1, r: Math.random() < .4 ? 2 : 1, v: 14 + Math.random() * 10, p: Math.random() * 6 });
    st.bubbles = st.bubbles.filter(b => b.y > -4);
    for (const b of st.bubbles) {
      b.y -= b.v * dt; const X = Math.round(b.x + Math.sin(t * 3 + b.p) * 1.2), Y = Math.round(b.y);
      x.fillStyle = 'rgba(205,239,255,.7)';
      if (b.r === 1) x.fillRect(X, Y, 2, 2); else { x.fillRect(X + 1, Y, 2, 1); x.fillRect(X + 1, Y + 3, 2, 1); x.fillRect(X, Y + 1, 1, 2); x.fillRect(X + 3, Y + 1, 1, 2); x.fillStyle = '#ffffff'; x.fillRect(X + 1, Y + 1, 1, 1); }
    }
    for (const f of st.fish) {
      f.x += f.dir * f.v * dt; if (f.x > .92) { f.x = .92; f.dir = -1; } if (f.x < .02) { f.x = .02; f.dir = 1; }
      const Y = f.y * H + Math.sin(t * 1.3 + f.p) * 2;
      sprite(x, FISH, f.pal, f.x * W, Math.min(Y, sy - 7), f.dir < 0);
    }
    st.school.p += dt * .25;
    const scx = W * (.5 + .32 * Math.sin(st.school.p)), scy = H * (.45 + .12 * Math.sin(st.school.p * 1.7)), sdir = Math.cos(st.school.p) >= 0 ? 1 : -1;
    for (let i = 0; i < 8; i++) { const ox = ((i * 37) % 13) - 6, oy = ((i * 23) % 9) - 4; const X = Math.round(scx + ox + Math.sin(t * 3 + i) * .6), Y = Math.round(scy + oy); x.fillStyle = '#5ff0ff'; x.fillRect(X, Y, 2, 1); x.fillStyle = '#ff4a6a'; x.fillRect(X - sdir, Y, 1, 1); }
    const str = clockStr(d); let s = 3; while (s > 1 && pw(str, s) > W * .5) s--;
    let px = Math.round((W - pw(str, s)) / 2); let i = 0;
    for (const ch of str) { ptext(x, ch, px, Math.round(ins.t) + 3 + Math.round(Math.sin(t * 2 + i) * 1), s, '#d9f6ff', '#0a2a40'); px += (narrow(ch) ? 2 : 4) * s; i++; }
  }, '#d9f6ff');

  S.theme('pixel', 'Pixel', [
    { id: 'room', name: 'Rainy room', make: room },
    { id: 'drive', name: 'Night drive', make: drive },
    { id: 'pong', name: 'Pong', make: pong },
    { id: 'camp', name: 'Campfire', make: camp },
    { id: 'tank', name: 'Aquarium', make: tank },
  ]);
})();
