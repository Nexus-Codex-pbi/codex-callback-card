# User Guide – Codex Callback Card

## Overview
Side-by-side metric panels comparing callback rates across time windows with headline rate, counts, and lost revenue.

## 1. Adding the Visual
1. Import the `.pbiviz` file into Power BI Desktop
2. Locate the visual in the Visualizations pane
3. Drag it onto the report canvas

## 2. Data Binding
- **Panel label** (Required): Category label for each comparison panel.
- **Headline value** (Required): Primary metric displayed prominently in each panel (e.g., callback rate).
- **Metric 1** (Optional): First supporting metric per panel (e.g., callback count).
- **Metric 2** (Optional): Second supporting metric per panel (e.g., total count).
- **Metric 3** (Optional): Third supporting metric per panel (e.g., lost count).
- **Highlight value** (Optional): Highlighted metric displayed in accent colour per panel (e.g., lost revenue).
- **Sort Order** (Optional): Numeric value to control panel display order (ascending).

## 3. Formatting Options
**Visual Title**
- Show Title: Toggle title visibility.
- Title Text: Custom title text.
- Font Family, Font Size, Bold, Italic, Underline: Text formatting.
- Alignment: Left, Center, Right.
- Font Color: Title colour.

**Callback Card Style**
- Panel Background: Background colour of each panel.
- Panel Radius: Corner radius of panels.
- Panel Padding: Inner padding of panels.
- Panel Gap: Space between panels.
- Rate Font Size: Size of the headline value.
- Rate Color1, Rate Color2: Colours for the headline value (alternating).
- Label Font Size: Size of the panel label.
- Detail Font Size: Size of the supporting metrics.
- Lost Revenue Color: Colour for the highlight value.
- Show Metric1: Toggle visibility of the first supporting metric.
- Show Metric3: Toggle visibility of the third supporting metric.
- Show Highlight Value: Toggle visibility of the highlight value.
- Layout: Horizontal or Vertical arrangement of panels.
- Label Color: Colour of the panel label text.
- Detail Color: Colour of the supporting metrics text.

## 4. Features
- Displays multiple panels side-by-side (or stacked) for comparing time windows.
- Each panel shows a headline value (e.g., rate) and supporting metrics.
- Highlight value (e.g., lost revenue) displayed in an accent colour.
- Tooltips on each panel showing all bound fields.
- Click-to-filter: clicking a panel filters other visuals by that panel's category (if Panel label bound).
- Context menu (right-click) for cross-filtering and visual interactions.
- Supports horizontal and vertical layouts.
- High contrast mode support: adapts to Power BI themes.
- Keyboard navigation and screen reader friendly.

## 5. Limitations
- Only the first 30,000 rows of data are displayed (data reduction limit).
- Panels are sorted by the Sort Order field (ascending) if provided; otherwise, order is as in data.
- If Sort Order is not numeric, it is ignored for sorting.
- At least Panel label and Headline value must be bound for the visual to render.
- All metric fields are optional; if not bound, they are not displayed.

## 6. Support
For help or questions, visit https://nexuscodex.nexus/support