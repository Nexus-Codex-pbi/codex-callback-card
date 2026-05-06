# Developer Guide: optiStockCallbackCard

## Architecture
The optiStockCallbackCard follows a modular structure typical of Power BI visuals:

### File Structure
```
/src
  /visual.ts          - Main visual class implementing IVisual interface
  /dataParser.ts      - Data parsing logic converting DataView to internal model
  /settings.ts        - Settings model using powerbi-visuals-utils-formattingmodel
  /utils.ts           - Utility functions (formatValue, etc.)
/style
  /visual.less        - Styling (though styling is primarily done inline via D3)
/stringResources
  /en-US/resources.resjson - Localization strings
```

### Rendering Model
1. **Constructor**: Initializes DOM elements, sets up event listeners, creates services
2. **Update Method**: Main entry point called by Power BI when data or size changes
   - Processes dataView
   - Updates formatting settings
   - Parses data into internal model
   - Builds selection IDs and tooltip data
   - Calls render method
3. **Render Method**: Creates/updates SVG/DOM elements based on data
   - Clears container
   - Creates title element if configured
   - Creates container for panels (flexbox layout)
   - Iterates through panels creating interactive elements
   - Attaches event listeners for hover, click, context menu
4. **Event Handling**:
   - Mouse events for tooltip display (mousemove/mouseleave)
   - Click events for cross-filtering
   - Context menu event for right-click menu
   - Window resize handled through Power BI viewport updates

### Data Flow
Power BI DataView → dataParser.parseDataView() → Internal Model (CallbackData) → Visual Rendering

## Capabilities.json Summary
Key aspects from capabilities.json:

### Data Roles
- **category** (Grouping): Panel label - creates distinct panels
- **rate** (Measure): Headline value - primary metric
- **callbackCount** (Measure): Metric 1 - first supporting metric
- **totalCount** (Measure): Metric 2 - second supporting metric
- **lostCount** (Measure): Metric 3 - third supporting metric
- **lostRevenue** (Measure): Highlight value - accent metric
- **sortOrder** (Measure): Controls display order (ascending)

### Data Mapping
- Categorical: Single category field with top 30,000 reduction
- Values: Six measure fields (rate, callbackCount, totalCount, lostCount, lostRevenue, sortOrder)

### Features Enabled
- Highlight support (standard visual highlighting)
- Keyboard focus support
- Empty data view support (shows welcome message)
- Multi-selection support
- Tooltips (default and canvas types)
- No special privileges required

### Formatting Objects
- **titleSettings**: Controls visual title appearance
- **callbackCardStyle**: Controls panel layout, spacing, colors, fonts, visibility toggles

## APIs Used
The visual utilizes these Power BI APIs:

### Core APIs
- **IVisual/IHost**: Main interface for visual-host communication
- **IVisualEventService**: For rendering lifecycle events (started, finished, failed)
- **ISelectionManager**: Handles selection, cross-filtering, and context menus
- **ISelectionId**: Identifies data points for selection
- **ITooltipService**: Manages tooltip display and hiding
- **ILocalizationManager**: For localizing strings (though not heavily used)

### Utility Services
- **FormattingSettingsService**: From powerbi-visuals-utils-formattingmodel for managing format pane properties
- **ColorPalette**: Accessed via host for theme and high contrast colors

### D3 Usage
- **d3-selection**: For DOM manipulation and event binding
- Used to create and manage SVG/HTML elements in the container

## Performance Considerations
### Rendering Optimization
- **Element Reuse**: The visual removes all children before re-rendering (selectAll("*").remove()) which is acceptable given typical panel counts (<100)
- **Data Reduction**: Relies on Power BI's built-in top 30,000 reducer for categories
- **Minimal DOM**: Creates only necessary elements per panel (no excess wrappers)
- **Event Binding**: Attaches events directly to panel elements rather than using event delegation

### Data Processing
- **Parsing**: DataView parsing happens in dataParser.ts which extracts values and format strings
- **Selection ID Creation**: Creates one SelectionId per panel for cross-filtering
- **Tooltip Data**: Pre-builds tooltip arrays for efficiency during hover events

### Memory Management
- No persistent data storage between renders
- Selection IDs and tooltip data are recreated each update
- DOM elements are properly cleaned up on each render

## Accessibility Implementation
### Keyboard Support
- Panel elements are made focusable through implicit tabIndex (div elements are naturally focusable when interactive)
- Click and keyboard handlers both trigger the same selection action
- Focus styling relies on browser defaults enhanced by active interaction states

### ARIA and Screen Readers
- Uses semantic structure: container → panels → content in logical order
- Relies on native element semantics rather than explicit ARIA roles
- Tooltips provide additional context for screen reader users

### High Contrast Mode
- Detects high contrast via `host.colorPalette.isHighContrast`
- Uses system colors (`foreground.value`, `background.value`) when in HC mode
- Ignores custom color properties in HC mode to ensure readability

### Motion and Animation
- No automatic animations
- Only user-initiated interactions cause visual changes (hover, click)
- Respects system preferences through lack of animated transitions

## Security Compliance
As detailed in the security documentation:
- No external network requests
- No eval or dynamic code execution
- No data persistence (no localStorage, cookies, etc.)
- All DOM manipulation through approved D3 methods
- Context menu uses standard selection manager approach
- Only uses bundled dependencies (D3, Office UI Fabric utilities)

## Build & Packaging
### Development Setup
1. `npm install` - installs dependencies
2. `npm start` - starts webpack dev server for rapid development
3. `npm run build` - creates production build in /dist folder

### Dependencies
- **powerbi-visuals-api**: Core Power BI interfaces
- **powerbi-visuals-utils-formattingmodel**: For strongly-typed settings
- **d3-selection**: DOM manipulation
- **@types/** packages: TypeScript definitions

### Packaging Process
1. Webpack bundles all source files
2. pbiviz.json defines metadata and asset locations
3. Resources (images, schema) are copied to appropriate locations
4. Final .pbiviz package created for distribution

### Configuration
- **tsconfig.json**: TypeScript configuration targeting ES2015
- **package.json**: Scripts, dependencies, and package metadata
- **webpack.config.js**: (implied) Bundling configuration
- **eslint.config.mjs**: Linting rules

## Extensibility Points
While designed as a closed visual, the following areas could be extended:
- **dataParser.ts**: Modify to add calculated fields or different data shaping
- **settings.ts**: Add new formatting properties
- **visual.ts**: Add new interaction types or visual elements
- **style/visual.less**: Add CSS classes for complex styling (currently minimal use)

## Compatibility
- Built with API version 5.11.0
- Compatible with Power BI Desktop and Service
- Tested with modern browsers supported by Power BI
- Backward compatibility maintained within semantic versioning