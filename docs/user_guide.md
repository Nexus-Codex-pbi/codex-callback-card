# User Guide: optiStockCallbackCard

## Adding the Visual
1. From the Power BI Desktop Visualizations pane, click the three dots (...) → Get more visuals
2. Search for "optiStockCallbackCard" or browse to find the visual
3. Select the visual and click Add
4. The visual icon will appear in your Visualizations pane
5. Drag the icon onto your report canvas to add an instance of the visual

## Data Binding
The visual requires specific data fields to function properly:

### Required Fields
- **Panel label** (category): Text field that defines each comparison panel (e.g., time windows, categories, regions)
- **Headline value** (rate): Primary numeric metric displayed prominently in each panel (e.g., callback rate, percentage, score)

### Optional Fields
- **Metric 1** (callbackCount): First supporting metric per panel (e.g., total calls, attempts)
- **Metric 2** (totalCount): Second supporting metric per panel (e.g., successful outcomes, completions)
- **Metric 3** (lostCount): Third supporting metric per panel (e.g., failed attempts, drops)
- **Highlight value** (lostRevenue): Special metric displayed in accent color (e.g., financial impact, lost value)
- **Sort Order** (sortOrder): Numeric value to control panel display order (ascending sort)

### Field Requirements
- Panel label: Text or category data type (strings, dates, etc.)
- All metric fields: Numeric data type (whole numbers, decimals, percentages, currency)
- Sort Order: Numeric value (used only for sorting, not displayed)
- Minimum: 1 Panel label + 1 Headline value
- Maximum: All 7 fields can be used simultaneously

### How Data Maps to Visual
Each unique value in the Panel label field creates a separate panel. The panels are displayed either horizontally or vertically based on the Layout setting. Within each panel:
- Headline value appears prominently at the top
- Panel label appears below the headline
- Metric 1 and Metric 2 appear together on one line (if both enabled)
- Metric 3 and Highlight value appear together on another line (if both enabled)

## Formatting Options
All formatting options are available in the Format pane when the visual is selected.

### Visual Title
- **Show Title**: Toggle the display of a custom title
- **Title Text**: Enter the title text to display
- **Font Family**: Select font family for the title
- **Font Size**: Set title size in points
- **Bold/Italic/Underline**: Style toggles for title text
- **Alignment**: Set title alignment (Left, Center, Right)
- **Font Color**: Choose color for title text

### Callback Card Style
- **Layout**: Choose Horizontal (panels side-by-side) or Vertical (panels stacked)
- **Panel Background**: Background color for each panel
- **Panel Radius**: Corner radius for panels (0-20px)
- **Panel Padding**: Inner padding within each panel (0-30px)
- **Panel Gap**: Space between panels (0-50px)
- **Rate Font Size**: Font size for the headline value
- **Rate Color 1/2**: Colors for headline values (alternates if more than 2 panels)
- **Label Font Size**: Font size for panel labels
- **Detail Font Size**: Font size for metric values
- **Label Color**: Color for panel labels
- **Detail Color**: Color for metric values (except highlight)
- **Lost Revenue Color**: Special color for the highlight metric
- **Show Metric1**: Toggle display of Metric 1 and Metric 2
- **Show Metric3**: Toggle display of Metric 3
- **Show Highlight Value**: Toggle display of the highlight value alongside Metric 3

## Features
- **Interactive Panels**: Click any panel to cross-filter other visuals in the report
- **Tooltips**: Hover over panels to see detailed information about all metrics
- **Context Menu**: Right-click any panel for standard Power BI options (export data, spotlight, etc.)
- **Responsive Design**: Automatically adjusts to available space
- **High Contrast Support**: Automatically adapts to Windows High Contrast mode
- **Accessible**: Keyboard navigable with visible focus indicators
- **Flexible Layout**: Switch between horizontal and vertical orientations
- **Selective Metric Display**: Show/hide specific metrics to reduce clutter
- **Custom Styling**: Extensive color, font, and spacing options

## Limitations
- Maximum of 30,000 panels (limited by data reduction algorithm)
- Requires at least one Panel label and one Headline value to display
- Sort Order field only affects sequence, not visual appearance
- All metrics must be numeric values
- Tooltips show formatted values based on the field's format string in the data model
- Does not support drill-through functionality
- Does not support bookmark interactions beyond standard filtering

## Known Issues
None reported in the current version.

## Support
For technical support or questions about this visual:
- Visit: https://nexuscodex.nexus/support
- Email: support@nexuscodex.nexus
- GitHub Issues: https://github.com/Nexus-Codex-pbi/callback-card/issues