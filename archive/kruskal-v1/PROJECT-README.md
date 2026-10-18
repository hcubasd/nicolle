# Nicolle — coursework

A lightweight semester menu and **Grafos e Redes roadmap**, in TypeScript and Vite. The UI uses nicrainha's generated palette, animated Perlin-noise background and physically refractive WebGL glass, adapted from the library's docs/showcase.

## Preview and build

```sh
npm ci
npm run dev
```

The dev server listens on all interfaces at port **5173**. For a container, open the **Network IP URL** printed by Vite. Requires Node 23–26 (Node 24 recommended).

```sh
npm test         # MST, rescue rules and every Python lesson cell (Python 3 required)
npm run build    # TypeScript check + static output in dist/
npm run preview  # Preview the static build on port 4173
```

Relative asset URLs and hash routes support deployment at `https://hcubasd.github.io/nicolle/` without server-side routing. The `.github/workflows/pages.yml` workflow tests, builds and deploys every push to `main`, and can also be run manually. GitHub Pages uses the GitHub Actions source. Live site: https://hcubasd.github.io/nicolle/. `npm run build` generates the static files in `dist/`.

## Pages

- `#/`: course picker, current local date, course codes and hours. Grafos is available; the other five course pages remain placeholders.
- `#/grafos`: lightweight roadmap. Defaults to events from the current local day onward. Filters show the whole semester, assessments or classes.
- `#/grafos/evento/<id>`: event detail with its topics, date, evaluation notes and available materials. Links can be shared and refreshed directly.
- `#/grafos/kruskal/aula`: 31-step beginner Python tutorial in four study phases. It builds connections and group labels by hand before automating union, then implements the rescue game in text with the same four-island data. Executable examples, expected outputs, exercises, prominent completion states, a resume button and a self-contained Colab notebook with examples and blank code cells. Only Python blocks have a black background; highlighting uses 12 chromatic ANSI colors mapped through nicrainha `mapColors`.
- `#/grafos/evento/jogo-kruskal`: Kruskal assignment outline, delivery **13 October 2026**, confirmed by the family. Delivery time and official assessment instructions have not been provided. Click-to-travel rescue game with two maps, free starting-island choice, one-time bridge purchases, free repeat travel and a Gunner02 character followed by rescued animals. The oracle reveals a minimum purchase network and an example walk without buying bridges or moving the player.
- `#/grafos/kruskal/laboratorio`: the separate edge-selection exercise and step-by-step group/union replay; the tutorial links to it when studying the oracle.

The course includes all **18 dated events from the teaching plan**, plus the Kruskal assignment. October 13 has two separate events: the scheduled Dijkstra class and the assignment delivery. Exam scope and grade weights are taken from the supplied plan. Past events are identified by date only; completion is not presumed. Recovery and replacement assessments are conditional. PDFs are bundled in `public/grafos/`.

## Rendering and layout

- Adapted from Nicrainha docs commit `4666d5e`: shared glass/Perlin shaders, endless procedural floor, fixed noise-to-palette mapping and palette-scaled cells and fractal detail based on measured ΔE2000 step unevenness (running maximum from the default lightness), with energy normalization and per-pixel footprint filtering.
- One global **28 CSS px** radius for panels; animal islands and edge-cost buttons remain circles. Up to 32 visible panels are culled and submitted with reusable uniform buffers. Refraction retains n = 1.5 and its derived focal gap.
- All 256 lightness rings (L* 0–100) are precomputed at build time. A final ring represents the chosen background lightness exactly. Glass moves toward white or black according to black/white text contrast, with the docs' exponential thickness model and 8 rem length. Colors remain exact palette lookups without tint, blur or alpha blending.
- **Aparência** in the top menu opens a keyboard-accessible lightness slider. The dialog backdrop is transparent for an unobstructed live preview. Changes apply in place, preserve palette rotation/noise seed, update the browser theme color and persist locally. Drag previews are coalesced to at most 10 per second, with immediate final application on release; persistence and URL writes wait for idle or release. Browser history rate limits do not interrupt the slider. Lightness updates upload only the exact background palette row; the full ring table and permutation are uploaded once per context. `?lightness=<0–100>` overrides the saved value. Default is Nicrainha's L* 73.9124; “Restaurar padrão” restores it.
- Bounded vertical scrolling adapts the showcase's shared-frame panning: HTML content and glass positions move in the same render frame, and the background travels with them. Touch release velocity uses the last 100 ms, a 40 ms stopped threshold and exact exponential fling integration with decay 0.998 per ms. Wheels/trackpads keep their supplied momentum; keyboard navigation and focus scrolling are supported. Tutorial jump links and route scroll restoration use the same camera. Pages do not wrap like the demo. Background pan accumulates actual wheel/touch/keyboard movement independently of the page position, so route restoration and tutorial jumps do not jump the background.
- Exact device-pixel canvas sizing uses `device-pixel-content-box` when available, with the docs' Safari fallback. Animation redraws only when the view changes or noise can step a palette color, scaled by fractal detail. No per-frame CPU noise-range search, palette generation, texture upload or full-screen render targets.
- `?speed=0.5` adjusts animation speed; `?speed=0` freezes the background. `?radius=0` hides rectangular glass for comparison (circular islands remain circles). Query parameters go before the hash route.
- Reduced motion freezes background evolution. WebGL failure leaves all content, controls and camera scrolling usable against the palette fallback. Context restoration rebuilds renderer state.
- Mobile retains safe-area padding and solid top/bottom edge fills matching the selected palette/lightness. Browser-owned toolbar opacity remains browser-controlled.
- System fonts, local preference storage, no tracking or backend. Python code blocks retain their black background and Nicrainha syntax colors in both modes.

