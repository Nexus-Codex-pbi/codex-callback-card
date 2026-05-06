# Codex Callback Card

Side-by-side metric panels comparing callback rates across time windows with headline rate, counts, and lost revenue.

## Installation
1. Download the `.pbiviz` file from AppSource or the release page.
2. In Power BI Desktop, go to the Visualizations pane.
3. Click the three dots (•••) → **Import from file**.
4. Select the `.pbiviz` file.
5. The visual appears in the Visualizations pane; drag it onto the report canvas.

## Data Roles
| Role | Display Name | Description | Kind | Required? |
|------|--------------|-------------|------|-----------|
| category | Panel label | Category label for each comparison panel | Grouping | Yes (at least one) |
| rate | Headline value | Primary metric displayed prominently in each panel | Measure | Yes |
| callbackCount | Metric 1 | First supporting metric per panel | Measure | No |
| totalCount | Metric 2 | Second supporting metric per panel | Measure | No |
| lostCount | Metric 3 | Third supporting metric per panel | Measure | No |
| lostRevenue | Highlight value | Highlighted metric displayed in accent colour per panel | Measure | No |
| sortOrder | Sort Order | Numeric value to control panel display order (ascending) | Measure | No |

*Notes:*
- The visual supports up to 30,000 categories (panels) via data reduction.
- At minimum, bind **category** and **rate** to render.
- Additional measure roles are optional and toggleable via the format pane.

## Formatting Options
### Visual Title
- **Show Title**: Toggle visual title visibility.
- **Title Text**: Custom title text.
- **Font Family**: Select font family for the title.
- **Font Size**: Adjust title font size (pt).
- **Bold / Italic / Underline**: Style toggles.
- **Alignment**: Left, center, or right.
- **Font Color**: Picker for title text color.

### Callback Card Style
- **Panel Background**: Fill color for each panel.
- **Panel Radius**: Corner radius (px) for panel rounding.
- **Panel Padding**: Inner spacing (px) inside each panel.
- **Panel Gap**: Spacing (px) between panels.
- **Rate Font Size**: Font size (pt) for the headline rate.
- **Rate Color1 / Rate Color2**: Colors for the headline rate (supports gradient or conditional based on data).
- **Label Font Size**: Font size (pt) for metric labels (e.g., "Callback Count").
- **Detail Font Size**: Font size (pt) for metric values.
- **Lost Revenue Color**: Accent color for the highlight metric.
- **Show Metric1**: Toggle visibility of the first supporting metric.
- **Show Metric3**: Toggle visibility of the third supporting metric.
- **Show Highlight Value**: Toggle visibility of the highlight (lost revenue) metric.
- **Layout**: Choose **Horizontal** (side-by-side panels) or **Vertical** (stacked panels).
- **Label Color**: Color for metric labels.
- **Detail Color**: Color for metric values.

## Support
For help or questions, visit https://nexuscodex.nexus/support
