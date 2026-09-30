# App icon sets

Four complete icon sets from the September 2026 icon poll (winner: **B**, active in
`public/` and `src/app/`). Each folder contains every file the app references, under
standard filenames, plus `source.svg` (the editable design source).

| Folder | Poll option | Design |
| --- | --- | --- |
| `a-fullbleed` | A | Full-bleed leather ball, wordmark wrapped around the belly |
| `b-neon` | B | Neon outline ball, double end-stripes, ASWNN below (current) |
| `c-inball` | C | Neon outline ball, ASWNN glowing inside |
| `d-wildcard` | D | Leather ball + neon rim, wrapped glowing wordmark |

## Switching

```bash
cd apps/web
./scripts/switch-icon.sh c   # or a | b | d
```

Then restart the dev server (or redeploy). On an iPhone: delete the app from the
home screen and re-add it — iOS caches home-screen icons aggressively.

## Regenerating sizes

Sizes are rendered from `source.svg` with librsvg:

```bash
rsvg-convert -w 512 -h 512 source.svg -o icon-512x512.png
```

`favicon.ico` is generated from the 256px render with Pillow
(`img.save("favicon.ico", sizes=[(16,16),(32,32),(48,48)])`).

## Notes

- No `purpose: "maskable"` manifest entry on purpose — these designs put text near
  the bottom edge and would crop badly under Android's mask. Add a dedicated
  maskable variant before ever setting that purpose.
- `src/app/apple-icon.png` and `src/app/favicon.ico` (Next.js file conventions) are
  overwritten by the switch script too, so they never drift from `public/`.
