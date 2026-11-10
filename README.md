# Grove — Step 1: Extraction

This is the **first migration stage** of Grove, moving it from a single-file
Claude artifact into a standalone project structure — *before* any
persistence or PWA changes.

## What this stage is

- The exact same UI, styles, and logic as the working Grove artifact,
  split into conventional files.
- CSS moved to `css/styles.css`.
- JavaScript split into `js/` modules, loaded as plain global-scope
  `<script>` tags **in the same order** the code ran inside the original
  inline `<script>` block. Nothing was rewritten — only relocated.
- A placeholder `manifest.json` exists so the `<link rel="manifest">` tag
  doesn't 404, but it has no icons yet and is not wired to a service
  worker. It has no effect on the app.

## One deviation from pure extraction

Everything below was mechanically verified to be a byte-for-byte relocation
of the original artifact's CSS, HTML, and JS logic — with one exception,
found during boot testing outside the artifact:

`DEFAULTS` in `js/db.js` was missing an `expenses: []` entry, even though
`'expenses'` is a key in `KEYS` and used throughout the Finance view. Inside
the Claude artifact this apparently never surfaced, but in a real browser
(where `window.storage` doesn't exist at all) it crashed `loadAll()` on
first boot — the graceful-fallback path itself threw, since it had nothing
to fall back to. This is a **one-line, pre-existing bug fix**, not a
persistence or logic change: `expenses: []` was added to `DEFAULTS` so it
matches every other collection's default. Everything else is unchanged.

## What this stage is *not*

- **Data will not persist** when this is opened outside the Claude
  artifact environment. Persistence still calls `window.storage`, which
  is a Claude-artifact-only API — that's expected at this stage.
  IndexedDB persistence is Step 2.
- Not yet installable as a PWA (no service worker, no real icons).
- Fonts are still loaded from the Google Fonts CDN, not self-hosted —
  offline font loading is part of the Step 2/PWA work.

## File structure

```
grove/
├── index.html
├── manifest.json        (placeholder — no icons, not installable yet)
├── css/
│   └── styles.css
├── js/
│   ├── db.js             (window.storage calls — unchanged, relocated)
│   ├── utils.js           (date/format helpers)
│   ├── state.js            (rollover, habit/journal auto-generation)
│   ├── router.js            (hash-based navigation)
│   ├── render.js             (all view-rendering functions)
│   ├── events.js              (event wiring, quick-add, search, modal)
│   └── main.js                 (boot sequence)
├── icons/                (empty — placeholder for Step 2+)
├── fonts/                 (empty — placeholder for Step 2+ self-hosting)
└── README.md
```

## How to verify this stage

Serve the folder with any static file server, e.g.:

```
cd grove
python3 -m http.server 8000
```

Then open `http://localhost:8000/` in a browser and run through the
Step 1 testing checklist (structural/visual verification only — data
entry won't be saved outside the Claude artifact at this stage).

## Next step

Step 2 replaces `db.js` internals with an IndexedDB-backed implementation
(same function signatures — `loadAll()` / `save(key)` — so nothing above
`db.js` needs to change), and begins the PWA work (service worker,
manifest icons, self-hosted fonts, offline caching).
