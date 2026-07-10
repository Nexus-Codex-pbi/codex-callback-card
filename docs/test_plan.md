# Test Plan – Codex Callback Card

## 1. Functional Tests
- [ ] Visual loads without errors
- [ ] Visual renders with sample data
- [ ] Visual handles empty data gracefully
- [ ] All format pane options apply correctly
- [ ] Selection / cross-filter works (if applicable)
- [ ] Tooltips appear on hover

## 2. Performance Tests
- [ ] update() completes < 250ms
- [ ] No memory leaks
- [ ] Bundle size < 2.5 MB

## 3. Accessibility Tests
- [ ] Keyboard navigation works
- [ ] High contrast mode supported
- [ ] ARIA labels present
- [ ] No flashing content

## 4. Security Tests
- [ ] No external network calls
- [ ] No telemetry
- [ ] No external scripts or fonts
- [ ] No DOM escape or eval

## 5. Packaging Tests
- [ ] pbiviz builds successfully
- [ ] Bundle size < 2.5 MB
- [ ] capabilities.json valid

## 6. Sample PBIX Verification
- [ ] Demonstrates all features
- [ ] Demonstrates formatting options
- [ ] Demonstrates interactions

## 7. Background Transparency (TRANS-01/02/03/05)
- [ ] Background card (Colour + Transparency) appears in the format pane
- [ ] Transparency 0% renders fully opaque background over a non-white report canvas
- [ ] Transparency 50% shows true partial transparency (canvas colour blends through) over a non-white canvas
- [ ] Transparency 100% shows fully transparent background (canvas colour shows through completely)
- [ ] Old saved report (no background properties set) renders pixel-identical to pre-upgrade — no background painted on the root container (transparency defaults to 100 on this visual specifically since rootDiv was never painted before this plan, D-06)
- [ ] Light theme and dark theme both render correctly with transparency applied

## 8. Conditional Formatting / fx (TRANS-04)
- [ ] fx button appears next to Highlight Value Colour swatch in the format pane
- [ ] Binding a measure to a conditional formatting rule on Highlight Value Colour changes colour per panel/category
- [ ] Panels without a rule fall back to the static Highlight Value Colour swatch value

## 9. Context Menu Regression (CERT-01 — T-04-01)
- [ ] Right-click on empty space within the visual (not on a panel) still opens the Power BI context menu after the background transparency change
- [ ] Right-click directly on a panel still opens the context menu (existing contextmenu listener on `this.target`, unchanged by this plan)

## 10. Visual Title (TITLE-01, D-13/D-14, migrated to shared `_shared/formatting/titleSettings`)
- [ ] Show Title toggle appears in the format pane under "Visual Title"; default OFF
- [ ] Enabling Show Title + entering Title Text renders a title inside the visual's own iframe (above the panels)
- [ ] Title Font (family/size/bold/italic/underline), Alignment, and Font Color all apply correctly
- [ ] Old saved report (no title properties set) renders with no title — pixel-identical to pre-upgrade (showTitle defaults false)

## 11. Per-Surface Text Treatment (TEXT-01)
- [ ] Headline (Rate) Font — family/bold/italic/underline apply; Alignment repositions the headline within its panel
- [ ] Panel Label Font — family/bold/italic/underline apply; Alignment repositions the label
- [ ] Metric 1/2/3 Detail Font — family/bold/italic/underline apply to all detail text lines; Alignment repositions them
- [ ] Old saved report (no new font/alignment properties set): headline renders bold (700, unchanged), label renders bold (700, closest match to the prior hardcoded 500 weight), detail renders normal weight (400, unchanged) — all three centered (unchanged from the prior `align-items: center` CSS default)

## 12. Text-Colour fx (TEXT-02)
- [ ] fx button appears next to Headline Colour (panel 1) swatch in the format pane
- [ ] Binding a measure to a conditional formatting rule on Headline Colour (panel 1) changes the first panel's headline colour per category; other panels keep the existing static Headline Colour (panel 2) alternation
- [ ] Panels without a rule fall back to the static Headline Colour (panel 1) swatch value

## 13. Context Menu Regression — Post Title/Text Change (T-11-01)
- [ ] Right-click on empty space within the visual (not on a panel, not on the title) still opens the Power BI context menu after this plan's title/text DOM additions
- [ ] The new title element does not sit as a pointer-events overlay over empty space (title is an in-flow rootDiv child, not an absolutely-positioned layer)

## 14. v2 Board Look (LOOK-02, 01-16 — shared v3 engine)
- [ ] Each side renders an eyebrow row (band-tinted status dot + uppercase panel label) above the headline value
- [ ] Per-side band verdict: sides after the first are tinted by their headline's direction vs the FIRST panel (baseline) — lime (success) on increase, magenta (danger) on decrease; the sides can disagree
- [ ] First panel (baseline) and any side without a computable delta: dot falls back to the accent (cyan) token, no delta chip renders (board degradation order)
- [ ] Delta chip matches KPI Card v2 grammar: arrow + signed % in tabular numerals, 999px pill, band-colour text over a 15% colour-mix fill
- [ ] Hairline divider (1px, border token) separates sides in BOTH layouts (Side by side: vertical rule; Vertical stack: horizontal rule); no drop shadow anywhere
- [ ] Corner-bracket signature (accent-tinted, mirrored TL/BR) paints above the title panel; glow only on a dark-reading panel background, none on light
- [ ] Headline value uses tabular numerals, line-height 0.95; value settles once (<=400ms) ONLY when its displayed text changes, and not under prefers-reduced-motion
- [ ] High contrast: dot/chip/divider/brackets take system colours, chip swaps tinted fill for a 2px outline, and the arrow is paired with a status glyph (nothing reads by colour alone)

## 15. D-16 Override Fidelity (01-16)
- [ ] Old saved report with user-SET panel background / headline colours / label & detail colours / fonts / alignment: every value still resolves exactly as saved (explicit `??` fallback reads only fill UNSET properties)
- [ ] Headline Colour (panel 1) fx rule still resolves per category on panel 1 under the new look
- [ ] Layout choice persists: reports saved as Horizontal render Side by side, Vertical renders Vertical stack (persisted values unchanged; only display names updated)
- [ ] New-look DEFAULTS (left alignment, eyebrow treatment, chip, divider, brackets) apply only where properties were never set
