import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;

export interface CallbackPanel {
    window: string;
    rate: number | null;
    callbackCount: number | null;
    totalCount: number | null;
    lostCount: number | null;
    lostRevenue: number | null;
}

export interface CallbackData {
    panels: CallbackPanel[];
}

export function parseDataView(dv: DataView): CallbackData | null {
    if (!dv?.categorical?.categories?.[0]?.values?.length) return null;

    const cats = dv.categorical.categories[0].values;
    const vals = dv.categorical.values || [];

    // Map role names to value column indices
    const roleMap: Record<string, number> = {};
    for (let i = 0; i < vals.length; i++) {
        const roleName = vals[i].source.roles
            ? Object.keys(vals[i].source.roles)[0]
            : "";
        roleMap[roleName] = i;
    }

    const panels: CallbackPanel[] = [];

    for (let r = 0; r < cats.length; r++) {
        const getVal = (role: string): number | null => {
            if (roleMap[role] === undefined) return null;
            const raw = vals[roleMap[role]].values[r];
            if (raw === null || raw === undefined) return null;
            const n = Number(raw);
            return isNaN(n) ? null : n;
        };

        panels.push({
            window: String(cats[r] ?? ""),
            rate: getVal("rate"),
            callbackCount: getVal("callbackCount"),
            totalCount: getVal("totalCount"),
            lostCount: getVal("lostCount"),
            lostRevenue: getVal("lostRevenue"),
        });
    }

    return { panels };
}
