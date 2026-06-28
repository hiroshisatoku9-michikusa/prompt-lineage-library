# 2026-06-28 Prompt Pruning Integrity Report

## Summary

- Prompts before: 364
- Prompts after: 19
- Prompts deleted: 345
- Roots before: 9
- Roots after: 9
- Relationships before: 364
- Relationships after: 19

## Kept Layer 1

- VP-002: Create a Japanese UX service storyboard illustration in a modern flat vector presentation style.
- VP-021: [THEME] Primitive observational ink doodle master
- VP-075: Create an illustration in the style of an obscure Japanese regional tourism poster printed between 1955 and 1975.
- VP-083: 入力画像をもとに、モダンでフラットなベクター風イラストに変換してください。
- VP-085: Create a highly simplified landscape illustration composed of large organic paper-cut shapes.
- VP-093: Create a minimalist hand-drawn conceptual diagram illustration on a clean white background.
- VP-101: Reimagine the uploaded photo as the cover of a sophisticated Japanese cultural lifestyle magazine.
- VP-104: Transform the uploaded photograph into a quiet Japanese literary landscape illustration in the style of a modern Japanes
- VP-105: Create a minimalist Japanese folk-art style editorial illustration composed of small symbolic silhouettes scattered acro
- VP-109: [THEME]
- VP-113: Create a single uppercase Latin letter in a custom typographic style based on the following rules.
- VP-130: Create a hand-drawn style illustration featuring a [subject, e.g., small delivery truck]. The design should have the fol
- VP-134: 写真に写っている要素を観察し、それぞれに対して意味のある手描き注釈を追加してください。

## Kept Layer 2

- VP-003: Create a 6-panel Japanese UX storyboard manga in a modern flat vector presentation style. -> parent VP-002
- VP-004: [HMW_QUESTION] -> parent VP-002
- VP-015: [STYLE THEME] -> parent VP-021
- VP-026: （ここにモチーフ名を入れる） -> parent VP-021
- VP-036: [THEME] Bold black observational silhouette reduction -> parent VP-021
- VP-041: <SUBJECT> -> parent VP-021

## Policy

Deleted all prompts outside the approved two-layer style library. Subject-only, place-only, theme-only, project-specific, article-specific, service-flow-only, code, commentary, and short refinement fragments were removed.

## Normalizations

- VP-021 was normalized from a guava-specific canonical prompt into a reusable primitive doodle placeholder master.
- VP-036 was normalized from a banyan-specific silhouette prompt into a reusable silhouette style variation.

## Unresolved Uncertainty

None blocking. The pruning pass intentionally preferred deletion for duplicates, older versions, prompt fragments, and theme-specific examples.
