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
- [ ] Old saved report (no background properties set) renders pixel-identical opaque white — D-06 regression check
- [ ] Light theme and dark theme both render correctly with transparency applied

## 8. Conditional Formatting / fx (TRANS-04)
- [ ] fx button appears next to Highlight Value Colour swatch in the format pane
- [ ] Binding a measure to a conditional formatting rule on Highlight Value Colour changes colour per panel/category
- [ ] Panels without a rule fall back to the static Highlight Value Colour swatch value

## 9. Context Menu Regression (CERT-01 — T-04-01)
- [ ] Right-click on empty space within the visual (not on a panel) still opens the Power BI context menu after the background transparency change
- [ ] Right-click directly on a panel still opens the context menu (existing contextmenu listener on `this.target`, unchanged by this plan)