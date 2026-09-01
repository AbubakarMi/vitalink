"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import type { ReportResult } from "@/lib/api/admin/reports";

/**
 * CSV/PDF export for the currently-generated report — both built entirely
 * client-side from the rows already fetched for the preview table (no
 * export endpoint needed). jsPDF/jspdf-autotable are dynamically imported
 * so their ~200KB doesn't load until someone actually clicks Export PDF.
 */
export function ExportReportButtons({ report, reportLabel }: { report: ReportResult; reportLabel: string }) {
  const [exportingPdf, setExportingPdf] = useState(false);
  const disabled = report.rows.length === 0;

  function exportCsv() {
    const header = report.columns.map((c) => csvEscape(c.label)).join(",");
    const lines = report.rows.map((row) => report.columns.map((c) => csvEscape(formatValue(row[c.key]))).join(","));
    const csv = [header, ...lines].join("\r\n");
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), fileName("csv"));
  }

  async function exportPdf() {
    setExportingPdf(true);
    try {
      const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
      const doc = new jsPDF({ orientation: report.columns.length > 5 ? "landscape" : "portrait" });
      doc.setFontSize(14);
      doc.text(`${reportLabel} Report`, 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Generated ${new Date().toLocaleString("en-NG")} — ${report.rows.length} row${report.rows.length === 1 ? "" : "s"}`, 14, 21);
      autoTable(doc, {
        startY: 26,
        head: [report.columns.map((c) => c.label)],
        body: report.rows.map((row) => report.columns.map((c) => formatValue(row[c.key]))),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 26, 26] },
      });
      doc.save(fileName("pdf"));
    } finally {
      setExportingPdf(false);
    }
  }

  function fileName(ext: string): string {
    return `vitalink-${report.type}-report-${new Date().toISOString().slice(0, 10)}.${ext}`;
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={exportCsv}
        disabled={disabled}
        className="flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-ink/40 hover:bg-cream hover:text-ink disabled:opacity-40"
      >
        <Download className="size-3.5" aria-hidden />
        Export CSV
      </button>
      <button
        type="button"
        onClick={exportPdf}
        disabled={disabled || exportingPdf}
        className="flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink/85 disabled:opacity-40"
      >
        <FileText className="size-3.5" aria-hidden />
        {exportingPdf ? "Preparing…" : "Export PDF"}
      </button>
    </div>
  );
}

function formatValue(value: string | number | undefined): string {
  if (typeof value === "number") return value.toLocaleString("en-NG");
  return value ?? "—";
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
