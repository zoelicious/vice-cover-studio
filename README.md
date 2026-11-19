# Vice Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/zoelicious/vice-cover-studio/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/zoelicious/vice-cover-studio/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

A fully offline web app that turns your photos into a multi-panel sunset
poster cover, then exports it as PNG.

## What it does

- **Real multi-panel grid** — presets for 9-panel (3×3, centre panel is the
  hero), 4-panel, 6-panel and single-hero. Every panel takes its own photo,
  with per-panel crop, zoom and pan (drag on the cover, or use the sliders).
- **Sunset colour grades** — Sunset, Neon Night and Golden Hour, painted over
  every panel with an intensity slider. Not a flat tint: warm highlights,
  magenta shadows, per-panel.
- **Caption lettering** — bold condensed type with four styles (block white,
  outline, neon glow, banner), movable (top / centre / bottom) and sized to
  the hero panel, on a solid band so it stays readable.
- **Hand-drawn motifs** — panels without a photo are filled with motifs drawn
  on canvas (skyline silhouette, palms, sunset sea, waves).
- **One-click export** — PNG at 1080×1080, 1080×1350 and 1920×1080, all three
  at once or one at a time.
- **Offline by design** — photos are read locally and never uploaded; the app
  makes no network requests. The two bundled sample photos were made for
  this project and are free to use.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## Fonts

- Archivo Black (SIL Open Font License 1.1) — `app/fonts/OFL-ArchivoBlack.txt`
- Oswald SemiBold (SIL Open Font License 1.1) — `app/fonts/OFL-Oswald.txt`

Both are vendored under `app/fonts/`.

## Hand-in

`node main.ts` copies `app/` and `screenshots/` to `/output` and writes
`/output/dossier.json` (see `vendor/makefun-app.ts`, copied unchanged from
the competition kit).
