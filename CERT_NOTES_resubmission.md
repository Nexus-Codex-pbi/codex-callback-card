# Codex Callback Card — Cert Notes (licensing resubmission wave)

**Version:** 1.1.0.29 (visual.version) · production GUID unchanged (`codexCallbackCard…`) · API 5.11.0 / pbiviz 7.0.2 (pinned).

**Review scope — licensing only.** Verified against the offer's Partner Center History page: the
package submitted 1 Aug 2026 **passed certification and published on 3 Aug 2026**. A 5 Aug
submission was cancelled before review. So the transparency, title/text and v2 appearance waves
below have all been reviewed and shipped; this wave adds the licence gate and nothing else.

## Licensing (the only change this wave carries)

- `licenseManager.getAvailableServicePlans()` is called once on construction.
- With no Active/Warning plan, `notifyLicenseRequired(LicenseNotificationType.General)` is raised.
  `General`, **not** `VisualIsBlocked` — Microsoft enforces `General` only in Edit scenarios, so a
  report viewer is never interrupted and the visual keeps rendering. Verified in the built bundle:
  the compiled call is `notifyLicenseRequired(0)`; `VisualIsBlocked` does not appear.
- **Fails open** on `isLicenseInfoAvailable === false`, `isLicenseUnsupportedEnv === true` (Publish
  to Web, PaaS embed, national clouds, Report Server, PDF/PPT export), or an absent API.
- **No network calls added.** Verified in the built bundle: no `fetch`, `XMLHttpRequest`,
  `WebSocket`, and no `crypto.subtle` — `src/shared/suiteKey.ts` is imported by nothing and is
  tree-shaken out.
- `capabilities.json` unchanged by this wave — `"privileges": []`.

Sample `.pbix` re-embedded to this exact build (1.1.0.29) and verified byte-level before upload.

## Offer listing corrected alongside this submission

One line was imprecise rather than false: *"Custom format string for the headline value"* implied a
format-string control in the format pane. There is none — `capabilities.json` has no format,
display-unit or decimal property. The visual reads each measure's own PBI format string
(`visual.ts:386`, `formatValue(panel.rate, panel.rateFormat)`), so the line now reads
**"Headline and metric values honour each measure's own format string."** No code change.

Every other Description claim was re-verified against source this pass:

| Claim | Evidence |
|---|---|
| Click to cross-filter, Ctrl-click to add to selection | `visual.ts:496` — `select(id, e.ctrlKey \|\| e.metaKey)` |
| Right-click context menu across the card | `visual.ts:114` — `showContextMenu` |
| Side-by-side or vertical-stack layout | `capabilities.json` `layout` enum |
| High contrast mode support | `src/shared/highContrast.ts` |

The description carries **no keyboard-navigation claim** — that was removed in the 1 Aug listing
rewrite, and the visual correctly does not claim it (`src/` has no `keydown`/`keyup`/`tabindex`).

## Already certified — do not re-litigate

- **Transparency wave:** `Background` card — `ColorPicker` fill + 0–100 `transparency` slider via
  `hexToRGBString`; fx wired on eligible colour properties. Additive.
- **Title + per-region text wave:** title and per-region text reworked with adaptive text colour.
- **v2 appearance wave:** per-side band verdict (no target/goal data role, so the verdict is a
  bounded baseline-vs-first-panel derivation via the literal direction law; the baseline side falls
  back to the accent token with no chip); delta chip matching the KPI Card v2 grammar; hairline
  divider; corner-bracket signature; both layouts honoured.
- **D-16:** `alignment` default moved center→left in `settings.ts` with matching `visual.ts`
  fallbacks; every saved colour/fx override still resolves.
- Codex icon replacing the stock pbiviz wrench; eslint 9 → 10 for the `npm audit` gate
  (devDependencies only — shipped bundle unchanged).

## Pending fixes riding this wave

None outstanding.
