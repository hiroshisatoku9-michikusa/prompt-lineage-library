# Curation And UI Improvement Workflow

Use this workflow whenever prompt data is cleaned, UI layout is changed, or a release is prepared.

## 1. Data Specialist Pass

Run the Prompt Data Pruning Specialist first.

Inputs:

- `prompt_lineage_seed.json`
- current roots, prompts, and relationships
- the two-layer library rule

Outputs:

- deletion manifest
- revised lineage plan
- integrity report

Allowed actions:

- delete prompts outside Layer 1 and Layer 2
- delete invalid or empty relationships
- remove empty roots
- reparent Layer 2 style variations under the correct Layer 1 master

Required checks:

- no dangling relationships
- all kept prompts belong to Layer 1 or Layer 2
- no mere theme/subject/place swaps are retained as Layer 2

## 2. Apply Data Changes

After accepting the data specialist pass:

1. Edit `prompt_lineage_seed.json`.
2. Regenerate `seed-data.js`.
3. Regenerate the bundled `index.html`.
4. Load the app locally.
5. Verify browse, search, copy, filters, lineage view, and export.

## 3. UI Critic Pass

Run the Grid Alignment UI Critic after any data or UI change.

Required screenshots/checks:

- desktop wide viewport
- tablet or narrow desktop viewport
- mobile viewport
- long prompt title row
- detail view with long body
- Lineage tab
- Import / Export tab

Outputs:

- blocker/major/minor findings
- alignment and grid recommendations
- text-length stability risks

## 4. Implement UI Fixes

For every blocker or major finding:

1. Identify the affected CSS/HTML/JS.
2. Apply the smallest layout fix that restores grid stability.
3. Avoid decorative redesigns.
4. Re-run the UI critic pass.

Minor findings may be batched, but should not be ignored if they affect repeated components such as rows, chips, filters, or tabs.

## 5. Release

Release only when:

- data integrity checks pass
- no blocker or major UI findings remain
- local app works
- GitHub Pages version works

Release steps:

1. Commit source changes locally.
2. Publish the static app to GitHub.
3. Confirm the public URL loads.
4. Confirm at least one filter and one tab interaction works on the public URL.
