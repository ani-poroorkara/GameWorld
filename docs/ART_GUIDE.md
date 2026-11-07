# Building MyWorld in the approved Style B

## The decision to preserve

The user chose the middle **B — Rich detail** concept, rejected the first approximation made from procedural canvas shapes, then approved the playable scene at `/art-preview/`. That running preview is the visual reference. Its actual PNG sprites—not a verbal description alone—define the target.

The four original approved assets are preserved byte for byte in both `art-preview/assets/` and `assets/art/`: the male traveler, tan companion dog, timber cottage and oak. Keep the workshop available so future work can be compared with the same benchmark.

Do not claim that a PNG concept has been implemented when the game uses a simplified substitute. Show the actual browser rendering at gameplay size, in motion, before judging a visual change complete.

## Style rules

Use visible pixel clusters, stepped contours, warm brown outlines and approximately five useful shade values per material. Favor olive and sage greens, ochre highlights, warm cream plaster, chestnut leather, terracotta tile and weathered stone. Light comes from the upper left. Forest, autumn and frost palettes can shift foliage and ground while preserving contrast and material identity.

The camera is an orthographic RPG view from slightly above, showing the front of characters and buildings plus some top surfaces. Do not mix isometric diamonds, realistic side-view animals, smooth painterly foliage and chunky low-detail people. Keep a clear silhouette and readable eyes, belt, boots, ears and paws. Fine texture must support a larger shaded form.

The traveler wears a green tunic/scarf, brown boots and trousers, a brass-buckled leather belt and small backpack. Buildings have articulated roof tiles, timber framing, recessed windows/doors and stone foundations. Trees use layered leaf masses with connected branches and a rooted trunk. Animals have species-specific silhouettes and anatomy.

Ground, tiny foliage, shadows, fire/glow effects and simple fence connections may be drawn in code. Large recognizable subjects use sprites. Texture should not turn into a high-contrast repeated checkerboard.

## Runtime map

| File or directory | Responsibility |
| --- | --- |
| `assets/art/*.png` | Versioned source artwork, including animation sheets and atlases |
| `prepare-art.cjs` | PNG reader and source/grid registry; computes transparent frame bounds without rewriting artwork |
| `art-manifest.js` | Generated source dimensions, layouts and frame bounds |
| `art.js` | Asset loading, shared renderer, portrait SVG wrappers, ground textures and draw caches |
| `game.js` | Camera, depth-sorted world layers, terrain, landmarks, player animation and shared building collision |
| `world-life.js` | Villager/animal art selection, character selection and village/gameplay UI |
| `encounters.js` | Enemy world sprites and portraits |
| `art-preview/` | The separate, approved playable reference scene |
| `docs/ART_PROMPTS.md` | Prompts and references used for the shipped asset set |
| `art-check.cjs` | Source/grid/bounds validation and preservation of approved reference PNGs |
| `build-pages.cjs` | Runtime files plus the manifest's PNG allowlist in `dist/` |
| `bundle.cjs` | Truly standalone `MyWorld.html`, with all PNGs embedded as data URLs |

Browser scripts load in this order: manifest, renderer, access gate, village/UI, encounters, game. Do not move `art.js` after the consumers. The game waits for assets before drawing the play screen and reports loading failures instead of silently showing simplified replacement art.

## Sprite-sheet contract

Travelers, animal companions, guardians and thieves use **three columns by four rows**. Rows, in order, face front/down, left, right, and back/up. Columns show left step, standing idle, and right step. All twelve full-body poses must be isolated in their own equal cells with transparent margins and a consistent scale. The standing frame is column 1 using zero-based indices.

`WorldArt.frame(row, walking, time)` selects `row * 3 + column`. Walking cycles through columns 0, 1, 2, 1. Reduced motion selects the idle column. Frame bounds trim empty source padding, while normalization uses the largest frame height in the sheet to avoid resizing a character with each step.

The renderer anchors sprites at the **bottom center of their feet/foundation/roots**. Supply `(x, y)` as a ground point and a height in display pixels:

