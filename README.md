# Nicolle

Coursework site: **Disciplinas → Grafos → Prim → game**. The previous roadmap, Kruskal laboratory and Python tutorial remain in `archive/kruskal-v1/`.

## Preview and checks

```sh
npm ci
npm run dev   # network preview, port 5173
npm test      # graph generation, Prim, purchases, budget and loss rules
npm run build
```

Current container: http://192.168.215.2:5173/. Node 23–26 is supported. Hash routes and relative assets work on GitHub Pages; pushing `main` triggers the existing Pages workflow. Local changes do not deploy themselves.

## Navigation

- `#/`: Grafos course card; Nicolle is a plain wordmark.
- `#/grafos`: Prim activity card.
- `#/grafos/prim`: one integer island-count field, Começar, and Retomar when a save exists. Values below 2 or above 128 silently clamp on submission; no presets or range label.
- `#/grafos/prim/jogo`: current game, with Menu returning one level left.

Horizontal navigation slides over the same endless Perlin field using CSS's `ease` curve, calculated on the shared DOM/WebGL animation clock. It preserves the renderer, noise seed, palette and animation time. Panning and vertical scrolling sample existing field coordinates, not newly generated cells. Missed frames do not skip large sections of the transition; reduced motion skips the slide.

## Prim game

A new game begins at island 0 with its animal rescued. Its wallet contains exactly the graph's minimum spanning tree cost. Clicking any rescued island walks the party to it over purchased bridges for free. A new island can only be clicked from an adjacent rescued island where the player is physically standing. Arrival charges the new bridge and collects the animal. Bridges and prices are display-only. Purchased bridges are solid and have no price.

Fairy01 is **Prim**. She flies above the cheapest bridge leaving the entire rescued region, not merely the player's current island. When the recommendation changes, she follows purchased bridges between its endpoints and travels the endpoint half-bridges to reach her perch. Flight and character travel have a constant 340 CSS px/s speed. Find her by panning, walk to her bridge’s rescued endpoint, then click its unrescued neighbor. Following her from the first purchase completes the game with zero rúpias. After a different purchase, her advice gives the cheapest completion of the already purchased tree, but that completion may exceed the original wallet. Other purchases can strand the wallet: when no frontier bridge is affordable before all animals are collected, the game ends. Expensive bridges cannot overdraw the wallet. Win/loss automatically slides left to the same menu, headed Vitória! or Fim de jogo, with rescued animals, rúpias spent, rúpias remaining and a fresh-game field. Finished rounds keep their results across reloads and cannot be resumed.

The top bar has only three 56px-high glass pills: Menu on the left, and remaining rúpias (Item04 icon) plus rescued count on the right. Control text is 14px. There are no bottom controls, toggles, minimap or bridge list. The world fades into the background below the top navigation. All glass has a 28px radius, including circular 56px islands.

The graph uses seeded **Poisson disk sampling and Delaunay triangulation** (Delaunator), with at least 220 CSS px between island centers. Long hull shortcuts are pruned while preserving the Euclidean spanning tree, so the organic network stays connected and has no crossing bridges. Costs are `max(1, round(center distance / 80))`; equal costs do not require exactly equal lengths. There are no rows, columns or rectangular shoreline.

The viewport fills the screen below the top banner, with no side bands or size cap. Drag/swipe, trackpad/wheel and arrow keys pan manually. The view starts centered on the player. After that, it moves only through manual pan; clicking an island and settling the party never recenter it. There is no zoom.

Only visible islands receive WebGL glass; off-screen islands, price targets and party actors are hidden. SVG bridge geometry is static. Small screen-space tile lists make each fragment inspect nearby glass rather than every island; panel data lives in textures to avoid mobile uniform limits. Capacity is 160 visible panels, covering all 128 islands plus interface and transition glass on large screens.

