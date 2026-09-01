import { requireAccountType } from "@/lib/auth/dal";
import {
  generateReport,
  REPORT_TYPES,
  REPORT_TYPE_LABEL,
  REPORT_TYPE_HAS_DATE_RANGE,
  type ReportType,
} from "@/lib/api/admin/reports";
import { ExportReportButtons } from "@/components/admin/export-report-buttons";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

const PREVIEW_LIMIT = 50;

interface PageProps {
  searchParams: Promise<{ type?: string; from?: string; to?: string }>;
}

function isReportType(value: string | undefined): value is ReportType {
  return REPORT_TYPES.includes(value as ReportType);
}

/** Standard cross-report page: pick a type + optional date range, preview
 * a table, export the full (unpaginated) result as CSV or PDF. One page
 * for every report type rather than five near-identical ones. */
export default async function AdminReportsPage({ searchParams }: PageProps) {
  await requireAccountType("admin", "/admin/reports");
  const params = await searchParams;
  const type: ReportType = isReportType(params.type) ? params.type : "orders";
  const hasDateRange = REPORT_TYPE_HAS_DATE_RANGE[type];
  const report = await generateReport(type, hasDateRange ? { from: params.from, to: params.to } : {});

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Reports</h1>
        <p className="mt-1 text-sm text-text-muted">Build a report from platform data and export it as CSV or PDF.</p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-4" method="get">
        <div>
          <label htmlFor="report-type" className="text-xs font-medium text-ink-soft">
            Report type
          </label>
          <select
            id="report-type"
            name="type"
            defaultValue={type}
            className="mt-1 rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-ink/40"
          >
            {REPORT_TYPES.map((t) => (
              <option key={t} value={t}>
                {REPORT_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        {hasDateRange && (
          <>
            <div>
              <label htmlFor="report-from" className="text-xs font-medium text-ink-soft">
                From
              </label>
              <input
                id="report-from"
                type="date"
                name="from"
                defaultValue={params.from}
                className="mt-1 rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-ink/40"
              />
            </div>
            <div>
              <label htmlFor="report-to" className="text-xs font-medium text-ink-soft">
                To
              </label>
              <input
                id="report-to"
                type="date"
                name="to"
                defaultValue={params.to}
                className="mt-1 rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-ink/40"
              />
            </div>
          </>
        )}
        <button type="submit" className="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/85">
          Generate
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted">
          {report.rows.length.toLocaleString("en-NG")} row{report.rows.length === 1 ? "" : "s"}
          {hasDateRange && (params.from || params.to) ? " in range" : ""}
        </p>
        <ExportReportButtons report={report} reportLabel={REPORT_TYPE_LABEL[type]} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-cream/60 text-xs font-medium tracking-wide text-text-muted uppercase">
              <tr>
                {report.columns.map((c) => (
                  <th key={c.key} className="px-5 py-3 font-medium whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.rows.length === 0 ? (
                <tr>
                  <td colSpan={report.columns.length} className="px-5 py-14 text-center text-sm text-text-muted">
                    No data for this report{hasDateRange && (params.from || params.to) ? " in that date range" : ""}.
                  </td>
                </tr>
              ) : (
                report.rows.slice(0, PREVIEW_LIMIT).map((row, i) => (
                  <tr key={i} className="border-b border-line/70 last:border-b-0 hover:bg-cream/40">
                    {report.columns.map((c) => (
                      <td key={c.key} className="px-5 py-3 whitespace-nowrap text-ink">
                        {formatCell(row[c.key])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {report.rows.length > PREVIEW_LIMIT && (
          <div className="border-t border-line px-5 py-3 text-xs text-text-muted">
            Showing the first {PREVIEW_LIMIT} of {report.rows.length.toLocaleString("en-NG")} rows — export to get all of them.
          </div>
        )}
      </div>
    </main>
  );
}

function formatCell(value: string | number | undefined): string {
  if (typeof value === "number") return value.toLocaleString("en-NG");
  return value ?? "—";
}
