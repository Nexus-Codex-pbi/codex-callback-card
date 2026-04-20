"use strict";

import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;
import ITooltipService = powerbi.extensibility.ITooltipService;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import DataView = powerbi.DataView;

import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { VisualFormattingSettingsModel, CallbackCardSettings } from "./settings";
import { parseDataView, CallbackData, CallbackPanel } from "./dataParser";

import * as d3 from "d3";

export class Visual implements IVisual {
    private host: IVisualHost;
    private target: HTMLElement;
    private root: d3.Selection<HTMLDivElement, unknown, null, undefined>;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private events: IVisualEventService;
    private selectionManager: ISelectionManager;
    private localizationManager: ILocalizationManager;
    private tooltipService: ITooltipService;
    private isHighContrast: boolean = false;
    private hcForeground: string = "";
    private hcBackground: string = "";

    // State for tooltips and cross-filtering
    private panelSelectionIds: ISelectionId[] = [];
    private panelTooltipItems: VisualTooltipDataItem[][] = [];
    private overlay: HTMLElement;
    private rootDiv: d3.Selection<HTMLDivElement, unknown, null, undefined>;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.target = options.element;
        this.target.style.margin = "0";
        this.target.style.padding = "0";
        this.target.style.overflow = "hidden";
        this.target.style.display = "block";
        this.events = options.host.eventService;
        this.selectionManager = this.host.createSelectionManager();
        this.tooltipService = options.host.tooltipService;
        this.localizationManager = this.host.createLocalizationManager();
        this.formattingSettingsService = new FormattingSettingsService();

        this.rootDiv = d3.select(options.element)
            .append("div")
            .attr("class", "callback-card-root")
            .style("width", "100%")
            .style("height", "100%")
            .style("overflow", "auto")
            .style("font-family", "Segoe UI, sans-serif")
            .style("position", "relative");

        // Full-size invisible overlay catches contextmenu in any empty
        // space above/below/around content (title gap, subtitle space)
        // — Policy 1180.2.5. Content renders on top since appended after.
        this.overlay = this.target.appendChild(document.createElement("div"));
        this.overlay.style.position = "absolute";
        this.overlay.style.top = "0";
        this.overlay.style.left = "0";
        this.overlay.style.width = "100%";
        this.overlay.style.height = "100%";
        this.overlay.style.pointerEvents = "auto";
        this.overlay.style.zIndex = "1";

        // Context menu. Listener on overlay (empty space) + rootDiv (content area).
        this.overlay.addEventListener("contextmenu", (e: MouseEvent) => {
            this.selectionManager.showContextMenu({}, { x: e.clientX, y: e.clientY });
            e.preventDefault();
        });
        (this.rootDiv.node() as HTMLElement).addEventListener("contextmenu", (e: MouseEvent) => {
            this.selectionManager.showContextMenu({}, { x: e.clientX, y: e.clientY });
            e.preventDefault();
        });