Retained animals use native sprite-frame pixel dimensions, including the larger sheets: they were previously resized. Tiny chick, insect, butterfly and narrow snake sheets, plus the oversized horse and bull, are omitted. There are 13 species. The rabbit and standing pigeon are ground animals, not flyers. All unrescued animals cycle their front-facing animation while waiting on islands; after joining the party, ground animals animate only while moving and true flying sprites keep flapping. Gunner02 leads; foot position controls layering. Following and newly joining animals sample the traveled bridge polyline, including corners, instead of blending straight across the water. New animals walk back along that path to the end of the queue. Fairy01 stays facing forward and flies in place. Reduced motion stops sprite cycling and makes travel immediate.

State is validated and stored in localStorage (`nicolle-rescue-prim-v3`), including seed, purchases, current island, wallet expenditure and recent party trajectory. Going back to Grafos preserves it. Starting a new game replaces it. Earlier save formats are not loaded because graph geometry and animal assignments changed.

## Engine and source

The engine is ported from Nicrainha docs commit `ddc68fb`, fixed at **L* 87**: one Perlin octave, CDF equalization, unique evenly spaced palettes, stable world-space dither, device-pixel rendering and refractive glass lightening toward white. Browser chrome uses a palette color. The renderer survives navigation. Canvas and DOM share one absolutely positioned container sized to the [VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport). Glass coordinates are measured relative to the canvas origin; cached device-pixel sizes are used only while they match the current CSS bounds and pixel ratio. The island-count input is 16px to avoid Safari focus zoom.

Local engine adaptations: 160-panel data texture, screen-space tile culling, clip rectangles, early bounds rejection, UI stacking order and a 36 CSS px fade of world glass into the top banner, matching the DOM mask.

- `src/main.ts`: routes and horizontal transitions.
- `src/scene.ts`: persistent WebGL renderer and shared frame loop.
- `src/viewport.ts`: shared visible-viewport bounds for canvas and UI, including Safari keyboard, browser-bar and orientation changes.
- `src/rescue/model.ts`: Poisson/Delaunay generator, Prim, frontier, local island purchases, free routes, wallet and outcome.
- `src/rescue/game.ts`: menu, camera, gestures, fairy, UI and travel.
- `src/rescue/party.ts`, `sprites.ts`: character sizes, flying frames, trajectory and depth.
- `src/rescue/session.ts`: validated local saves.
- `src/rescue/sound.ts`: reusable System01 click effect, played only on accepted island clicks.

`npm test` compares Prim against an independent MST implementation through 257 islands, across several seeds and starts; verifies connectivity, non-crossing edges, rounded distance costs, minimum island spacing, full optimal rescues, budget loss/overspend rules and invalid moves. Generating 1024 islands verifies that the model has no UI-level cap. The future uncapped Python/ASCII version is not implemented yet.

Nicrainha attribution remains in `LICENSES/nicrainha.txt`. Character and icon copies come from the supplied `/workdir/Graphics` directory. Delaunator (ISC) and robust-predicates (public domain) notices are in `public/licenses/`. Semester materials and reports in `/workdir/cursos` are preserved.

## Click sound and phone preview

`public/grafos/audio/system01.wav` is a PCM conversion of the supplied `/workdir/Audio/SE/001-System01.ogg`. Its Web Audio buffer is decoded once, prepared on pointer-down, and scheduled directly on the audio clock for accepted island clicks; panning and unavailable islands are silent. Playback failure never interrupts movement.

The temporary phone preview serves `dist` through HTTPS. Rebuilding with `npm run build` and refreshing the preview loads the latest version; it does not use Vite hot reload or update GitHub Pages.

Prim's fresh menu shows the instructions and animated Prim. Returning to Grafos clears the saved adventure and resets the menu. Menu/game/result navigation inside Prim preserves the current adventure and background music. `public/grafos/audio/prim.m4a` is the supplied IMG_0752.MP4's AAC audio extracted without re-encoding (~2 MB); one looping Web Audio source is retained within Prim and stopped on exit. Browser autoplay rules require a user interaction after a direct page load.
