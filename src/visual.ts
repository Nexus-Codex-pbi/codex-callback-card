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
import { toRgba } from "./shared/colorHelpers";
import { Band, Theme, accentToken, bandColor } from "./shared/bandEngine";
import { surfaceTokens, TABULAR_NUMS } from "./shared/designTokens";
import { makeCornerBrackets, CardSignatureHandle } from "./shared/cardSignature";
import { resolveCardSignature } from "./shared/cardSignatureSettings";
import { settle } from "./shared/motion";
import { applyHighContrast, statusGlyph } from "./shared/highContrast";

import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;

/** Luminance-based theme pick (same 0.55 threshold convention as the 01-15
 * pilot / utils contrastText): decides whether the resolved panel background
 * reads as a "dark" or "light" surface, so the v3 token set stays legible. */
function themeFor(hex: string): Theme {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(hex || "");
    if (!m) return "dark";
    const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? "light" : "dark";
}

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

    // v3 (01-16): corner-bracket signature handle — recreated per render
    // (render() clears rootDiv wholesale), destroyed in destroy()/renderEmpty.
    private cornerSignature: CardSignatureHandle | null = null;
    // v3 motion: last displayed headline per panel, so settle() only plays
    // when a panel's displayed value actually changes (never on a re-layout).
    private lastDisplayValues: string[] = [];

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
            lostRevenueSlice.altConstantSelector = undefined; // card-level constant persistence: swatch edits apply to ALL instances + round-trip into the pane (first-instance binding persisted a row-0-only override); fx rules stay per-instance via the wildcard selector;
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
            rateColorSlice.altConstantSelector = undefined; // card-level constant persistence: swatch edits apply to ALL instances + round-trip into the pane (first-instance binding persisted a row-0-only override); fx rules stay per-instance via the wildcard selector;
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
                // Adaptive default (D-16 sentinel): untouched shared-Title navy
                // swaps to the dark text token on dark surfaces (theme keyed
                // off the resolved panel background, same source as the v3
                // theme pick below).
                const setTitle = t.titleColor.value.value;
                const adaptiveTitle = setTitle === "#1a1a2e"
                    && themeFor(this.formattingSettings.callbackCardCard.panelBackground.value?.value ?? "#f5f4f0") === "dark"
                    ? surfaceTokens("dark").text : setTitle;
                titleEl.style.color = this.isHighContrast ? this.hcForeground : adaptiveTitle;
            }
            titleEl.style.padding = "8px 12px 4px";
            (this.rootDiv.node() as HTMLElement).appendChild(titleEl);
        }

        const s = this.formattingSettings.callbackCardCard;
        const isHorizontal = (s.layout.value as any)?.value !== "vertical";
        const panelGap = s.panelGap.value ?? 12;
        const panelPad = s.panelPadding.value ?? 16;
        const panelRadius = s.panelRadius.value ?? 8;

        // ─── v3 theme + the single HC branch point (01-16) ──────────────
        // Theme picked from the resolved panel background (user-set colour
        // honoured, D-16); applyHighContrast() is a no-op pass-through when
        // the host is not in high-contrast mode, so every colour read below
        // routes through it unconditionally.
        const resolvedPanelBgHex = s.panelBackground.value?.value ?? "#f5f4f0";
        const theme: Theme = themeFor(this.isHighContrast ? this.hcBackground : resolvedPanelBgHex);
        const hc = applyHighContrast(
            {
                isHighContrast: this.isHighContrast,
                foreground: { value: this.hcForeground },
                background: { value: this.hcBackground },
            },
            { fallbackColor: s.labelColor.value?.value ?? "#5e5d5a" }
        );
        const tokens = surfaceTokens(theme);
        // Glow budget: dark theme only, dropped entirely under HC (§8).
        const glowMix = hc.active ? 0 : (theme === "dark" ? 55 : 0);
        // The hairline divider (board: 1px, never a heavy rule, no shadow).
        const hairline = hc.active ? hc.color : tokens.border;

        const panelBg = hc.active ? hc.background : resolvedPanelBgHex;
        const rateColors = hc.active
            ? [hc.color, hc.color]
            : [s.rateColor1.value?.value ?? "#d4920a", s.rateColor2.value?.value ?? "#007064"];
        const labelColor = hc.active ? hc.color : (s.labelColor.value?.value ?? "#5e5d5a");
        const detailColor = hc.active ? hc.color : (s.detailColor.value?.value ?? "#5e5d5a");
        const rateFontSize = s.rateFontSize.value ?? 28;
        const labelFontSize = s.labelFontSize.value ?? 11;
        const detailFontSize = s.detailFontSize.value ?? 10;
        // Formatting now comes from each measure's PBI format string

        // ─── v3 band engine: per-side verdict (01-16) ────────────────────
        // This visual binds no target and no delta measure, so each side's
        // verdict is derived from its headline vs the FIRST panel — the
        // comparison baseline this card exists to show (panels are already
        // user-ordered via Sort Order). A documented, bounded derivation
        // mirroring the 01-15 pilot's implied-ratio approach. This visual
        // has no up/down-is-good setting, so the literal direction law
        // applies (increase = success, decrease = danger). Panel 0 (the
        // baseline) and any side without a computable delta carry no
        // verdict — their chrome falls back to the shared accent token and
        // no delta chip renders (the board's own degradation order).
        const baseRate = data.panels[0]?.rate ?? null;
        const sideDeltaFor = (i: number, rate: number | null): number | null => {
            if (i === 0 || rate === null || baseRate === null) return null;
            if (!Number.isFinite(baseRate) || baseRate === 0 || !Number.isFinite(rate)) return null;
            return (rate - baseRate) / Math.abs(baseRate);
        };

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
        const rateAlignVal = String((s as any).rateAlign?.value || "left");

        const labelFontFamily = s.labelFontFamily.value || "Segoe UI, sans-serif";
        const labelWeight = weightFor(s.labelBold.value, "500");
        const labelStyle = s.labelItalic.value ? "italic" : "normal";
        const labelDecoration = s.labelUnderline.value ? "underline" : "none";
        const labelAlignVal = String((s as any).labelAlign?.value || "left");

        const detailFontFamily = s.detailFontFamily.value || "Segoe UI, sans-serif";
        const detailWeight = weightFor(s.detailBold.value, "400");
        const detailStyle = s.detailItalic.value ? "italic" : "normal";
        const detailDecoration = s.detailUnderline.value ? "underline" : "none";
        const detailAlignVal = String((s as any).detailAlign?.value || "left");

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

        // Trim the per-panel motion memory when the panel count shrinks.
        this.lastDisplayValues.length = Math.min(this.lastDisplayValues.length, data.panels.length);

        data.panels.forEach((panel: CallbackPanel, i: number) => {
            // v3 per-side verdict token — ONE colour drives dot + chip (§2).
            const sideDelta = sideDeltaFor(i, panel.rate);
            const sideBand: Band | null = sideDelta === null ? null : (sideDelta >= 0 ? "success" : "danger");
            const sideToken = hc.active
                ? hc.color
                : (sideBand ? bandColor(sideBand, theme) : accentToken(theme));

            const panelDiv = container.append("div")
                .style("flex", "1")
                .style("background", panelBg)
                .style("border-radius", `${panelRadius}px`)
                .style("padding", `${panelPad}px`)
                .style("display", "flex")
                .style("flex-direction", "column")
                .style("align-items", "stretch")
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

            // ─── Eyebrow row (v2 board): band-tinted status dot + panel
            // label, ABOVE the value. Label keeps every existing font/colour
            // /alignment property; the uppercase micro-tracking treatment is
            // new default chrome only (D-16).
            const eyebrowRow = panelDiv.append("div")
                .style("display", "flex")
                .style("align-items", "center")
                .style("gap", "7px")
                .style("align-self", alignSelfFor(labelAlignVal))
                .style("max-width", "100%");

            eyebrowRow.append("span")
                .attr("class", "callback-v2-dot")
                .style("width", "11px")
                .style("height", "11px")
                .style("border-radius", "50%")
                .style("flex", "0 0 auto")
                .style("background", hc.active
                    ? hc.color
                    : `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${sideToken} 35%, white), ${sideToken} 55%, color-mix(in srgb, ${sideToken} 55%, black))`)
                .style("box-shadow", glowMix > 0
                    ? `0 0 8px color-mix(in srgb, ${sideToken} ${glowMix}%, transparent)`
                    : "none");

            eyebrowRow.append("span")
                .style("font-size", `${labelFontSize}px`)
                .style("font-family", labelFontFamily)
                .style("color", labelColor)
                .style("font-weight", labelWeight)
                .style("font-style", labelStyle)
                .style("text-decoration", labelDecoration)
                .style("text-transform", "uppercase")
                .style("letter-spacing", "0.16em")
                .style("text-align", textAlignFor(labelAlignVal))
                .style("overflow", "hidden")
                .style("text-overflow", "ellipsis")
                .style("white-space", "nowrap")
                .text(panel.window);

            // Headline value — fx wired on panel 0 only (rateColor1, TEXT-02);
            // panel 1+ keeps the existing static rateColor2 alternation.
            // v2 board: tabular numerals, tight line-height, settle-once motion.
            if (panel.rate !== null) {
                const instanceObjects = this.categoricalCategories?.objects?.[i];
                const resolvedRateColor = hc.active
                    ? hc.color
                    : (i === 0
                        ? (this.rateColorHelper?.getColorForMeasure(instanceObjects, "rate") ?? rateColors[0])
                        : rateColors[i % rateColors.length]);
                const displayed = this.formatValue(panel.rate, panel.rateFormat);
                const valueSel = panelDiv.append("div")
                    .attr("class", "callback-v2-value")
                    .style("font-size", `${rateFontSize}px`)
                    .style("font-family", rateFontFamily)
                    .style("font-weight", rateWeight)
                    .style("font-style", rateStyle)
                    .style("text-decoration", rateDecoration)
                    .style("color", resolvedRateColor)
                    .style("line-height", "0.95")
                    .style("letter-spacing", "-0.01em")
                    .style("font-feature-settings", TABULAR_NUMS)
                    .style("margin-top", "9px")
                    .style("align-self", alignSelfFor(rateAlignVal))
                    .style("text-align", textAlignFor(rateAlignVal))
                    .text(displayed);
                if (this.lastDisplayValues[i] !== displayed) {
                    settle(valueSel.node() as HTMLElement, [
                        { opacity: 0.35, transform: "translateY(3px)" },
                        { opacity: 1, transform: "translateY(0)" },
                    ], { duration: 220 });
                    this.lastDisplayValues[i] = displayed;
                }
            }

            // ─── Footer row (v2 board): standard delta chip (matches KPI
            // Card v2 — same pill token/shape/arrow) + a "vs baseline"
            // sub-label. Only sides with a computable delta get a chip;
            // under HC the chip drops its tinted fill for a system-colour
            // outline and pairs the arrow with a status glyph (§8).
            if (sideDelta !== null) {
                const footerRow = panelDiv.append("div")
                    .style("display", "flex")
                    .style("align-items", "center")
                    .style("gap", "9px")
                    .style("flex-wrap", "wrap")
                    .style("margin-top", "9px")
                    .style("align-self", alignSelfFor(detailAlignVal));

                const arrow = sideDelta >= 0 ? "▲" : "▼";
                const sign = sideDelta >= 0 ? "+" : "−";
                const glyph = hc.active && sideBand ? statusGlyph(sideBand) : "";
                const chipText = `${glyph ? glyph + " " : ""}${arrow} ${sign}${Math.abs(sideDelta * 100).toFixed(1)}%`;

                const chip = footerRow.append("span")
                    .attr("class", "callback-v2-pill")
                    .style("display", "inline-flex")
                    .style("align-items", "center")
                    .style("font-size", "12px")
                    .style("font-weight", "700")
                    .style("font-family", detailFontFamily)
                    .style("font-feature-settings", TABULAR_NUMS)
                    .style("padding", "3px 9px")
                    .style("border-radius", "999px")
                    .style("line-height", "1.3")
                    .style("color", sideToken)
                    .text(chipText);
                if (hc.active) {
                    chip.style("background", "transparent")
                        .style("border", `${hc.borderWidth}px solid ${hc.color}`);
                } else {
                    chip.style("background", `color-mix(in srgb, ${sideToken} 15%, transparent)`);
                }

                footerRow.append("span")
                    .style("font-size", "11.5px")
                    .style("font-family", detailFontFamily)
                    .style("color", detailColor)
                    .text(`vs ${data.panels[0].window}`);

                // ─── LED-block sparkline strip (v2 board signature): 6
                // band-coloured blocks below each metric — the suite's
                // quantised texture, reading as a mini sparkline in the
                // band colour. Under HC: outlined system-colour blocks.
                const strip = panelDiv.append("div")
                    .style("display", "flex")
                    .style("gap", "4px")
                    .style("margin-top", "10px")
                    .style("width", "100%")
                    .style("align-self", "stretch");
                for (let bi = 0; bi < 6; bi++) {
                    const block = strip.append("span")
                        .style("flex", "1")
                        .style("height", "11px")
                        .style("border-radius", "2px");
                    if (hc.active) {
                        block.style("background", "transparent")
                            .style("border", `1px solid ${hc.color}`);
                    } else {
                        block.style("background", sideToken)
                            .style("box-shadow", glowMix > 0
                                ? `0 0 6px color-mix(in srgb, ${sideToken} ${Math.max(glowMix, 35)}%, transparent)`
                                : "none");
                    }
                }
            }

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
                    const resolvedLostColor = hc.active
                        ? hc.color
                        : (this.lostRevenueColorHelper?.getColorForMeasure(instanceObjects, "lostRevenue")
                            ?? s.lostRevenueColor.value?.value ?? "#e60e22");
                    metricLine.append("span")
                        .style("color", resolvedLostColor)
                        .style("font-weight", "600")
                        .text(` / ${this.formatValue(panel.lostRevenue, panel.lostRevenueFormat)}`);
                }
            }

            // ─── Hairline divider between sides (v2 board §3): a 1px rule
            // in the border token, both layouts, never a shadow.
            if (i < data.panels.length - 1) {
                const divider = container.append("div")
                    .attr("class", "callback-v2-divider")
                    .style("flex", "0 0 auto")
                    .style("align-self", "stretch")
                    .style("background", hairline);
                if (isHorizontal) {
                    divider.style("width", "1px");
                } else {
                    divider.style("height", "1px");
                }
            }
        });

        // ─── Corner-bracket card signature (v3, §4) — accent-tinted per the
        // board (never a band colour on this chrome), appended last so it
        // paints above the title panel; recreated each render because
        // render() rebuilds rootDiv wholesale.
        this.cornerSignature?.destroy();
        const sigResolved = resolveCardSignature(this.formattingSettings.cardSignature, {
            autoHex: accentToken(theme), hcActive: hc.active, hcColor: hc.color, glowMix,
        });
        this.cornerSignature = sigResolved.visible
            ? makeCornerBrackets(
                this.rootDiv.node() as HTMLElement,
                sigResolved.hex,
                { variant: sigResolved.variant, mirror: true, glowMix, cardRadius: panelRadius }
            )
            : null;
    }

    /**
     * Format a value using the PBI format string from the measure.
     * Handles percentages, currency, decimals, and plain numbers.
     * Falls back to locale string if no format provided.
     */
    private renderEmpty(): void {
        this.cornerSignature?.destroy();
        this.cornerSignature = null;
        this.lastDisplayValues = [];
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
        this.cornerSignature?.destroy();
        this.cornerSignature = null;
        this.rootDiv?.selectAll("*").remove();
        this.rootDiv = null;
        this.target = null;
    }
}