## Source

- `src/main.ts`: menus, hash routes, filters, event details and date display.
- `src/data/grafos.ts`: typed course schedule, topics and assignment deadline.
- `src/scene.ts`: persistent WebGL scene, palette, dynamic panel layout and animation.
- `src/noise.ts`: typed showcase CPU Perlin/range implementation.
- `src/shaders/scene.frag`: showcase optics extended to multiple panels.
- `src/styles.css`: responsive menus, timeline and detail layouts.
- `public/grafos/`: original course plan and AGM lecture slides, by Luiz Gustavo Cordeiro.

## Attribution

The noise implementation and shaders are adapted from [hcubasd/nicrainha](https://github.com/hcubasd/nicrainha), source commit `dc4358389d159b632463d8d7e1269d14eef6367b7`, under its MIT license. The notice is retained in `LICENSES/nicrainha.txt`. The nicrainha package generates the palette at runtime.

## Kruskal game and lesson

`src/kruskal/core.ts` contains the algorithm, separate from the interface. It sorts edges, rejects edges whose ends have the same group label, and merges groups by relabeling their vertices. The tutorial's `src/lessons/kruskal.py` uses the same beginner-friendly procedure. Group merging scans the vertex list; this is intentionally simpler than optimized Union-Find. Trace records drive the step-by-step interface. Maps are in `src/kruskal/maps.ts`; their minimum costs are 7 and 14. The game validates connectivity and cost, so alternative minimum trees are accepted.

`src/kruskal/game.ts` draws HTML glass islands and controls over SVG paths. `src/lessons/tutorial.ts` provides ten notebook-sized steps, generated blank notebooks and optional browser-local completion. Six animal sprite sheets were copied from the family's supplied Graphics directory, preserving originals. CSS animates the four front-facing frames of each 4×4 sheet, with discrete steps and slightly varied timing. Animals walk or hop in place; reduced-motion preference keeps them on a static front-facing frame. No RPG scenery or tiles are used. These supplied assets have no bundled license; their source and redistribution terms remain to be established before public deployment. Nicrainha's MIT notice applies to its own code, not these sprites or course PDFs.

Validation includes exhaustive spanning-tree comparison on both maps and 30 additional weighted graphs, Python/TypeScript agreement, beginner cell outputs, game actions, tied alternative solutions, notebook download, progress persistence and layout at 280/390/768/1280 px.

Renderer updated from nicrainha docs commit `4666d5e`: see `docs/README.md`, `gl.js`, `noise.js`, `lightness-rings.js` and the glass/Perlin shaders.

## Rescue and lesson validation

`src/kruskal/rescue.ts` separates game rules from animation: only adjacent islands can be reached; a canonical bridge ID is paid once in either direction; starting/return visits never duplicate animals. `src/kruskal/game.ts` follows the actual SVG curves with directional sprite frames, a recent trajectory for followers and depth ordering by foot position. Idle sprites settle to the same front frame. Reduced motion completes travel immediately. Edge masks scale to the islands' actual CSS radius plus outline clearance. Paths have mutually exclusive states: thin dashes before purchase, round dots for oracle-recommended purchases, solid lines after purchase. The oracle has one purchase-list panel. Completion uses a thin inset border and a fixed-size checkbox label, without layout changes.

`src/lessons/resgate.py` and `public/grafos/resgate.py` are identical standalone text-game references. The lesson builds this program gradually: data → input → state → neighbors → purchased-bridge membership → a single trip → while/commands → oracle → full game. Kruskal remains the simple dictionary-label implementation; it computes a minimum network, not a TSP route. The player may revisit islands and free bridges.

`npm test` now also checks the rescue from every possible starting island on both maps, minimum-cost example walks, free return trips, invalid moves, all 31 Python cells executed in order, exact expected outputs and text-game cases (oracle, invalid input, early exit and a non-optimal win). Browser checks cover moving/resting sprite state, depth, mobile edge clearance, oracle non-interference, completion persistence and downloaded notebook contents.

The expanded lesson uses progress key `nicolle-kruskal-lesson-v2`. Only unchanged first-five-stage progress can migrate from the old ten-stage lesson; expanded group stages require their own completion. The original Gunner02 sheet was copied unmodified from `Graphics/Characters/024-Gunner02.png`; existing animal sheets remain unchanged.
