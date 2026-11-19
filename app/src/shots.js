// Fixed scenes for screenshots: ?shot=cover shows the exported 9-panel cover
// alone; ?shot=editor the editor with a photo loaded; ?shot=cover4 the
// 4-panel preset; ?shot=portrait the 1080x1350 export shape.
// Query params: layout, grade, caption, style, pos, intensity.
import { HERO } from './cover.js';

export function runShot(shot, query, state, images, done) {
  if (shot === 'cover' || shot === 'portrait' || shot === 'cover4') {
    document.body.classList.add('shot-cover');
    if (shot === 'portrait') {
      const c = document.getElementById('cover');
      c.width = 1080; c.height = 1350;
    }
  }
  state.layout = query.get('layout') || (shot === 'cover4' ? '4' : '9');
  state.grade = query.get('grade') || 'sunset';
  state.caption = query.get('caption') || 'VICE SUNSET';
  state.captionStyle = query.get('style') || 'block';
  state.captionPos = query.get('pos') || 'bottom';
  if (query.get('intensity')) state.intensity = Number(query.get('intensity'));
  state.selected = HERO[state.layout];
  if (shot === 'cover4') {
    // 4-panel variant: hero bottom-right, motifs in the other three slots.
    state.panels[0] = { src: 'boulevard', zoom: 1.6, ox: -0.6, oy: 0.5 };
    state.panels[1] = { src: 'motif:palms', zoom: 1, ox: 0, oy: 0 };
    state.panels[2] = { src: 'pier', zoom: 1.5, ox: 0.5, oy: 0.3 };
    state.panels[3] = { src: 'boulevard', zoom: 1.1, ox: 0, oy: 0.05 };
  }
  done();
}
