# Prompt Lineage Library

Local-first prompt library for browsing, searching, copying, curating, filtering, and editing prompt lineage data.

## Use

Open `index.html` in a browser or publish this folder with GitHub Pages.

The app stores edits in the browser and can export the edited library as JSON or CSV.

## Data

- Seed: `prompt_lineage_seed.json`
- Standalone app: `index.html`
- Split source files: `app.js`, `styles.css`, `seed-data.js`

No AI features are implemented in this MVP.

## Project AI Team

Specialist roles and release workflow are defined in `.agents/`.

- Prompt Data Pruning Specialist: deletes records outside the approved two-layer style-prompt library.
- Grid Alignment UI Critic: reviews alignment, grid stability, and text-length layout shifts before release.
