# Codex Callback Card — Cert Notes (resubmission wave, Phase 01)

**Version:** 1.1.0.27 (visual.version) · production GUID unchanged (`codexCallbackCard…`) · API 5.11.0 / pbiviz 7.0.2 (pinned).

One-wave AppSource resubmission carrying the transparency/formatting rework **and** the v2 appearance redesign. Partner Center re-evaluates the whole package (Pitfall 6).

## Transparency wave (Plans 03–08)
- New **Background** card: `ColorPicker` fill + 0–100 `transparency` slider via `hexToRGBString`. Additive.
- fx conditional formatting wired on eligible colour properties.

## Title + per-region text wave (Plans 10–14)
- Title + per-region text treatment reworked with adaptive text colour.

## v2 Appearance wave (Plans 15–18)
- Per-side **band verdict** (this visual has no target/goal data role, so the verdict is a bounded baseline-vs-first-panel derivation via the literal direction law — documented, 01-15 pilot precedent); baseline side falls back to the accent token with no chip.
- Standard delta chip matching the KPI Card v2 grammar; hairline divider (no drop shadow); corner-bracket signature; both vertical-stack and side-by-side layouts honoured.
- **D-16:** `alignment` default moves center→left in `settings.ts` with matching `visual.ts` fallbacks; every saved colour/fx override still resolves.

## High-contrast rule
Shared HC rule wired (`src/shared/highContrast.ts`).

## CERT-01 regression guard
Empty-space right-click context menu confirmed intact after all three waves (Task 1, Neil-verified). Context-menu listener logic unchanged.

## Pending fixes riding this wave
- **`f7f3719` — Policy 1180.2.2 filter-in from cross-filter visuals (v1.1.0.20).** This fix is committed and packaged but the most recent cert report on file predates it (2026-05-11), and 2026-06-11 memory listed Callback Card as "not yet submitted." **It may never have been reviewed** — call it out explicitly in the Partner Center submission notes, not merely as a re-verify.
