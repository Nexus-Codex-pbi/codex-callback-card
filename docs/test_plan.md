# Test Plan: optiStockCallbackCard

## Functional Tests

### Rendering Tests
- [ ] Verify single panel displays correctly with minimum required fields (Panel label + Headline value)
- [ ] Verify multiple panels display correctly (up to 10 panels)
- [ ] Verify horizontal layout arranges panels side-by-side
- [ ] Verify vertical layout arranges panels stacked vertically
- [ ] Verify proper rendering when all optional fields are present
- [ ] Verify proper rendering when only required fields are present
- [ ] Verify correct handling of null/empty values in optional fields
- [ ] Verify text truncation/overflow handling for long panel labels
- [ ] Verify proper scaling when container is resized
- [ ] Verify title appears/disappears based on Show Title setting
- [ ] Verify title styling (font, size, color, alignment) applies correctly

### Formatting Tests
- [ ] Verify Panel Background color changes correctly
- [ ] Verify Panel Radius affects corner appearance (0px square, 10px rounded, 20px max)
- [ ] Verify Panel Padding increases/decreases internal spacing
- [ ] Verify Panel Gap increases/decreases space between panels
- [ ] Verify Rate Font Size changes headline text size
- [ ] Verify Rate Color 1/2 alternates correctly for multiple panels
- [ ] Verify Label Font Size changes panel label text size
- [ ] Verify Label Color changes panel label text color
- [ ] Verify Detail Font Size changes metric text size
- [ ] Verify Detail Color changes metric text color (non-highlight)
- [ ] Verify Lost Revenue Color changes highlight metric text color
- [ ] Verify Show Metric1 toggle hides/shows Metric 1 and Metric 2 lines
- [ ] Verify Show Metric3 toggle hides/shows Metric 3 line
- [ ] Verify Show Highlight Value toggle hides/shows highlight value alongside Metric 3
- [ ] Verify all font family options apply correctly
- [ ] Verify text alignment options (left, center, right) work for title

### Interaction Tests
- [ ] Verify clicking a panel selects it and cross-filters other visuals
- [ ] Verify Ctrl+Click allows multi-selection of panels
- [ ] Verify hover triggers tooltip display with correct data
- [ ] Verify tooltip shows all non-null values with proper labels
- [ ] Verify tooltip hides on mouse leave
- [ ] Verify right-click opens standard Power BI context menu
- [ ] Verify context menu includes standard options (Export data, Spotlight, Sort, etc.)
- [ ] Verify visual responds to slicer changes and filters
- [ ] Verify visual clears properly when all data is removed
- [ ] Verify visual shows empty state message when no data bound

### Data Handling Tests
- [ ] Verify correct sorting when Sort Order field is provided (ascending)
- [ ] Verify panels maintain order when Sort Order field is removed
- [ ] Verify proper handling of large datasets (approaching 30,000 limit)
- [ ] Verify correct parsing of different data types (integers, decimals, percentages, currency)
- [ ] Verify format strings from data model are respected in display and tooltips
- [ ] Verify date fields work correctly as Panel label
- [ ] Verify text fields work correctly as Panel label

## Performance Tests
- [ ] Verify rendering time with 1 panel (<50ms)
- [ ] Verify rendering time with 10 panels (<100ms)
- [ ] Verify rendering time with 100 panels (<500ms)
- [ ] Verify rendering time with 1000 panels (<2000ms)
- [ ] Verify memory usage remains stable during repeated updates
- [ ] Verify no memory leaks during rapid resize events
- [ ] Verify CPU usage spikes are minimal during interactions
- [ ] Verify smooth hover/tooltip performance with many panels
- [ ] Verify initial render completes within reasonable time (<1s for typical datasets)

## Accessibility Tests
- [ ] Verify all interactive elements are keyboard accessible (Tab navigation)
- [ ] Verify Enter/Space keys activate panels (trigger click)
- [ ] Verify visible focus indicator when panel has keyboard focus
- [ ] Verify arrow keys navigate between panels when applicable
- [ ] Verify screen readers announce panel label and values
- [ ] Verify tooltip content is accessible to screen readers
- [ ] Verify proper behavior in Windows High Contrast mode
- [ ] Verify all text maintains sufficient contrast in HC mode
- [ ] Verify custom colors are ignored in HC mode
- [ ] Verify no reliance on color alone to convey information
- [ ] Verify text scales properly when browser zoom is increased
- [ ] Verify no content is clipped or hidden at 200% zoom
- [ ] Verify layout adapts to increased text sizes without loss of information

## Security Tests
- [ ] Verify no external network requests are made (using browser dev tools)
- [ ] Verify no data is stored in localStorage, sessionStorage, or cookies
- [ ] Verify no use of eval(), Function constructor, or similar
- [ ] Verify all DOM manipulation uses approved methods (D3 text/content)
- [ ] Verify context menu uses standard selection manager approach
- [ ] Verify no insecure DOM injection (innerHTML with untrusted data)
- [ ] Verify proper handling of special characters in data (XSS prevention)
- [ ] Verify no access to privileged APIs or restricted functionality
- [ ] Verify only declared dependencies are loaded and used

## Packaging Tests
- [ ] Verify package builds successfully with npm run build
- [ ] Verify all required files are included in .pbiviz package
- [ ] Verify pbiviz.json contains correct metadata (name, version, description)
- [ ] Verify capabilities.json is valid and properly formatted
- [ ] Verify assets (icon) are present and correctly referenced
- [ ] Verify package can be imported into Power BI Desktop
- [ ] Verify visual appears correctly after import
- [ ] Verify version number increments properly
- [ ] Verify no extraneous files in package (node_modules, source maps, etc.)
- [ ] Verify package size is within reasonable limits
- [ ] Verify digital signature (if applicable) is valid

## Sample PBIX Verification
- [ ] Create test PBIX with sample data demonstrating all features
- [ ] Verify visual works correctly in Power BI Service (published)
- [ ] Verify visual works correctly in Power BI Desktop
- [ ] Verify cross-filtering works between visuals in report
- [ ] Verify slicers affect the visual correctly
- [ ] Verify bookmarks capture and restore visual state
- [ ] Verify drill-through does not interfere with visual (no errors)
- [ ] Verify visual state persists when saving/reopening PBIX
- [ ] Verify performance in published report is acceptable
- [ ] Verify accessibility features work in published report