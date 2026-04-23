/**
 * Utility to export JSON data to CSV and trigger a browser download.
 */

export interface ExportColumn<T> {
    header: string;
    key: keyof T | string;
    transform?: (value: any, item: T) => string | number;
}

export const exportToCSV = <T extends object>(
    data: T[],
    columns: ExportColumn<T>[],
    filename: string
) => {
    if (!data || data.length === 0) {
        console.warn("No data available to export");
        return;
    }

    // 1. Create Header Row
    const headers = columns.map(col => `"${col.header.replace(/"/g, '""')}"`).join(",");

    // 2. Create Data Rows
    const rows = data.map(item => {
        return columns.map(col => {
            let value: any;

            if (typeof col.key === 'string' && col.key.includes('.')) {
                // Handle nested keys like 'location.city'
                value = col.key.split('.').reduce((obj, key) => (obj as any)?.[key], item);
            } else {
                value = (item as any)[col.key];
            }

            // Apply transform if provided
            if (col.transform) {
                value = col.transform(value, item);
            }

            // Clean value for CSV (handle quotes, newlines, etc.)
            const cleanValue = value === null || value === undefined
                ? ""
                : String(value).replace(/"/g, '""');

            return `"${cleanValue}"`;
        }).join(",");
    });

    // 3. Combine and Add BOM for Excel UTF-8 support
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob(["\ufeff", csvContent], { type: "text/csv;charset=utf-8;" });

    // 4. Trigger Download
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