```js
WorldArt.draw(ctx, 'traveler-male', WorldArt.frame(motion.row, walking, animationTime()), footX, footY, tileSize * 1.32, { normalize: true });
```

Use `normalize: true` for frames of the same animated subject. Use the individual frame's height for unrelated buildings or NPCs in one atlas. Never normalize six different buildings to a shared tallest-frame scale by accident.

Typical heights are about 1.32 tiles for a traveler, 1.3 for a villager, 0.6–1.2 for animals, 3.6–3.9 for houses/shops, 4.1 for a village oak, 2.9 for dense wilderness trees, and 3.5 for a ruin. These values are starting points, not an excuse to skip a side-by-side visual check.

### Static atlas mapping

| Source | Grid | Frame order, left to right, then next row |
| --- | --- | --- |
| `npcs.png` | 3 × 2 | Mara, Oren, Sage; Elin, Tess, Luca |
| `buildings.png` | 3 × 2 | Bakery, card shop, inn; moss chapel, archive, watchtower |
| `landmarks.png` | 3 × 2 + named crop region | Gate, camp, farm; fence, mountain, woodland boulder; cropped bed without the scarecrow |
| `seasonal-trees.png` | 2 × 1 | Autumn oak, frost oak |
| `cottage.png`, `oak.png` | 1 × 1 | The approved complete asset |

All other registered sources are directional 3 × 4 sheets. The farm source also exposes `ART_MANIFEST.sources.landmarks.parts.crops`: a named region of the crop bed used for repeating plants without repeating the scarecrow. Its bounds are defined beside the source grid in `prepare-art.cjs`.

## Adding or replacing art

1. Inspect the appropriate approved PNG and the running preview. Choose a clear subject, intended gameplay size, and grid before generating anything.
2. Use the imagegen skill's built-in tool for new raster artwork or edits. Pass the approved source as a style reference, request true alpha transparency and specify the exact grid/pose order. For an edit, preserve the required identity, camera and materials explicitly.
3. Save the source PNG under `assets/art/` inside the repository. Do not leave a project dependency only in a generated-images directory. Preserve an approved asset or use a versioned filename while evaluating a replacement.
4. Add the source/grid to `ART_SOURCES` in `prepare-art.cjs`. Run `node prepare-art.cjs`. It reads RGBA PNGs and records bounds; it does not edit or resample the source art. Empty cells or sprites touching cell boundaries are errors.
5. Inspect every frame in the running browser; `/art-preview/catalog.html` displays every registered frame. Verify all directions, transparent edges, feet baselines, consistent anatomy, silhouette and frame scale. Generators can produce the right-looking sheet with wrong poses or baked backgrounds. Reject those outputs instead of hiding their flaws with arbitrary crop constants.
6. Register the art selection in the relevant draw function. Reuse `WorldArt.draw` and `WorldArt.portrait`; menus must not retain an unrelated old vector character.
7. Add the object to the shared depth-sorted layer list when necessary. Its depth is its ground anchor, not its image's top edge. Tall objects slightly beyond the viewport still need drawing. Canopies covering the nearby player fade for visibility.
8. If an object changes walkability, update `blockedAt` once. Keyboard movement and pathfinding must use that same function. `placeOnOpenGround` moves an older saved position out of a newly solid foundation without replacing other save data.
9. Record the exact prompt, source reference and relevant limitations in `ART_PROMPTS.md`. Update this guide if the asset contract changes.
10. Run the checks and inspect browser screenshots described below. Rebuild both export formats.

## Ground and performance

The preview's ground was intentionally drawn in code, and the game follows that approach. `WorldArt.ground` caches deterministic 32-pixel texture tiles by climate, terrain kind, variation and path-edge mask. Grass fringes soften paths. Keep texture random but seeded; drawing should never consume gameplay RNG or alter encounter outcomes.

`WorldArt.draw` caches rendered frame canvases at twice their display dimensions. Keep drawing heights stable so normal play does not allocate a new cache entry each frame. Do not scale sprites with a per-frame sine wave. Keep `imageSmoothingEnabled = false` and round final draw positions; nearest-neighbor scaling preserves pixel edges.

