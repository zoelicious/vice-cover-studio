// Vice Cover Studio — render engine.
// Draws a multi-panel sunset poster cover onto any 2D canvas context.
// All art is either a local photo the user picked (or one of the two bundled
// sample photos) or a motif drawn here by hand on canvas. No network, no
// upload: every pixel is produced locally.

export const LAYOUTS = {
  '9': { cols: 3, rows: 3, label: '9-panel classic' },
  '4': { cols: 2, rows: 2, label: '4-panel' },
  '6': { cols: 3, rows: 2, label: '6-panel' },
  '1': { cols: 1, rows: 1, label: 'Single hero' },
};

// Which panel carries the caption for each layout.
export const HERO = { '9': 4, '4': 3, '6': 4, '1': 0 };

export const GRADES = {
  sunset: { label: 'Sunset', hint: 'pink, orange, violet' },
  neon: { label: 'Neon Night', hint: 'magenta, deep blue, teal' },
  golden: { label: 'Golden Hour', hint: 'warm amber, soft gold' },
};

export const MOTIFS = {
  skyline: 'Skyline',
  palms: 'Palms',
  sunset: 'Sunset sea',
  waves: 'Waves',
};

// ---------------------------------------------------------------------------
// State

export function defaultState() {
  // Nine different crops of the same two photos, plus hand-drawn motifs,
  // so the grid reads as a collage, not one photo repeated nine times.
  // ox/oy shift the crop inside the panel (-1..1); zoom magnifies it.
  const panels = [
    { src: 'pier', zoom: 2.0, ox: 1.0, oy: -0.35 },      // wooden railing + turquoise sea
    { src: 'motif:waves', zoom: 1, ox: 0, oy: 0 },        // drawn waves + sun
    { src: 'motif:skyline', zoom: 1, ox: 0, oy: 0 },     // drawn skyline
    { src: 'pier', zoom: 1.5, ox: -0.7, oy: 0.35 },      // smiling angler + turquoise sea
    { src: 'boulevard', zoom: 1.12, ox: 0.05, oy: 0.05 },// HERO: woman + convertible
    { src: 'pier', zoom: 1.8, ox: -0.8, oy: -0.7 },      // rod + reel + hand
    { src: 'motif:palms', zoom: 1, ox: 0, oy: 0 },       // drawn palms
    { src: 'boulevard', zoom: 2.0, ox: -0.5, oy: -0.9 }, // red convertible detail
    { src: 'motif:sunset', zoom: 1, ox: 0, oy: 0 },      // drawn sunset sea
  ];
  return {
    layout: '9',
    grade: 'sunset',
    intensity: 0.85,
    caption: 'VICE SUNSET',
    captionStyle: 'block', // block | outline | neon | banner
    captionSize: 1,
    captionPos: 'bottom', // top | center | bottom
    panels,
    selected: 4,
  };
}

// ---------------------------------------------------------------------------
// Small deterministic RNG so motif skylines are stable between renders.

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Hand-drawn motifs (canvas only, no image assets).

