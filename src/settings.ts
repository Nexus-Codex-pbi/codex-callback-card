import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

export class CallbackCardSettings extends FormattingSettingsCard {
    name = "callbackCardStyle";
    displayName = "Callback Card";

    panelBackground = new formattingSettings.ColorPicker({
        name: "panelBackground",
        displayName: "Panel background",
        value: { value: "#f5f4f0" },
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
        displayName: "Rate font size",
        value: 28,
    });

    rateColor1 = new formattingSettings.ColorPicker({
        name: "rateColor1",
        displayName: "Rate colour (panel 1)",
        value: { value: "#d4920a" },
    });

    rateColor2 = new formattingSettings.ColorPicker({
        name: "rateColor2",
        displayName: "Rate colour (panel 2)",
        value: { value: "#007064" },
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
        displayName: "Lost revenue colour",
        value: { value: "#e60e22" },
    });

    showCallbackCount = new formattingSettings.ToggleSwitch({
        name: "showCallbackCount",
        displayName: "Show callback count",
        value: true,
    });

    showLostCount = new formattingSettings.ToggleSwitch({
        name: "showLostCount",
        displayName: "Show lost count",
        value: true,
    });

    showLostRevenue = new formattingSettings.ToggleSwitch({
        name: "showLostRevenue",
        displayName: "Show lost revenue",
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
    });

    detailColor = new formattingSettings.ColorPicker({
        name: "detailColor",
        displayName: "Detail colour",
        value: { value: "#5e5d5a" },
    });

    slices: FormattingSettingsSlice[] = [
        this.panelBackground,
        this.panelRadius,
        this.panelPadding,
        this.panelGap,
        this.rateFontSize,
        this.rateColor1,
        this.rateColor2,
        this.labelFontSize,
        this.detailFontSize,
        this.lostRevenueColor,
        this.showCallbackCount,
        this.showLostCount,
        this.showLostRevenue,
        this.layout,
        this.labelColor,
        this.detailColor,
    ];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    callbackCardCard = new CallbackCardSettings();
    cards = [this.callbackCardCard];
}