Full source sheets are relatively large. Check initial loading on a phone and the generated standalone file size before adding many more sheets. If packaging needs optimization, preserve originals and design a reproducible export step; do not silently degrade approved art. Only ship files referenced by the manifest.

## Verification

Run from the repository root with Node.js:

```sh
node prepare-art.cjs      # only after PNG/grid changes
node --check art.js
node --check game.js
node --check world-life.js
node --check encounters.js
node art-check.cjs
node smoke-check.cjs
node access-check.cjs
node build-pages.cjs
node bundle.cjs
node serve.cjs
```

Open `http://127.0.0.1:4173/`. The access code is distributed separately; do not add plaintext codes to these guides or logs. Keep the existing hash-based gate working.

Browser verification must include:

- Enter the access gate, inspect the main menu and both character presets, then start/continue a journey.
- Walk in all four directions. Check left/right/up poses, stable feet, camera motion, click-to-walk, collision, canopies and roofs covering things in the correct order.
- Talk to villagers, buy food/cards, use inventory, pet and replace a companion, and verify the chosen animal's walking frames.
- Visit each ruin, the camp and gate; open enemy encounters and confirm portraits use the same subject as the world sprite.
- Inspect woodland, autumn and frost, and day/night; test reduced motion.
- Inspect desktop, narrow portrait and landscape/touch layouts. Check readable sprites, usable controls, no horizontal page overflow and no browser exceptions.
- Save/reload an existing journey, including one placed inside a newly solid building footprint. Preserve character stats, inventory, quests and companion.
- Open the generated `dist/` game through HTTP and the standalone `MyWorld.html`. The latter must load without external PNG files or runtime scripts. Confirm no missing sprite requests.

Logic tests are necessary but cannot approve artwork. Save actual running screenshots and compare their material detail and proportions to the workshop. Do not use a concept image or isolated sprite sheet as evidence that the integrated world looks right.

## Current scope and next work

The game keeps its existing tile-based single-player rules, card combat, one companion, saving and chapter ending. NPCs and static enemies remain stationary; having walk frames available does not imply roaming AI. Generated animation proportions may need hand cleanup as the game grows. Rendering improvements are not a multiplayer, farming simulation or campaign editor implementation.

Sparse woodland boulders decorate grass away from roads and landmarks. Keep additional dressing away from interaction targets. New content should extend this pipeline rather than start a second incompatible renderer.

## Title screen

The title screen uses the name `myWorld`, a black background, a small pixel fantasy globe and plain text menu choices. It has no story panel, landscape illustration, cards, promotional copy or prototype label. The globe is a code-native SVG icon in CSS, with invented land shapes; it is not an Earth map. The local Pixelify Sans font and its OFL license live in `assets/fonts/`; Pages copies both and the standalone export embeds the font. No character, world PNG, sprite grid or generation prompt changed in this pass. The access screen shares the black palette and brand treatment. Settings also uses the black background, Pixelify text, unboxed control rows, square dark selects, gold volume/checkbox controls and a plain Save settings action. Its promotional heading is removed; volume displays its current percentage. Single Player now uses a centered heading and plain Continue / New Game choices on black. Continue shows the saved character name, or is disabled with “No saved game”; the old summary card and promotional text are removed. Existing save and character creation behavior is preserved. New Game uses the same black UI and local pixel font. Attribute, health, mana, navigation, balance, randomize and increment/decrement icons are code-native SVGs on a 16-pixel grid. Character choices retain the shared traveler PNG portraits. Green panels, rounded controls, Unicode attribute symbols and introductory promotional text are removed from this screen; allocation rules, character validation and saves are unchanged. Other game screens are being reviewed separately.

Automated art, gameplay and access checks pass. Desktop and phone screenshot inspection could not run because the browser access host was unavailable in this session; visual review remains pending.

New Game readability update: labels, help text and attribute numbers use larger, high-contrast monospace text; pixel headings and icons remain. Appearance selection uses a thin white border on the dark background, with no bright fill. World seed, landscape controls and the derived health/mana/damage summary are removed. Starting a game uses the current world seed/climate internally, with woodland/default-seed fallbacks.
