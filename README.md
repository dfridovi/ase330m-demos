# ASE 330M Demos

Student-facing interactive web demos for ASE 330M (linear systems for aerospace engineering).
Deployed via GitHub Pages at <https://dfridovi.github.io/ase330m-demos/>.

## Layout

Each demo is an independent app in its own top-level folder, e.g. `aircraft-explorer/`. The
root `index.html` is a simple static landing page linking to each one.

## Adding a new demo

1. Add the new app as a top-level folder (e.g. `cw-dynamics/`), following whatever stack fits
   the demo — it doesn't need to match `aircraft-explorer`'s (Vite + React + Three.js).
2. If it's a Vite app, set its `base` in `vite.config.ts` to
   `/ase330m-demos/<folder-name>/` — the site is served under a subpath
   (`https://dfridovi.github.io/ase330m-demos/`), not the domain root, so asset URLs need
   that prefix.
3. Add a link to it in the root `index.html`, under the appropriate topic group's `<ul
   class="demos">` (or add a new `<h2 class="group-title">` section if it starts a new topic).
4. Add a build step for it in `.github/workflows/deploy.yml` (a build-and-copy-into-`_site`
   block per demo — follow the `aircraft-explorer` block as a template).
5. Push to `main` — the workflow builds every demo and redeploys the whole site.

## Local development

Each demo manages its own dependencies; `cd` into its folder and follow its own README
(usually `npm install` then `npm run dev`, or `npm run build && npm run preview` for a more
representative performance check).
