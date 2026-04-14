import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

const ConstantOrRule = powerbi.VisualEnumerationInstanceKinds.ConstantOrRule;

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

    rateFontSize = new formattingSettings.NumUpDown({
        name: "rateFontSize",
        displayName: "Headline font size",
        value: 28,
    });

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

    labelFontSize = new formattingSettings.NumUpDown({
        name: "labelFontSize",
        displayName: "Label font size",
        value: 11,
    });

    detailFontSize = new formattingSettings.NumUpDown({
        name: "detailFontSize",
        displayName: "Detail font size",
        value: 10,
    });

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

    layout = new formattingSettings.ItemDropdown({
        name: "layout",
        displayName: "Layout",
        items: [
            { displayName: "Horizontal", value: "horizontal" },
            { displayName: "Vertical", value: "vertical" },
        ],
        value: { displayName: "Horizontal", value: "horizontal" },
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
        this.rateFontSize,
        this.rateFormatString,
        this.rateColor1,
        this.rateColor2,
        this.labelFontSize,
        this.detailFontSize,
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
    callbackCardCard = new CallbackCardSettings();
    cards = [this.callbackCardCard];
}