function drawMotif(ctx, x, y, w, h, kind, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  if (grade === 'neon') {
    sky.addColorStop(0, '#2a0a4a'); sky.addColorStop(0.55, '#c2188b'); sky.addColorStop(1, '#0a1030');
  } else if (grade === 'golden') {
    sky.addColorStop(0, '#ffd98a'); sky.addColorStop(0.55, '#ff9a3d'); sky.addColorStop(1, '#b34a2e');
  } else {
    sky.addColorStop(0, '#ff9e5e'); sky.addColorStop(0.5, '#ff5e8a'); sky.addColorStop(1, '#7a2d8f');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);

  const sunX = x + w * 0.68, sunY = y + h * 0.38, sunR = w * 0.17;
  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 3.2);
  glow.addColorStop(0, 'rgba(255, 240, 180, 0.95)');
  glow.addColorStop(0.35, 'rgba(255, 170, 90, 0.45)');
  glow.addColorStop(1, 'rgba(255, 120, 120, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2); ctx.fill();

  if (kind === 'skyline') {
    const rnd = rng(41);
    const base = y + h * 0.78;
    ctx.fillStyle = '#2a0f3d';
    let bx = x;
    while (bx < x + w) {
      const bw = w * (0.09 + rnd() * 0.12);
      const bh = h * (0.22 + rnd() * 0.4);
      ctx.fillRect(bx, base - bh, bw, bh);
      // lit windows
      ctx.fillStyle = 'rgba(255, 214, 130, 0.9)';
      for (let wy = base - bh + 6; wy < base - 6; wy += 9) {
        for (let wx = bx + 4; wx < bx + bw - 4; wx += 8) {
          if (rnd() > 0.55) ctx.fillRect(wx, wy, 3, 4);
        }
      }
      ctx.fillStyle = '#2a0f3d';
      bx += bw + 2;
    }
    // water reflection
    const sea = ctx.createLinearGradient(0, base, 0, y + h);
    sea.addColorStop(0, '#5b1e6e'); sea.addColorStop(1, '#1c0b33');
    ctx.fillStyle = sea;
    ctx.fillRect(x, base, w, y + h - base);
    ctx.strokeStyle = 'rgba(255, 190, 120, 0.5)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const yy = base + 6 + i * ((y + h - base - 8) / 5);
      ctx.beginPath();
      ctx.moveTo(x + w * 0.3, yy);
      ctx.lineTo(x + w * 0.7, yy);
      ctx.stroke();
    }
  } else if (kind === 'palms') {
    drawPalm(ctx, x + w * 0.24, y + h, w * 0.42, h * 0.72, -0.5);
    drawPalm(ctx, x + w * 0.82, y + h, w * 0.36, h * 0.6, 0.45);
    ctx.fillStyle = '#2a0f3d';
    ctx.fillRect(x, y + h * 0.94, w, h * 0.06);
  } else if (kind === 'sunset') {
    const sea = ctx.createLinearGradient(0, y + h * 0.62, 0, y + h);
    sea.addColorStop(0, '#c94b8a'); sea.addColorStop(1, '#2a0f3d');
    ctx.fillStyle = sea;
    ctx.fillRect(x, y + h * 0.62, w, h * 0.38);
    ctx.strokeStyle = 'rgba(255, 230, 170, 0.65)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const yy = y + h * 0.66 + i * h * 0.055;
      const ww = w * (0.12 + i * 0.05);
      ctx.beginPath();
      ctx.moveTo(sunX - ww / 2, yy);
      ctx.lineTo(sunX + ww / 2, yy);
      ctx.stroke();
    }
    drawPalm(ctx, x + w * 0.14, y + h * 0.66, w * 0.2, h * 0.34, -0.4);
  } else { // waves
    const sea = ctx.createLinearGradient(0, y + h * 0.3, 0, y + h);
    sea.addColorStop(0, '#19b8c9'); sea.addColorStop(0.6, '#0e6f9e'); sea.addColorStop(1, '#0a2a5e');
    ctx.fillStyle = sea;
    ctx.fillRect(x, y + h * 0.3, w, h * 0.7);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2.5;
    for (let row = 0; row < 4; row++) {
      const yy = y + h * (0.42 + row * 0.14);
      ctx.beginPath();
      for (let px = x; px <= x + w; px += 8) {
        const py = yy + Math.sin((px / w) * Math.PI * 2 + row * 1.7) * 5;
        if (px === x) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255, 244, 200, 0.9)';
    ctx.beginPath(); ctx.arc(sunX, y + h * 0.2, sunR * 0.7, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawPalm(ctx, baseX, baseY, w, h, lean) {
  ctx.save();
  ctx.strokeStyle = '#241031';
  ctx.lineWidth = Math.max(4, w * 0.11);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + w * lean * 0.5, baseY - h * 0.6, baseX + w * lean, baseY - h);
  ctx.stroke();
  const topX = baseX + w * lean, topY = baseY - h;
  ctx.fillStyle = '#241031';
  // Drooping fronds: wide curved blades, not thin spikes.
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * 0.92 + (i / 8) * Math.PI * 1.3;
    const len = w * (0.85 + (i % 3) * 0.18);
    const tipX = topX + Math.cos(a) * len;
    const tipY = topY + Math.sin(a) * len * 0.45 + len * 0.5;
    const midX = topX + Math.cos(a) * len * 0.55;
    const midY = topY + Math.sin(a) * len * 0.35 + len * 0.08;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.quadraticCurveTo(midX + Math.cos(a + 0.5) * len * 0.12, midY + len * 0.1, topX, topY);
    ctx.fill();
  }
  // Coconut cluster at the crown.
  ctx.beginPath(); ctx.arc(topX - 3, topY + 5, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(topX + 4, topY + 6, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Colour grade, applied over a finished panel (photo or motif).

function gradeOverlay(ctx, x, y, w, h, grade, intensity) {
  const i = Math.max(0, Math.min(1, intensity));
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  if (grade === 'neon') {
    g.addColorStop(0, `rgba(255, 0, 170, ${0.22 * i})`);
    g.addColorStop(0.55, `rgba(90, 20, 160, ${0.10 * i})`);
    g.addColorStop(1, `rgba(0, 30, 90, ${0.34 * i})`);
  } else if (grade === 'golden') {
    g.addColorStop(0, `rgba(255, 200, 90, ${0.20 * i})`);
    g.addColorStop(0.6, `rgba(255, 140, 50, ${0.12 * i})`);
    g.addColorStop(1, `rgba(160, 60, 20, ${0.22 * i})`);
  } else { // sunset
    g.addColorStop(0, `rgba(255, 170, 90, ${0.22 * i})`);
    g.addColorStop(0.5, `rgba(255, 90, 140, ${0.22 * i})`);
    g.addColorStop(1, `rgba(120, 40, 160, ${0.36 * i})`);
  }
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  // Soft-light wash: pushes even a bright daylight sky toward the grade
  // instead of leaving it untouched blue under a sunset caption.
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = grade === 'neon' ? 'rgba(255, 0, 200, 0.55)' : 'rgba(255, 110, 60, 0.5)';
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  // Warm highlight in the top corner, cool shadow at the foot.
  const warm = ctx.createRadialGradient(x + w * 0.2, y + h * 0.1, 0, x + w * 0.2, y + h * 0.1, w * 0.9);
  warm.addColorStop(0, `rgba(255, 190, 110, ${0.14 * i})`);
  warm.addColorStop(1, 'rgba(255, 190, 110, 0)');
  ctx.fillStyle = warm;
  ctx.fillRect(x, y, w, h);
}

// ---------------------------------------------------------------------------
// Panel geometry

export function panelRects(W, H, layout, gutter) {
  const { cols, rows } = LAYOUTS[layout];
  const n = cols * rows;
  const pw = (W - gutter * (cols + 1)) / cols;
  const ph = (H - gutter * (rows + 1)) / rows;
  const rects = [];
  for (let k = 0; k < n; k++) {
    const c = k % cols, r = Math.floor(k / cols);
    rects.push({
      x: gutter + c * (pw + gutter),
      y: gutter + r * (ph + gutter),
      w: pw, h: ph,
    });
  }
  return rects;
}

// ---------------------------------------------------------------------------
// Caption

function drawCaption(ctx, rect, state) {
  const text = (state.caption || '').trim().toUpperCase();
  if (!text) return;
  const { w, h, x, y } = rect;
  let size = Math.min(w * 0.24, h * 0.34) * state.captionSize;
  ctx.save();
  ctx.font = `${size}px "Archivo Black", sans-serif`;
  // Shrink until it fits 88% of the panel width.
  while (size > 10 && ctx.measureText(text).width > w * 0.88) {
    size -= 2;
    ctx.font = `${size}px "Archivo Black", sans-serif`;
  }
  const bandH = size * 1.9;
  let bandY;
  if (state.captionPos === 'top') bandY = y + h * 0.04;
  else if (state.captionPos === 'center') bandY = y + (h - bandH) / 2;
  else bandY = y + h - bandH - h * 0.04;
  const cx = x + w / 2;
  const cy = bandY + bandH / 2 + size * 0.36;

  if (state.captionStyle === 'banner') {
    const bg = ctx.createLinearGradient(x, bandY, x + w, bandY);
    bg.addColorStop(0, '#ff5e3a'); bg.addColorStop(0.5, '#ff2e88'); bg.addColorStop(1, '#8a2be2');
    ctx.fillStyle = bg;
    ctx.fillRect(x, bandY, w, bandH);
  } else {
    ctx.fillStyle = 'rgba(16, 6, 28, 0.88)';
    ctx.fillRect(x, bandY, w, bandH);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Slight horizontal condense for a poster lockup.
  ctx.translate(cx, cy);
  ctx.scale(0.92, 1);
  ctx.translate(-cx, -cy);
  if (state.captionStyle === 'outline') {
    ctx.lineWidth = Math.max(2, size * 0.16);
    ctx.strokeStyle = '#111';
    ctx.strokeText(text, cx, cy);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, cx, cy);
  } else if (state.captionStyle === 'neon') {
    ctx.shadowColor = '#ff2ec4';
    ctx.shadowBlur = size * 0.45;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, cx, cy);
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = size * 0.25;
    ctx.fillText(text, cx, cy);
    ctx.shadowBlur = 0;
  } else { // block
    ctx.lineWidth = Math.max(2, size * 0.1);
    ctx.strokeStyle = '#111';
    ctx.lineJoin = 'round';
    ctx.strokeText(text, cx, cy);
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.06;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, cx, cy);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Full cover render. `images` maps photo keys ('boulevard', 'pier', custom
// data-URL keys) to loaded HTMLImageElements. `opts.highlight` draws the
// selected-panel outline (editor preview only, never in exports).

export function renderCover(ctx, W, H, state, images, opts = {}) {
  const gutter = Math.max(3, Math.round(W * 0.006));
  ctx.fillStyle = '#170a24'; // poster backing: deep plum, visible only as gutter
  ctx.fillRect(0, 0, W, H);
  const rects = panelRects(W, H, state.layout, gutter);
  const hero = HERO[state.layout];

  rects.forEach((r, k) => {
    const p = state.panels[k] || { src: null, zoom: 1, ox: 0, oy: 0 };
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();

    if (p.src && p.src.startsWith('motif:')) {
      drawMotif(ctx, r.x, r.y, r.w, r.h, p.src.slice(6), state.grade);
    } else if (p.src && images[p.src]) {
      const img = images[p.src];
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const base = Math.max(r.w / iw, r.h / ih);
      const s = base * (p.zoom || 1);
      const dw = iw * s, dh = ih * s;
      const dx = r.x + (r.w - dw) / 2 + (p.ox || 0) * ((dw - r.w) / 2);
      const dy = r.y + (r.h - dh) / 2 + (p.oy || 0) * ((dh - r.h) / 2);
      ctx.filter = state.grade === 'neon'
        ? 'saturate(1.3) contrast(1.1) brightness(0.95)'
        : 'saturate(1.28) contrast(1.07) brightness(1.02)';
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.filter = 'none';
    } else {
      // Empty panel: fall back to a drawn sunset motif, never blank grey.
      drawMotif(ctx, r.x, r.y, r.w, r.h, 'sunset', state.grade);
    }
    gradeOverlay(ctx, r.x, r.y, r.w, r.h, state.grade, state.intensity);
    // Thin inner edge so panels stay distinct even where photos are dark.
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    ctx.restore();

    if (k === hero) drawCaption(ctx, r, state);
    if (opts.highlight && k === state.selected) {
      ctx.save();
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = Math.max(3, W * 0.005);
      ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
      ctx.restore();
    }
  });
}
