// CSV Export utilities for accounts, deals, and activities

export function exportToCSV<T extends object>(
  data: T[],
  filename: string,
  columns: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Build CSV header
  const header = columns.map((col) => `"${col.label}"`).join(",");

  // Build CSV rows
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = item[col.key];
        if (value === null || value === undefined) return '""';
        if (typeof value === "string") return `"${value.replace(/"/g, '""')}"`;
        if (typeof value === "number") return value.toString();
        if (typeof value === "boolean") return value ? "Yes" : "No";
        if (value instanceof Date) return `"${value.toISOString()}"`;
        return `"${String(value).replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csv = [header, ...rows].join("\n");

  // Create and download file
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Pre-defined column configurations
export const accountColumns = [
  { key: "company_name" as const, label: "Company Name" },
  { key: "contact_name" as const, label: "Contact Name" },
  { key: "contact_email" as const, label: "Email" },
  { key: "contact_phone" as const, label: "Phone" },
  { key: "city" as const, label: "City" },
  { key: "business_type" as const, label: "Business Type" },
  { key: "decision_certainty" as const, label: "Decision Certainty" },
  { key: "waffling_score" as const, label: "Waffling Score" },
  { key: "last_contact_date" as const, label: "Last Contact" },
  { key: "budget_range_low" as const, label: "Budget Low" },
  { key: "budget_range_high" as const, label: "Budget High" },
];

export const dealColumns = [
  { key: "account_name" as const, label: "Account" },
  { key: "title_name" as const, label: "Publication" },
  { key: "ad_size" as const, label: "Ad Size" },
  { key: "value" as const, label: "Value" },
  { key: "stage" as const, label: "Stage" },
  { key: "probability" as const, label: "Probability %" },
  { key: "is_at_risk" as const, label: "At Risk" },
  { key: "last_activity_date" as const, label: "Last Activity" },
  { key: "created_at" as const, label: "Created" },
];

export const activityColumns = [
  { key: "activity_type" as const, label: "Type" },
  { key: "title" as const, label: "Title" },
  { key: "description" as const, label: "Description" },
  { key: "outcome" as const, label: "Outcome" },
  { key: "created_at" as const, label: "Date" },
];
