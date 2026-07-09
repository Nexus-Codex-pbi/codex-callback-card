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
import { VisualFormattingSettingsModel, CallbackCardSettings, alignSelfFor, textAlignFor } from "./settings";
import { parseDataView, CallbackData, CallbackPanel } from "./dataParser";

import * as d3 from "d3";

import { dataViewWildcard } from "powerbi-visuals-utils-dataviewutils";
import { ColorHelper } from "powerbi-visuals-utils-colorutils";
import { toRgba } from "../../_shared/formatting/colorHelpers";

import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;

export class Visual implements IVisual {
    private host: IVisualHost;
    private target: HTMLElement;
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
    private rootDiv: d3.Selection<HTMLDivElement, unknown, null, undefined>;

    // Conditional formatting (fx) state — Highlight value colour (TRANS-04)
    private categoricalCategories: DataViewCategoryColumn | undefined;
    private lostRevenueColorHelper: ColorHelper | null = null;

    // Conditional formatting (fx) state — Headline (rate) colour, panel 0
    // only (TEXT-02: "primary value text colour"). Panel 1+ keep the static
    // rateColor2 alternation untouched (D-06 — no change to existing
    // multi-panel colour-alternation behaviour).
    private rateColorHelper: ColorHelper | null = null;

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

        // Context menu on the target — Policy 1180.2.5.
        // Matches Microsoft sample BarChart pattern: one listener on the root
        // element, fires for every right-click anywhere in the visual's bounds.
        this.target.addEventListener("contextmenu", (e: MouseEvent) => {
            this.selectionManager.showContextMenu({}, { x: e.clientX, y: e.clientY });
            e.preventDefault();
        });

