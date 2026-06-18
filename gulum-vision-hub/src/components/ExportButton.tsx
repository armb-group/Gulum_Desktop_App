import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportColumn {
  key: string;
  label: string;
}

interface ExportButtonProps {
  data: Record<string, any>[];
  columns: ExportColumn[];
  fileName?: string;
  title?: string;
}

const ExportButton = ({ data, columns, fileName = "export", title }: ExportButtonProps) => {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleExportExcel = async () => {
    setExporting("excel");
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const worksheetData = data.map((row) => {
        const obj: Record<string, any> = {};
        columns.forEach((col) => {
          obj[col.label] = row[col.key] ?? "";
        });
        return obj;
      });

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // Auto-size columns
      const colWidths = columns.map((col) => {
        const maxLen = Math.max(
          col.label.length,
          ...data.map((row) => String(row[col.key] ?? "").length)
        );
        return { wch: Math.min(maxLen + 4, 50) };
      });
      worksheet["!cols"] = colWidths;

      const workbook = XLSX.utils.book_new();
      
      // Excel limits sheet names to 31 characters and forbids: \ / ? * : [ ]
      let sheetName = (title || "Sheet1")
        .replace(/[\\/?*:[\]]/g, "")
        .substring(0, 31)
        .trim();
      if (!sheetName) {
        sheetName = "Sheet1";
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, `${fileName}.xlsx`);

      toast.success("Excel file exported successfully!");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Failed to export Excel file.");
    } finally {
      setExporting(null);
      setOpen(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting("pdf");
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const doc = new jsPDF({ orientation: data.length > 0 && columns.length > 5 ? "landscape" : "portrait" });

      // Title
      const pdfTitle = title || fileName;
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(pdfTitle, 14, 18);

      // Subtitle with date
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120);
      doc.text(`Generated on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`, 14, 25);
      doc.setTextColor(0);

      const tableHeaders = columns.map((col) => col.label);
      const tableBody = data.map((row) =>
        columns.map((col) => String(row[col.key] ?? "—"))
      );

      autoTable(doc, {
        head: [tableHeaders],
        body: tableBody,
        startY: 30,
        styles: {
          fontSize: 8,
          cellPadding: 3,
          lineColor: [220, 220, 220],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [248, 248, 255],
        },
        margin: { top: 30 },
      });

      doc.save(`${fileName}.pdf`);
      toast.success("PDF file exported successfully!");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF file.");
    } finally {
      setExporting(null);
      setOpen(false);
    }
  };

  const isExporting = exporting !== null;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setOpen(!open)}
        disabled={isExporting || data.length === 0}
        className="gap-2 rounded-xl border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all duration-200 shadow-sm font-medium disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {isExporting ? "Exporting..." : "Export"}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </Button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 w-52 rounded-xl border border-border/80 bg-popover/95 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden"
        >
          <div className="p-1.5 space-y-0.5">
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-150 disabled:opacity-50 group"
            >
              <div className="p-1.5 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-left">
                <span className="block leading-tight">Export as Excel</span>
                <span className="block text-[10px] text-muted-foreground font-normal leading-tight mt-0.5">.xlsx spreadsheet</span>
              </div>
            </button>

            <div className="mx-2 border-t border-border/50" />

            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-150 disabled:opacity-50 group"
            >
              <div className="p-1.5 rounded-lg bg-rose-500/10 group-hover:bg-rose-500/20 transition-colors">
                <FileText className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="text-left">
                <span className="block leading-tight">Export as PDF</span>
                <span className="block text-[10px] text-muted-foreground font-normal leading-tight mt-0.5">.pdf document</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportButton;
