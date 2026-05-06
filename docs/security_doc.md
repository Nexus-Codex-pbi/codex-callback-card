# Security Statement for optiStockCallbackCard

## External Network Access
The visual does not make any external network calls. All operations are performed client-side using the PowerBI visuals API and internal libraries (D3.js). No data is sent to or received from external servers.

## Telemetry
The visual does not collect or transmit any telemetry data. There are no tracking mechanisms or analytics integrated.

## Data Handling
The visual only processes data passed to it via the PowerBI data view during the `update` method. Data is held in memory temporarily for rendering and tooltips. No data is persisted to storage (local storage, cookies, IndexedDB, etc.) beyond the visual's lifetime.

## Script Safety
The visual does not use `eval()`, `Function()`, `setTimeout()` with string arguments, or `setInterval()` with string arguments. All JavaScript is strictly typed and compiled from TypeScript.

## DOM Escape
The visual avoids innerHTML and similar unsafe DOM insertion methods. All text content is set via `textContent` or D3's `.text()` method, which automatically escapes HTML entities. User-provided data (from data roles) is never interpreted as HTML.

## Cross-Visual Interaction
The visual uses the PowerBI SelectionManager to handle cross-filtering and highlighting. It does not modify or interact with other visuals outside the standard PowerBI extensibility model.

## Dependencies
The visual relies only on the following external libraries:
- powerbi-visuals-api (provided by PowerBI)
- d3 (version 5.x or 6.x, bundled via webpack)
- powerbi-visuals-utils-formattingmodel (provided by PowerBI)

All dependencies are vetted and do not introduce known security vulnerabilities.

## Permissions
The visual requires no special permissions beyond the standard PowerBI visual context. It does not attempt to access privileged browser APIs (e.g., geolocation, camera, microphone).

## Summary
optiStockCallbackCard is designed with security in mind. It executes entirely within the PowerBI sandbox, processes only the data provided by the report, and does not expose any external attack surface. The visual adheres to PowerBI security best practices and is safe for use in enterprise environments.