# Working on MyWorld

Read [README.md](README.md) for the game and [docs/ART_GUIDE.md](docs/ART_GUIDE.md) before changing visuals. The approved visual target is the **running Style B preview** in `art-preview/`, especially its traveler, dog, cottage and oak PNGs. The user explicitly approved that playable result.

## Visual requirements

- Render actual pixel-art PNG assets through `WorldArt` in `art.js`. Do not replace finished characters, animals, trees or buildings with approximate canvas rectangles, emoji, CSS shapes or a concept picture used as the whole background.
- Preserve the four approved original assets. New characters and landmarks should match their outlines, shading, proportions, perspective and light direction at gameplay size.
- The same source art must appear in the world and portraits. Use the common foot anchor and depth sorting. Animation must honor reduced motion.
- Keep image paths, sheet grids and bounds in the art pipeline; do not scatter magic crop rectangles through game code. Run `node prepare-art.cjs` after adding/changing PNGs, and inspect the resulting cells in a browser.
- Keep the game and standalone/Pages exports working. `bundle.cjs` embeds every PNG; `build-pages.cjs` copies the manifest's PNG allowlist.
- Preserve the save key and existing character, inventory, companion and quest data. Any changed obstacle footprint must leave saved characters on reachable ground.
- Do not publish or deploy unless requested. The existing GitHub Pages workflow is manual.

## Run and verify

No runtime packages are required. Run `node serve.cjs` and open `http://127.0.0.1:4173/`. Python's `python3 -m http.server 4173 --bind 127.0.0.1` is an alternative.

For code/art integration changes, run `node art-check.cjs`, `node smoke-check.cjs`, `node access-check.cjs`, `node build-pages.cjs`, and `node bundle.cjs`. Syntax-check changed JavaScript. See the art guide for required browser checks; headless logic checks cannot prove visual quality. Inspect desktop and phone screenshots before claiming a visual task is complete.

Keep the approved workshop preview available for comparisons. Work incrementally on new art; compare the actual running result, not only generated PNGs. Record generation prompts and any remaining visual limitations in the art documentation.