        this.rootDiv = d3.select(options.element)
            .append("div")
            .attr("class", "callback-card-root")
            .style("width", "100%")
            .style("height", "100%")
            .style("overflow", "auto")
            .style("font-family", "Segoe UI, sans-serif")
            .style("position", "relative")
            .style("display", "flex")
            .style("flex-direction", "column");

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
                this.renderEmpty();
                this.events.renderingFinished(options);
                return;
            }

            this.formattingSettings = this.formattingSettingsService
                .populateFormattingSettingsModel(VisualFormattingSettingsModel, dv);

            const data = parseDataView(dv);
            if (!data || data.panels.length === 0) {
                this.panelSelectionIds = [];
                this.panelTooltipItems = [];
                this.renderEmpty();
                this.events.renderingFinished(options);
                return;
            }

            // Build selection IDs and tooltip data per panel
            const categories = dv.categorical?.categories?.[0];
            this.categoricalCategories = categories;
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

            // ─── Conditional formatting (fx) wiring — Highlight Value Colour
            // (TRANS-04). A bare `instanceKind: ConstantOrRule` declaration in
            // settings.ts does not make the fx button functional on its own
            // (Pitfall 5) — it also needs a `selector` (dataViewWildcard, so a
            // rule can match this measure's category instances/totals) and an
            // `altConstantSelector` bound to a concrete selectionId for the
            // "set for all" swatch edit path. Resolved per-panel at render via
            // ColorHelper.getColorForMeasure against each category's own
            // per-instance object overrides (categories.objects[i]) — the
            // correct category-scoped resolution, not a single flat value.
            const lostRevenueSlice = this.formattingSettings.callbackCardCard.lostRevenueColor;
            lostRevenueSlice.selector = dataViewWildcard.createDataViewWildcardSelector(
                dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals
            );
            lostRevenueSlice.altConstantSelector = this.panelSelectionIds[0]
                ? this.panelSelectionIds[0].getSelector()
                : undefined;
            this.lostRevenueColorHelper = new ColorHelper(
                this.host.colorPalette,
                { objectName: "callbackCardStyle", propertyName: "lostRevenueColor" },
                lostRevenueSlice.value.value
            );

            // ─── Conditional formatting (fx) wiring — Headline Colour
            // (TEXT-02). Same wildcard-selector + altConstantSelector +
            // ColorHelper.getColorForMeasure pattern as Highlight Value
            // Colour above, targeting the "rate" measure role so a fx rule
            // resolves against the bound Headline value field.
            const rateColorSlice = this.formattingSettings.callbackCardCard.rateColor1;
            rateColorSlice.selector = dataViewWildcard.createDataViewWildcardSelector(
                dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals
            );
            rateColorSlice.altConstantSelector = this.panelSelectionIds[0]
                ? this.panelSelectionIds[0].getSelector()
                : undefined;
            this.rateColorHelper = new ColorHelper(
                this.host.colorPalette,
                { objectName: "callbackCardStyle", propertyName: "rateColor1" },
                rateColorSlice.value.value
            );

            this.render(data, options.viewport.width, options.viewport.height);
            this.events.renderingFinished(options);
        } catch (e) {
            this.events.renderingFailed(options, String(e));
        }
    }

    private render(data: CallbackData, width: number, height: number): void {
        this.rootDiv.selectAll("*").remove();

        // ─── Dedicated background layer (D-05) ─────────────────────────
        // this.rootDiv is the visual's own content div (a child of
        // this.target, which is where the contextmenu listener lives —
        // see constructor lines ~53-59, UNTOUCHED). Styling rootDiv's own
        // background-color is not a new overlay: it never sits above the
        // contextmenu-bearing target, so it cannot swallow empty-space
        // right-clicks (T-04-01). `?? default` on both reads, with the
        // transparency default overridden to 100 in settings.ts (this
        // visual's rootDiv was never painted before this plan — fully
        // transparent), means an OLD saved report (properties undefined)
        // renders alpha 0 — pixel-identical to "no background painted",
        // per D-06.
        const background = this.formattingSettings.background;
        const bgHex = background.backgroundColor.value?.value ?? "#ffffff";
        const bgTransparencyPct = background.transparency.value ?? 100;
        this.rootDiv.style("background-color", toRgba(bgHex, bgTransparencyPct));

        // Internal title (rendered inside iframe so right-click on it satisfies
        // Policy 1180.2.5 — same approach as Heatmap Matrix). Now sourced from
        // the shared _shared/formatting/titleSettings.ts card (D-13/D-14).
        const t = this.formattingSettings.titleSettings;
        if (t?.showTitle?.value && t?.titleText?.value) {
            const titleAlignVal = String((t as any).titleAlign?.value || "left");
            const titleEl = document.createElement("div");
            titleEl.className = "callback-card-title";
            titleEl.textContent = t.titleText.value;
            if (t.titleFontFamily?.value) titleEl.style.fontFamily = t.titleFontFamily.value;
            if (t.titleFontSize?.value) titleEl.style.fontSize = `${t.titleFontSize.value}px`;
            titleEl.style.fontWeight = t.titleBold?.value ? "700" : "400";
            titleEl.style.fontStyle = t.titleItalic?.value ? "italic" : "normal";
            titleEl.style.textDecoration = t.titleUnderline?.value ? "underline" : "none";
            titleEl.style.alignSelf = alignSelfFor(titleAlignVal);
            titleEl.style.textAlign = textAlignFor(titleAlignVal);
            if (t.titleColor?.value?.value) {
                titleEl.style.color = this.isHighContrast ? this.hcForeground : t.titleColor.value.value;
            }
            titleEl.style.padding = "8px 12px 4px";
            (this.rootDiv.node() as HTMLElement).appendChild(titleEl);
        }

        const s = this.formattingSettings.callbackCardCard;
        const isHorizontal = (s.layout.value as any)?.value !== "vertical";
        const panelGap = s.panelGap.value;
        const panelPad = s.panelPadding.value;
        const panelRadius = s.panelRadius.value;
        const panelBg = this.isHighContrast ? this.hcBackground : s.panelBackground.value.value;
        const rateColors = this.isHighContrast
            ? [this.hcForeground, this.hcForeground]
            : [s.rateColor1.value.value, s.rateColor2.value.value];
        const labelColor = this.isHighContrast ? this.hcForeground : s.labelColor.value.value;
        const detailColor = this.isHighContrast ? this.hcForeground : s.detailColor.value.value;
        const rateFontSize = s.rateFontSize.value;
        const labelFontSize = s.labelFontSize.value;
        const detailFontSize = s.detailFontSize.value;
        // Formatting now comes from each measure's PBI format string

        // ─── Text treatment (font family/weight/style/decoration/alignment,
        // TEXT-01/TEXT-02/TITLE-01) — each `?? default` fallback reproduces
        // this visual's PRE-EXISTING hardcoded style exactly when an old
        // saved report has none of these new properties set (D-06):
        //   rate: was hardcoded font-weight 700   -> rateBold defaults true
        //   label: was hardcoded font-weight 500  -> labelBold defaults true
        //   detail: no font-weight set (normal)   -> detailBold defaults false
        // "Bold" renders 700; "not bold" renders each surface's own
        // pre-existing rest-weight (see weightFor below) rather than a flat
        // 400, so the default (off) state is pixel-identical to before.
        const weightFor = (bold: boolean | undefined, restWeight: string): string => bold ? "700" : restWeight;

        const rateFontFamily = s.rateFontFamily.value || "Segoe UI, sans-serif";
        const rateWeight = weightFor(s.rateBold.value, "700");
        const rateStyle = s.rateItalic.value ? "italic" : "normal";
        const rateDecoration = s.rateUnderline.value ? "underline" : "none";
        const rateAlignVal = String((s as any).rateAlign?.value || "center");

        const labelFontFamily = s.labelFontFamily.value || "Segoe UI, sans-serif";
        const labelWeight = weightFor(s.labelBold.value, "500");
        const labelStyle = s.labelItalic.value ? "italic" : "normal";
        const labelDecoration = s.labelUnderline.value ? "underline" : "none";
        const labelAlignVal = String((s as any).labelAlign?.value || "center");

        const detailFontFamily = s.detailFontFamily.value || "Segoe UI, sans-serif";
        const detailWeight = weightFor(s.detailBold.value, "400");
        const detailStyle = s.detailItalic.value ? "italic" : "normal";
        const detailDecoration = s.detailUnderline.value ? "underline" : "none";
        const detailAlignVal = String((s as any).detailAlign?.value || "center");

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
            .style("flex", "1 1 auto")
            .style("min-height", "0")
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

            // Headline value — fx wired on panel 0 only (rateColor1, TEXT-02);
            // panel 1+ keeps the existing static rateColor2 alternation.
            if (panel.rate !== null) {
                const instanceObjects = this.categoricalCategories?.objects?.[i];
                const resolvedRateColor = this.isHighContrast
                    ? this.hcForeground
                    : (i === 0
                        ? (this.rateColorHelper?.getColorForMeasure(instanceObjects, "rate") ?? rateColors[0])
                        : rateColors[i % rateColors.length]);
                panelDiv.append("div")
                    .style("font-size", `${rateFontSize}px`)
                    .style("font-family", rateFontFamily)
                    .style("font-weight", rateWeight)
                    .style("font-style", rateStyle)
                    .style("text-decoration", rateDecoration)
                    .style("color", resolvedRateColor)
                    .style("line-height", "1.1")
                    .style("align-self", alignSelfFor(rateAlignVal))
                    .style("text-align", textAlignFor(rateAlignVal))
                    .text(this.formatValue(panel.rate, panel.rateFormat));
            }

            // Panel label
            panelDiv.append("div")
                .style("font-size", `${labelFontSize}px`)
                .style("font-family", labelFontFamily)
                .style("color", labelColor)
                .style("margin-top", "4px")
                .style("font-weight", labelWeight)
                .style("font-style", labelStyle)
                .style("text-decoration", labelDecoration)
                .style("align-self", alignSelfFor(labelAlignVal))
                .style("text-align", textAlignFor(labelAlignVal))
                .text(panel.window);

            // Metric 1 / Metric 2
            if (s.showMetric1.value && panel.callbackCount !== null) {
                const metric2Str = panel.totalCount !== null
                    ? ` / ${this.formatValue(panel.totalCount, panel.totalCountFormat)}`
                    : "";
                panelDiv.append("div")
                    .style("font-size", `${detailFontSize}px`)
                    .style("font-family", detailFontFamily)
                    .style("color", detailColor)
                    .style("margin-top", "8px")
                    .style("font-weight", detailWeight)
                    .style("font-style", detailStyle)
                    .style("text-decoration", detailDecoration)
                    .style("align-self", alignSelfFor(detailAlignVal))
                    .style("text-align", textAlignFor(detailAlignVal))
                    .text(`${this.formatValue(panel.callbackCount, panel.callbackCountFormat)}${metric2Str}`);
            }

            // Metric 3 + Highlight value
            if (s.showMetric3.value && panel.lostCount !== null) {
                const metricLine = panelDiv.append("div")
                    .style("font-size", `${detailFontSize}px`)
                    .style("font-family", detailFontFamily)
                    .style("font-weight", detailWeight)
                    .style("font-style", detailStyle)
                    .style("text-decoration", detailDecoration)
                    .style("margin-top", "4px")
                    .style("align-self", alignSelfFor(detailAlignVal))
                    .style("text-align", textAlignFor(detailAlignVal));

                metricLine.append("span")
                    .style("color", detailColor)
                    .text(this.formatValue(panel.lostCount, panel.lostCountFormat));

                if (s.showHighlightValue.value && panel.lostRevenue !== null) {
                    const instanceObjects = this.categoricalCategories?.objects?.[i];
                    const resolvedLostColor = this.isHighContrast
                        ? this.hcForeground
                        : (this.lostRevenueColorHelper?.getColorForMeasure(instanceObjects, "lostRevenue")
                            ?? s.lostRevenueColor.value.value);
                    metricLine.append("span")
                        .style("color", resolvedLostColor)
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
    private renderEmpty(): void {
        this.rootDiv.selectAll("*").remove();

        // Dedicated background layer (D-05) — same rootDiv as render(), so
        // the landing/empty state also honours the Background card. Guarded
        // for the very first update() (no dataViews at all), where
        // formattingSettings has not yet been populated.
        const background = this.formattingSettings?.background;
        const bgHex = background?.backgroundColor.value?.value ?? "#ffffff";
        const bgTransparencyPct = background?.transparency.value ?? 100;
        this.rootDiv.style("background-color", toRgba(bgHex, bgTransparencyPct));

        const color = this.isHighContrast ? this.hcForeground : "#666666";
        const landing = this.rootDiv.append("div")
            .style("width", "100%")
            .style("height", "100%")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("align-items", "center")
            .style("justify-content", "center")
            .style("padding", "16px")
            .style("box-sizing", "border-box")
            .style("text-align", "center")
            .style("color", color);
        landing.append("div")
            .style("font-size", "14px")
            .style("font-weight", "600")
            .style("margin-bottom", "6px")
            .text("Codex Callback Card");
        landing.append("div")
            .style("font-size", "12px")
            .text("Add a Panel label and a Headline value measure. Optional: Metric 1/2/3, Highlight value, Sort Order.");
    }

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
