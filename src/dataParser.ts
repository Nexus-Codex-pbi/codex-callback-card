import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;

export interface CallbackPanel {
    window: string;
    rate: number | null;
    rateFormat: string | null;
    callbackCount: number | null;
    callbackCountFormat: string | null;
    totalCount: number | null;
    totalCountFormat: string | null;
    lostCount: number | null;
    lostCountFormat: string | null;
    lostRevenue: number | null;
    lostRevenueFormat: string | null;
    sortOrder: number | null;
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

        const getFormat = (role: string): string | null => {
            if (roleMap[role] === undefined) return null;
            return vals[roleMap[role]].source.format || null;
        };

        panels.push({
            window: String(cats[r] ?? ""),
            rate: getVal("rate"),
            rateFormat: getFormat("rate"),
            callbackCount: getVal("callbackCount"),
            callbackCountFormat: getFormat("callbackCount"),
            totalCount: getVal("totalCount"),
            totalCountFormat: getFormat("totalCount"),
            lostCount: getVal("lostCount"),
            lostCountFormat: getFormat("lostCount"),
            lostRevenue: getVal("lostRevenue"),
            lostRevenueFormat: getFormat("lostRevenue"),
            sortOrder: getVal("sortOrder"),
        });
    }

    // Sort by sortOrder ascending if any panel has a sort order value
    const hasSortOrder = panels.some(p => p.sortOrder !== null);
    if (hasSortOrder) {
        panels.sort((a, b) => {
            if (a.sortOrder === null && b.sortOrder === null) return 0;
            if (a.sortOrder === null) return 1;
            if (b.sortOrder === null) return 1;
            return a.sortOrder - b.sortOrder;
        });
    }

    return { panels };
}
