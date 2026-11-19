// Vice Cover Studio — editor wiring: controls, per-panel drag, exports.
// Photos are read locally with FileReader / object URLs and never uploaded.
import { defaultState, renderCover, LAYOUTS, HERO, panelRects } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const state = defaultState();
const images = {}; // key -> HTMLImageElement (sample photos + user uploads)
let userPhotoCount = 0;

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSamples() {
  images.boulevard = await loadImage('samples/boulevard.jpg');
  images.pier = await loadImage('samples/pier.jpg');
}

function redraw() {
  renderCover(ctx, canvas.width, canvas.height, state, images, { highlight: true });
  syncPanelControls();
}

function setStatus(msg) { statusEl.textContent = msg; }

// --- controls ---------------------------------------------------------------

const $ = (id) => document.getElementById(id);

function bindGroup(id, fn) {
  document.querySelectorAll(`#${id} button`).forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll(`#${id} button`).forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      fn(b.dataset.value);
    });
  });
}

bindGroup('layoutBtns', (v) => { state.layout = v; state.selected = HERO[v]; redraw(); });
bindGroup('gradeBtns', (v) => { state.grade = v; redraw(); });
bindGroup('styleBtns', (v) => { state.captionStyle = v; redraw(); });
bindGroup('posBtns', (v) => { state.captionPos = v; redraw(); });

$('intensity').addEventListener('input', (e) => {
  state.intensity = Number(e.target.value);
  $('intensityVal').textContent = `${Math.round(state.intensity * 100)}%`;
  redraw();
});
$('caption').addEventListener('input', (e) => { state.caption = e.target.value; redraw(); });
$('capSize').addEventListener('input', (e) => {
  state.captionSize = Number(e.target.value);
  $('capSizeVal').textContent = `${Math.round(state.captionSize * 100)}%`;
  redraw();
});

// --- per-panel controls -----------------------------------------------------

function panel() { return state.panels[state.selected]; }

function syncPanelControls() {
  const p = panel();
  $('panelLabel').textContent = `Panel ${state.selected + 1} of ${panelRects(1080, 1080, state.layout, 6).length}${state.selected === HERO[state.layout] ? ' — hero (caption lives here)' : ''}`;
  document.querySelectorAll('#photoBtns button').forEach((b) => {
    b.classList.toggle('active', b.dataset.value === (p.src || ''));
  });
  $('zoom').value = p.zoom || 1;
  $('zoomVal').textContent = `${Math.round((p.zoom || 1) * 100)}%`;
  $('panX').value = p.ox || 0;
  $('panY').value = p.oy || 0;
}

bindGroup('photoBtns', (v) => { panel().src = v || null; redraw(); });
$('zoom').addEventListener('input', (e) => { panel().zoom = Number(e.target.value); redraw(); });
$('panX').addEventListener('input', (e) => { panel().ox = Number(e.target.value); redraw(); });
$('panY').addEventListener('input', (e) => { panel().oy = Number(e.target.value); redraw(); });

// Click a panel in the preview to select it; drag to pan its crop.
let drag = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (canvas.width / r.width),
    y: (e.clientY - r.top) * (canvas.height / r.height),
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const pt = canvasPoint(e);
  const rects = panelRects(canvas.width, canvas.height, state.layout, Math.max(3, Math.round(canvas.width * 0.006)));
  const k = rects.findIndex((r) => pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h);
  if (k < 0) return;
  state.selected = k;
  canvas.setPointerCapture(e.pointerId);
  drag = { x: pt.x, y: pt.y, ox: panel().ox || 0, oy: panel().oy || 0, rect: rects[k] };
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const pt = canvasPoint(e);
  const p = panel();
  const spanX = Math.max(1, (drag.rect.w * 2));
  const spanY = Math.max(1, (drag.rect.h * 2));
  p.ox = Math.max(-1, Math.min(1, drag.ox + ((pt.x - drag.x) / spanX) * 2));
  p.oy = Math.max(-1, Math.min(1, drag.oy + ((pt.y - drag.y) / spanY) * 2));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

// --- user photos ------------------------------------------------------------

$('photoFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  userPhotoCount += 1;
  const key = `user${userPhotoCount}`;
  images[key] = await loadImage(URL.createObjectURL(file));
  panel().src = key;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.dataset.value = key;
  btn.textContent = file.name.length > 18 ? file.name.slice(0, 17) + '…' : file.name;
  btn.addEventListener('click', () => {
    document.querySelectorAll('#photoBtns button').forEach((x) => x.classList.remove('active'));
    btn.classList.add('active');
    panel().src = key;
    redraw();
  });
  $('photoBtns').appendChild(btn);
  setStatus(`Loaded “${file.name}” into panel ${state.selected + 1}. It stays on this device.`);
  redraw();
  e.target.value = '';
});

// --- export -----------------------------------------------------------------

function renderOffscreen(W, H) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  renderCover(c.getContext('2d'), W, H, state, images, {});
  return c;
}

function download(canvasEl, name) {
  canvasEl.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

const SIZES = [
  { w: 1080, h: 1080, name: 'cover-1080x1080.png' },
  { w: 1080, h: 1350, name: 'cover-1080x1350.png' },
  { w: 1920, h: 1080, name: 'cover-1920x1080.png' },
];

document.querySelectorAll('[data-export]').forEach((b) => {
  b.addEventListener('click', () => {
    const s = SIZES[Number(b.dataset.export)];
    download(renderOffscreen(s.w, s.h), s.name);
    setStatus(`Saved ${s.name}`);
  });
});
$('exportAll').addEventListener('click', () => {
  SIZES.forEach((s, i) => setTimeout(() => download(renderOffscreen(s.w, s.h), s.name), i * 350));
  setStatus('Saved all 3 sizes: 1080×1080, 1080×1350, 1920×1080.');
});

// --- boot -------------------------------------------------------------------

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  loadSamples().then(async () => {
    try { await document.fonts.load('40px "Archivo Black"'); await document.fonts.ready; } catch (_) {}
    runShot(shot, new URLSearchParams(location.search), state, images, () => {
      renderCover(ctx, canvas.width, canvas.height, state, images, {});
      requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
    });
  });
} else {
  loadSamples().then(() => {
    document.fonts.ready.then(() => redraw());
    redraw();
  });
}
