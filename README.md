# Nicolle — coursework

A lightweight semester menu and **Grafos e Redes roadmap**, in TypeScript and Vite. The UI uses nicrainha's generated palette, animated Perlin-noise background and physically refractive WebGL glass, adapted from the library's docs/showcase.

## Preview and build

```sh
npm ci
npm run dev
```

The dev server listens on all interfaces at port **5173**. For a container, open the **Network IP URL** printed by Vite. Requires Node 23–26 (Node 24 recommended).

```sh
npm test         # Exhaustive MST comparisons + Python/TypeScript agreement (Python 3 required)
npm run build    # TypeScript check + static output in dist/
npm run preview  # Preview the static build on port 4173
```

Relative asset URLs and hash routes support deployment at `https://hcubasd.github.io/nicolle/` without server-side routing. The `.github/workflows/pages.yml` workflow tests, builds and deploys every push to `main`, and can also be run manually. GitHub Pages uses the GitHub Actions source. Live site: https://hcubasd.github.io/nicolle/. `npm run build` generates the static files in `dist/`.

## Pages

- `#/`: course picker, current local date, course codes and hours. Grafos is available; the other five course pages remain placeholders.
- `#/grafos`: lightweight roadmap. Defaults to events from the current local day onward. Filters show the whole semester, assessments or classes.
- `#/grafos/evento/<id>`: event detail with its topics, date, evaluation notes and available materials. Links can be shared and refreshed directly.
- `#/grafos/kruskal/aula`: ten-step beginner Python tutorial, executable examples, expected outputs, exercises, local progress and a downloadable Colab notebook with blank code cells. Only Python blocks have a black background; highlighting uses 12 chromatic ANSI colors mapped through nicrainha `mapColors`.
- `#/grafos/evento/jogo-kruskal`: Kruskal assignment outline, delivery **13 October 2026**, confirmed by the family. Delivery time and official assessment instructions have not been provided. Playable glass-island game, two maps, manual construction, minimum-cost verification, Kruskal cheat and step-by-step algorithm replay.

The course includes all **18 dated events from the teaching plan**, plus the Kruskal assignment. October 13 has two separate events: the scheduled Dijkstra class and the assignment delivery. Exam scope and grade weights are taken from the supplied plan. Past events are identified by date only; completion is not presumed. Recovery and replacement assessments are conditional. PDFs are bundled in `public/grafos/`.

## Rendering and layout

- Adapted from Nicrainha docs commit `a9773cc`: shared glass/Perlin shaders, endless procedural floor, fixed noise-to-palette mapping and lightness-dependent fractal detail with energy normalization and per-pixel footprint filtering.
- One global **28 CSS px** radius for panels; animal islands and edge-cost buttons remain circles. Up to 32 visible panels are culled and submitted with reusable uniform buffers. Refraction retains n = 1.5 and its derived focal gap.
- All 256 lightness rings (L* 0–100) are precomputed at build time. A final ring represents the chosen background lightness exactly. Glass moves toward white or black according to black/white text contrast, with the docs' exponential thickness model and 8 rem length. Colors remain exact palette lookups without tint, blur or alpha blending.
- **Aparência** in the top menu opens a keyboard-accessible lightness slider. The dialog backdrop is transparent for an unobstructed live preview. Changes apply in place, preserve palette rotation/noise seed, update the browser theme color and persist locally. `?lightness=<0–100>` overrides the saved value. Default is Nicrainha's L* 73.9124; “Restaurar padrão” restores it.
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

Renderer ported from nicrainha docs commit `a9773cc`: see `docs/README.md`, `gl.js`, `noise.js`, `lightness-rings.js` and the glass/Perlin shaders.
