"use strict";

import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import DataView = powerbi.DataView;

import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { VisualFormattingSettingsModel, CallbackCardSettings } from "./settings";
import { parseDataView, CallbackData, CallbackPanel } from "./dataParser";

import * as d3 from "d3";

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: d3.Selection<HTMLDivElement, unknown, null, undefined>;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();

        this.root = d3.select(options.element)
            .append("div")
            .attr("class", "callback-card-root")
            .style("width", "100%")
            .style("height", "100%")
            .style("overflow", "hidden")
            .style("font-family", "Segoe UI, sans-serif");
    }

    public update(options: VisualUpdateOptions): void {
        const dv: DataView = options.dataViews?.[0];
        if (!dv) {
            this.root.selectAll("*").remove();
            return;
        }

        this.formattingSettings = this.formattingSettingsService
            .populateFormattingSettingsModel(VisualFormattingSettingsModel, dv);

        const data = parseDataView(dv);
        if (!data || data.panels.length === 0) {
            this.root.selectAll("*").remove();
            return;
        }

        this.render(data, options.viewport.width, options.viewport.height);
    }

    private render(data: CallbackData, width: number, height: number): void {
        this.root.selectAll("*").remove();

        const s = this.formattingSettings.callbackCardCard;
        const isHorizontal = (s.layout.value as any)?.value !== "vertical";
        const panelGap = s.panelGap.value;
        const panelPad = s.panelPadding.value;
        const panelRadius = s.panelRadius.value;
        const panelBg = s.panelBackground.value.value;
        const rateColors = [s.rateColor1.value.value, s.rateColor2.value.value];
        const lostColor = s.lostRevenueColor.value.value;
        const labelColor = s.labelColor.value.value;
        const detailColor = s.detailColor.value.value;
        const rateFontSize = s.rateFontSize.value;
        const labelFontSize = s.labelFontSize.value;
        const detailFontSize = s.detailFontSize.value;

        const panelCount = data.panels.length;

        // Container flexbox
        const container = this.root.append("div")
            .style("display", "flex")
            .style("flex-direction", isHorizontal ? "row" : "column")
            .style("gap", `${panelGap}px`)
            .style("width", "100%")
            .style("height", "100%")
            .style("box-sizing", "border-box")
            .style("padding", "4px");

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
                .style("min-width", "0");

            // Headline rate
            if (panel.rate !== null) {
                const rateText = panel.rate < 1
                    ? `${panel.rate.toFixed(1)}%`
                    : `${panel.rate.toFixed(1)}%`;

                panelDiv.append("div")
                    .style("font-size", `${rateFontSize}px`)
                    .style("font-weight", "700")
                    .style("color", rateColors[i % rateColors.length])
                    .style("line-height", "1.1")
                    .text(rateText);
            }

            // Window label
            panelDiv.append("div")
                .style("font-size", `${labelFontSize}px`)
                .style("color", labelColor)
                .style("margin-top", "4px")
                .style("font-weight", "500")
                .text(panel.window);

            // Callback count: "X of Y returned"
            if (s.showCallbackCount.value && panel.callbackCount !== null) {
                const totalStr = panel.totalCount !== null
                    ? ` of ${this.formatNum(panel.totalCount)}`
                    : "";
                panelDiv.append("div")
                    .style("font-size", `${detailFontSize}px`)
                    .style("color", detailColor)
                    .style("margin-top", "8px")
                    .text(`${this.formatNum(panel.callbackCount)}${totalStr} returned`);
            }

            // Lost count + revenue
            if (s.showLostCount.value && panel.lostCount !== null) {
                const revStr = (s.showLostRevenue.value && panel.lostRevenue !== null)
                    ? ` = $${this.formatCurrency(panel.lostRevenue)}`
                    : "";

                const lostLine = panelDiv.append("div")
                    .style("font-size", `${detailFontSize}px`)
                    .style("margin-top", "4px");

                lostLine.append("span")
                    .style("color", detailColor)
                    .text(`${this.formatNum(panel.lostCount)} lost`);

                if (revStr) {
                    lostLine.append("span")
                        .style("color", lostColor)
                        .style("font-weight", "600")
                        .text(revStr);
                }
            }
        });
    }

    private formatNum(n: number): string {
        return n.toLocaleString("en-AU");
    }

    private formatCurrency(n: number): string {
        if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
        if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
        return n.toLocaleString("en-AU");
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