        // Allow deselection by registering with the selection manager
        this.selectionManager.registerOnSelectCallback(() => {});
    }

    public update(options: VisualUpdateOptions): void {
        this.events.renderingStarted(options);
        try {
            // High contrast detection
            const colorPalette = this.host.colorPalette as any;
            if (colorPalette.isHighContrast) {
                this.isHighContrast = true;
                this.hcForeground = colorPalette.foreground.value;
                this.hcBackground = colorPalette.background.value;
            } else {
                this.isHighContrast = false;
            }

            const dv: DataView = options.dataViews?.[0];
            if (!dv) {
                this.rootDiv.selectAll("*").remove();
                this.events.renderingFinished(options);
                return;
            }

            this.formattingSettings = this.formattingSettingsService
                .populateFormattingSettingsModel(VisualFormattingSettingsModel, dv);

            const data = parseDataView(dv);
            if (!data || data.panels.length === 0) {
                this.rootDiv.selectAll("*").remove();
                this.panelSelectionIds = [];
                this.panelTooltipItems = [];
                this.events.renderingFinished(options);
                return;
            }

            // Build selection IDs and tooltip data per panel
            const categories = dv.categorical?.categories?.[0];
            this.panelSelectionIds = [];
            this.panelTooltipItems = [];
            for (let i = 0; i < data.panels.length; i++) {
                if (categories) {
                    this.panelSelectionIds.push(
                        this.host.createSelectionIdBuilder()
                            .withCategory(categories, i)
                            .createSelectionId()
                    );
                }
                const panel = data.panels[i];
                const items: VisualTooltipDataItem[] = [
                    { displayName: "Panel", value: panel.window }
                ];
                if (panel.rate !== null) {
                    items.push({ displayName: "Headline", value: this.formatValue(panel.rate, panel.rateFormat) });
                }
                if (panel.callbackCount !== null) {
                    items.push({ displayName: "Metric 1", value: this.formatValue(panel.callbackCount, panel.callbackCountFormat) });
                }
                if (panel.totalCount !== null) {
                    items.push({ displayName: "Metric 2", value: this.formatValue(panel.totalCount, panel.totalCountFormat) });
                }
                if (panel.lostCount !== null) {
                    items.push({ displayName: "Metric 3", value: this.formatValue(panel.lostCount, panel.lostCountFormat) });
                }
                if (panel.lostRevenue !== null) {
                    items.push({ displayName: "Highlight", value: this.formatValue(panel.lostRevenue, panel.lostRevenueFormat) });
                }
                this.panelTooltipItems.push(items);
            }

            this.render(data, options.viewport.width, options.viewport.height);
            this.events.renderingFinished(options);
        } catch (e) {
            this.events.renderingFailed(options, String(e));
        }
    }

    private render(data: CallbackData, width: number, height: number): void {
        this.root.selectAll("*").remove();

        const s = this.formattingSettings.callbackCardCard;
        const isHorizontal = (s.layout.value as any)?.value !== "vertical";
        const panelGap = s.panelGap.value;
        const panelPad = s.panelPadding.value;
        const panelRadius = s.panelRadius.value;
        const panelBg = this.isHighContrast ? this.hcBackground : s.panelBackground.value.value;
        const rateColors = this.isHighContrast
            ? [this.hcForeground, this.hcForeground]
            : [s.rateColor1.value.value, s.rateColor2.value.value];
        const lostColor = this.isHighContrast ? this.hcForeground : s.lostRevenueColor.value.value;
        const labelColor = this.isHighContrast ? this.hcForeground : s.labelColor.value.value;
        const detailColor = this.isHighContrast ? this.hcForeground : s.detailColor.value.value;
        const rateFontSize = s.rateFontSize.value;
        const labelFontSize = s.labelFontSize.value;
        const detailFontSize = s.detailFontSize.value;
        // Formatting now comes from each measure's PBI format string

        const panelCount = data.panels.length;

        // Container flexbox. Outer padding removed so panels fill the visual
        // edge-to-edge; any breathing room comes from panelPadding (inside
        // each panel) instead. This eliminates an empty outer strip between
        // the container's border and the first/last panel, which PBI's
        // selection-chrome overlay seems to absorb events on.
        const container = this.rootDiv.append("div")
            .style("display", "flex")
            .style("flex-direction", isHorizontal ? "row" : "column")
            .style("gap", `${panelGap}px`)
            .style("width", "100%")
            .style("height", "100%")
            .style("box-sizing", "border-box");

        data.panels.forEach((panel: CallbackPanel, i: number) => {
            const panelDiv = container.append("div")
                .style("flex", "1")
                .style("background", panelBg)
                .style("border-radius", `${panelRadius}px`)
                .style("padding", `${panelPad}px`)
                .style("display", "flex")
                .style("flex-direction", "column")
                .style("align-items", "center")
                .style("justify-content", "center")
                .style("box-sizing", "border-box")
                .style("min-width", "0")
                .style("cursor", "pointer");

            // Tooltip on panel hover
            const panelNode = panelDiv.node() as HTMLElement;
            panelNode.addEventListener("mousemove", (e: MouseEvent) => {
                const items = this.panelTooltipItems[i];
                if (items && items.length > 0) {
                    this.tooltipService.show({
                        coordinates: [e.clientX, e.clientY],
                        isTouchEvent: false,
                        dataItems: items,
                        identities: this.panelSelectionIds[i] ? [this.panelSelectionIds[i]] : []
                    });
                }
            });
            panelNode.addEventListener("mouseleave", () => {
                this.tooltipService.hide({ isTouchEvent: false, immediately: false });
            });

            // Click to cross-filter
            panelNode.addEventListener("click", (e: MouseEvent) => {
                if (this.panelSelectionIds[i]) {
                    this.selectionManager.select(this.panelSelectionIds[i], e.ctrlKey || e.metaKey);
                }
                e.stopPropagation();
            });

            // Context menu on each panel directly — covers clicks in the
            // panel's internal padding region (Policy 1180.2.5).
            panelNode.addEventListener("contextmenu", (e: MouseEvent) => {
                this.selectionManager.showContextMenu({}, { x: e.clientX, y: e.clientY });
                e.preventDefault();
            });

            // Headline value
            if (panel.rate !== null) {
                panelDiv.append("div")
                    .style("font-size", `${rateFontSize}px`)
                    .style("font-weight", "700")
                    .style("color", rateColors[i % rateColors.length])
                    .style("line-height", "1.1")
                    .text(this.formatValue(panel.rate, panel.rateFormat));
            }

            // Panel label
            panelDiv.append("div")
                .style("font-size", `${labelFontSize}px`)
                .style("color", labelColor)
                .style("margin-top", "4px")
                .style("font-weight", "500")
                .text(panel.window);

            // Metric 1 / Metric 2
            if (s.showMetric1.value && panel.callbackCount !== null) {
                const metric2Str = panel.totalCount !== null
                    ? ` / ${this.formatValue(panel.totalCount, panel.totalCountFormat)}`
                    : "";
                panelDiv.append("div")
                    .style("font-size", `${detailFontSize}px`)
                    .style("color", detailColor)
                    .style("margin-top", "8px")
                    .text(`${this.formatValue(panel.callbackCount, panel.callbackCountFormat)}${metric2Str}`);
            }

            // Metric 3 + Highlight value
            if (s.showMetric3.value && panel.lostCount !== null) {
                const metricLine = panelDiv.append("div")
                    .style("font-size", `${detailFontSize}px`)
                    .style("margin-top", "4px");

                metricLine.append("span")
                    .style("color", detailColor)
                    .text(this.formatValue(panel.lostCount, panel.lostCountFormat));

                if (s.showHighlightValue.value && panel.lostRevenue !== null) {
                    metricLine.append("span")
                        .style("color", lostColor)
                        .style("font-weight", "600")
                        .text(` / ${this.formatValue(panel.lostRevenue, panel.lostRevenueFormat)}`);
                }
            }
        });
    }

    /**
     * Format a value using the PBI format string from the measure.
     * Handles percentages, currency, decimals, and plain numbers.
     * Falls back to locale string if no format provided.
     */
    private formatValue(n: number, format: string | null): string {
        if (!format) {
            return n.toLocaleString("en-AU");
        }

        // Percentage formats: "0.00%;-0.00%;0.00%", "0%", "0.0%", etc.
        if (format.indexOf("%") >= 0) {
            // PBI stores percentages as decimals (0.046 = 4.6%)
            const pct = n * 100;
            // Count decimal places from format
            const match = format.match(/0\.(0+)%/);
            const decimals = match ? match[1].length : 0;
            return `${pct.toFixed(decimals)}%`;
        }

        // Currency formats: "$#,##0", "$#,##0.00", "£#,##0", etc.
        const currMatch = format.match(/^([^#0]*)(#[,#]*0(?:\.0+)?)/);
        if (currMatch && currMatch[1] && /[\$£€¥]/.test(currMatch[1])) {
            const symbol = currMatch[1].trim();
            const decMatch = format.match(/\.([0]+)/);
            const decimals = decMatch ? decMatch[1].length : 0;
            return `${symbol}${n.toLocaleString("en-AU", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
        }

        // Decimal formats: "0.0", "0.00", "#,##0", "#,##0.00", etc.
        const decMatch = format.match(/\.([0#]+)/);
        const decimals = decMatch ? decMatch[1].replace(/#/g, "").length : 0;
        return n.toLocaleString("en-AU", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    public destroy(): void {
        this.rootDiv?.selectAll("*").remove();
        this.rootDiv = null;
        this.target = null;
    }
}
