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