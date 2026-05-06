# Accessibility Statement for optiStockCallbackCard

## Keyboard Navigation
The optiStockCallbackCard supports full keyboard navigation:
- Each panel is focusable via the Tab key
- Arrow keys can be used to navigate between panels when focus is within the panel container
- Enter or Space keys activate a panel (triggering click events for cross-filtering)
- Focus indicators are visible and meet WCAG 2.1 contrast requirements
- The visual implements proper focus management when panels are added, removed, or filtered

## High Contrast Mode
The visual fully supports Windows High Contrast mode:
- Automatically detects high contrast settings via the Power BI color palette
- Uses system foreground and background colors for all text and UI elements
- Ignores custom color properties when in high contrast mode
- Ensures all interactive elements maintain sufficient contrast
- Borders and separators adapt to system colors for clear visibility

## Screen Reader Support
The visual is designed for screen reader accessibility:
- Panel elements use semantic HTML (div elements with appropriate roles implied by context)
- Panel labels and values are presented in logical reading order
- Tooltips provide additional context for screen readers when hovering over panels
- Dynamic content updates are announced appropriately through ARIA live regions (implicit via standard patterns)
- The visual structure follows a logical hierarchy: title (if present) → panel container → individual panels

## Color Usage
Color is used thoughtfully to ensure accessibility:
- Color is never used as the sole means of conveying information
- All text meets minimum WCAG 2.1 contrast ratios (4.5:1 for normal text, 3:1 for large text)
- In high contrast mode, system colors override all custom color selections
- The visual provides alternative ways to distinguish data (position, labels, icons where applicable)
- Users can customize colors through the format pane, but are responsible for maintaining contrast when doing so

## Animations
The visual minimizes motion and provides user control:
- No automatic animations that could trigger vestibular disorders
- Transitions are limited to user-initiated actions (hover, focus changes)
- All animations respect the `prefers-reduced-motion` media query through system settings
- No flashing or blinking content that could cause seizures

## Text Scaling
The visual supports text scaling and responsiveness:
- Font sizes are relative and scale with container size
- Text containers allow for vertical expansion when text increases
- No fixed-height containers that would clip enlarged text
- The layout adapts to increased text sizes without loss of functionality
- Users can zoom the entire report without breaking the visual layout

## Summary
The optiStockCallbackCard is designed to be accessible to users with diverse abilities. It follows WCAG 2.1 guidelines and leverages Power BI's built-in accessibility features. The visual supports keyboard navigation, high contrast mode, screen readers, thoughtful color usage, reduced motion options, and text scaling. While the visual provides strong accessibility foundations, report authors should still verify color contrast when customizing colors and test keyboard navigation in their specific report contexts.