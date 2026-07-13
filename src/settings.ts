import powerbi from "powerbi-visuals-api";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

import { BackgroundSettings } from "./shared/backgroundSettings";
import { TitleSettings } from "./shared/titleSettings";
import { alignSlice, alignSelfFor, textAlignFor, makeFontControl } from "./shared/textFormatting";
import { CardSignatureSettings } from "./shared/cardSignatureSettings";
import { BorderSettings } from "./shared/borderSettings";

const ConstantOrRule = powerbi.VisualEnumerationInstanceKinds.ConstantOrRule;

// TitleSettings + alignment helpers now live in _shared/formatting/ (D-13,
// D-14 — migrated onto the frozen v2 standard from Plan 10). Re-exported so
// visual.ts can import them from "./settings" (stable import path, zero
// churn on the consuming side).
export { TitleSettings, alignSlice, alignSelfFor, textAlignFor };

export class CallbackCardSettings extends FormattingSettingsCard {
    name = "callbackCardStyle";
    displayName = "Comparison Card";

    panelBackground = new formattingSettings.ColorPicker({
        name: "panelBackground",
        displayName: "Panel background",
        value: { value: "#f5f4f0" },
        instanceKind: ConstantOrRule
    });

    panelRadius = new formattingSettings.NumUpDown({
        name: "panelRadius",
        displayName: "Panel radius",
        value: 8,
    });

    panelPadding = new formattingSettings.NumUpDown({
        name: "panelPadding",
        displayName: "Panel padding",
        value: 16,
    });

    panelGap = new formattingSettings.NumUpDown({
        name: "panelGap",
        displayName: "Panel gap",
        value: 12,
    });

    // Headline (rate) text — FontControl composite reuses the existing
    // "rateFontSize" property name (D-06/D-07: additive-only, no schema
    // rename) alongside NEW sibling properties (family/bold/italic/
    // underline). Bold defaults true to match the previously-hardcoded
    // font-weight:700 on the headline div (render-nothing-default parity).
    private rateFontBundle = makeFontControl("rate", { fontSize: 28, bold: true });
    rateFontFamily = this.rateFontBundle.fontFamily;
    rateFontSize = this.rateFontBundle.fontSize;
    rateBold = this.rateFontBundle.bold;
    rateItalic = this.rateFontBundle.italic;
    rateUnderline = this.rateFontBundle.underline;
    rateFont = this.rateFontBundle.control;
    // v2 look (01-16, D-16): alignment DEFAULTS moved center -> left to ship
    // the board's left-rail reading order; a user-set alignment still
    // resolves exactly as before (visual.ts falls back to "left" only when
    // the property is unset).
    rateAlign = alignSlice("rateAlign", "left");

    rateFormatString = new formattingSettings.TextInput({
        name: "rateFormatString",
        displayName: "Headline format string",
        value: "0.0",
        placeholder: "e.g. 0.0, 0.00, 0",
    });

    rateColor1 = new formattingSettings.ColorPicker({
        name: "rateColor1",
        displayName: "Headline colour (panel 1)",
        value: { value: "#d4920a" },
        instanceKind: ConstantOrRule
    });

    rateColor2 = new formattingSettings.ColorPicker({
        name: "rateColor2",
        displayName: "Headline colour (panel 2)",
        value: { value: "#007064" },
        instanceKind: ConstantOrRule
    });

    // Panel label text — reuses "labelFontSize"; bold defaults true (closest
    // boolean match to the previously-hardcoded font-weight:500).
    private labelFontBundle = makeFontControl("label", { fontSize: 11, bold: true });
    labelFontFamily = this.labelFontBundle.fontFamily;
    labelFontSize = this.labelFontBundle.fontSize;
    labelBold = this.labelFontBundle.bold;
    labelItalic = this.labelFontBundle.italic;
    labelUnderline = this.labelFontBundle.underline;
    labelFont = this.labelFontBundle.control;
    labelAlign = alignSlice("labelAlign", "left");

    // Metric 1/2/3 detail text — reuses "detailFontSize"; bold defaults
    // false (matches the previously-unset, browser-normal font weight).
    private detailFontBundle = makeFontControl("detail", { fontSize: 10, bold: false });
    detailFontFamily = this.detailFontBundle.fontFamily;
    detailFontSize = this.detailFontBundle.fontSize;
    detailBold = this.detailFontBundle.bold;
    detailItalic = this.detailFontBundle.italic;
    detailUnderline = this.detailFontBundle.underline;
    detailFont = this.detailFontBundle.control;
    detailAlign = alignSlice("detailAlign", "left");

    lostRevenueColor = new formattingSettings.ColorPicker({
        name: "lostRevenueColor",
        displayName: "Highlight value colour",
        value: { value: "#e60e22" },
        instanceKind: ConstantOrRule
    });

    showMetric1 = new formattingSettings.ToggleSwitch({
        name: "showMetric1",
        displayName: "Show metric 1",
        value: true,
    });

    showMetric3 = new formattingSettings.ToggleSwitch({
        name: "showMetric3",
        displayName: "Show metric 3",
        value: true,
    });

    showHighlightValue = new formattingSettings.ToggleSwitch({
        name: "showHighlightValue",
        displayName: "Show highlight value",
        value: true,
    });

    // v2 look (01-16): display names match the design board's layout terms;
    // the PERSISTED values ("horizontal"/"vertical") and the default are
    // unchanged, so every saved report's layout choice still resolves (D-16).
    layout = new formattingSettings.ItemDropdown({
        name: "layout",
        displayName: "Layout",
        items: [
            { displayName: "Side by side", value: "horizontal" },
            { displayName: "Vertical stack", value: "vertical" },
        ],
        value: { displayName: "Side by side", value: "horizontal" },
    });

    labelColor = new formattingSettings.ColorPicker({
        name: "labelColor",
        displayName: "Label colour",
        value: { value: "#5e5d5a" },
        instanceKind: ConstantOrRule
    });

    detailColor = new formattingSettings.ColorPicker({
        name: "detailColor",
        displayName: "Detail colour",
        value: { value: "#5e5d5a" },
        instanceKind: ConstantOrRule
    });

    slices: FormattingSettingsSlice[] = [
        this.panelBackground,
        this.panelRadius,
        this.panelPadding,
        this.panelGap,
        this.rateFont,
        this.rateAlign,
        this.rateFormatString,
        this.rateColor1,
        this.rateColor2,
        this.labelFont,
        this.labelAlign,
        this.detailFont,
        this.detailAlign,
        this.lostRevenueColor,
        this.showMetric1,
        this.showMetric3,
        this.showHighlightValue,
        this.layout,
        this.labelColor,
        this.detailColor,
    ];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    cardSignature = new CardSignatureSettings();
    titleSettings = new TitleSettings();
    callbackCardCard = new CallbackCardSettings();
    background = new BackgroundSettings();
    visualBorder = new BorderSettings();

    constructor() {
        super();
        // D-06 default-preservation override (per-visual instance only —
        // _shared/formatting/backgroundSettings.ts itself is untouched,
        // D-11): this visual's rootDiv never had an explicit background
        // painted before this plan (no CSS rule, no JS style set) — it was
        // fully transparent, showing whatever sits behind the visual tile.
        // The frozen shared card's own default (opaque white, transparency
        // 0) would regress every old saved report on a non-default report
        // canvas colour/image. Overriding the TRANSPARENCY default to 100
        // on this instance makes toRgba(...) resolve to alpha 0 regardless
        // of colour — pixel-identical to "no background painted" (D-06).
        this.background.transparency.value = 100;
    }

    cards = [this.titleSettings, this.callbackCardCard, this.background,
        this.cardSignature, this.visualBorder
    ];
}
