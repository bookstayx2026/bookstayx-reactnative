import React, { useState, useEffect, useCallback } from "react";
import { Loader2, FileSpreadsheet, FileText, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import axios from "axios";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { useOwnerTheme } from "@/contexts/OwnerThemeContext";
import PaginationBar from "@/components/ui/PaginationBar";

const PAGE_SIZE = 10;

interface LedgerEntry {
  id: number;
  customer_name: string;
  check_in: string;
  check_out: string;
  payment_mode: string;
  amount: number;
  unit_id: number | null;
  unit_name: string;
  source: "website" | "offline";
  booking_id?: string;
  checkout_datetime?: string;
  booking_status?: string;
  booking_date?: string;
  advance_amount?: number;
  total_amount?: number;
}

interface UnitOption {
  id: number;
  name: string;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const FULL_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const Bookings = () => {
  const { theme } = useOwnerTheme();
  const isLight = theme === "light";

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState(String(currentMonth));
  const [unit, setUnit] = useState("all");
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const ownerDataString = localStorage.getItem("ownerData");
  const ownerData = ownerDataString ? JSON.parse(ownerDataString) : null;
  const propertyId = ownerData?.property_id || ownerData?.propertyId || "";
  const ownerMobile =
    ownerData?.owner_otp_number ||
    ownerData?.ownerNumber ||
    ownerData?.mobile ||
    "";
  const propertyName =
    ownerData?.property_name ||
    ownerData?.propertyName ||
    ownerData?.property_title ||
    "Property";

  const years = Array.from({ length: 5 }, (_, i) =>
    String(currentYear - 2 + i),
  );

  const getSelectedUnitName = () => {
    if (unit === "all") return "All Units";
    const found = units.find((u) => String(u.id) === unit);
    return found?.name || "All Units";
  };

  const getFilterLabel = () => {
    return `${FULL_MONTHS[parseInt(month) - 1]} ${year} - ${getSelectedUnitName()}`;
  };

  const formatDateFull = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fetchUnits = useCallback(async () => {
    if (!propertyId || !ownerMobile) return;
    try {
      const res = await axios.get(
        `/api/bookings/owner/units?property_id=${propertyId}&mobile=${ownerMobile}`,
      );
      if (res.data.success) {
        setUnits(res.data.data);
      }
    } catch (e) {
      console.error("Failed to fetch units:", e);
    }
  }, [propertyId, ownerMobile]);

  const fetchLedger = useCallback(async () => {
    if (!propertyId || !ownerMobile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        property_id: propertyId,
        year,
        month,
        mobile: ownerMobile,
      });
      if (unit !== "all") params.append("unit_id", unit);

      const res = await axios.get(
        `/api/bookings/owner/ledger?${params.toString()}`,
      );
      if (res.data.success) {
        setEntries(res.data.data);
      }
    } catch (e) {
      console.error("Failed to fetch ledger:", e);
    } finally {
      setLoading(false);
    }
  }, [propertyId, ownerMobile, year, month, unit]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  useEffect(() => {
    setPage(1);
  }, [year, month, unit]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const totalAmount = entries
    .filter((e) => e.booking_status !== "CANCELLED")
    .reduce((sum, e) => sum + (parseFloat(String(e.amount)) || 0), 0);

  const buildExportRows = () => {
    return entries.map((entry, idx) => ({
      "Sr.": idx + 1,
      Customer: entry.customer_name || "Guest",
      Unit: entry.unit_name || "N/A",
      "Check In": formatDateFull(entry.check_in),
      "Check Out": formatDateFull(entry.check_out),
      Source: entry.source === "website" ? "Online" : "Offline",
      Payment:
        entry.source === "website" ? "Online" : entry.payment_mode || "Cash",
      "Amount (₹)": parseFloat(String(entry.amount || 0)),
    }));
  };

  const handleExcelExport = () => {
    if (entries.length === 0) {
      toast.error("No data to export");
      return;
    }

    const rows = buildExportRows();
    rows.push({
      "Sr.": "" as any,
      Customer: "",
      Unit: "",
      "Check In": "",
      "Check Out": "",
      Source: "",
      Payment: "TOTAL",
      "Amount (₹)": totalAmount,
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const colWidths = [
      { wch: 5 },
      { wch: 20 },
      { wch: 15 },
      { wch: 14 },
      { wch: 14 },
      { wch: 10 },
      { wch: 10 },
      { wch: 14 },
    ];
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");

    const fileName = `Bookings_${propertyName.replace(/\s+/g, "_")}_${MONTHS[parseInt(month) - 1]}_${year}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Excel file downloaded");
  };

  const handlePdfExport = () => {
    if (entries.length === 0) {
      toast.error("No data to export");
      return;
    }

    const rows = buildExportRows();
    const html = `
      <html><head><title>Bookings Ledger</title>
      <style>
        body { font-family: helvetica, sans-serif; background: #0a0a0a; color: #c8c8c8; margin: 20px; }
        h2 { color: #f59e0b; margin-bottom: 4px; }
        p { font-size: 11px; color: #969696; margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11px; }
        th { background: #141414; color: #f59e0b; padding: 6px; text-align: left; }
        td { background: #1a1a1a; padding: 6px; border-bottom: 1px solid #222; }
        tr:nth-child(even) td { background: #1e1e1e; }
        tfoot td { background: #141414; color: #f59e0b; font-weight: bold; }
      </style></head><body>
      <h2>Bookings Ledger</h2>
      <p>${getFilterLabel()}</p>
      <p>Property: ${propertyName}</p>
      <table>
        <thead><tr><th>#</th><th>Customer</th><th>Unit</th><th>Check In</th><th>Check Out</th><th>Source</th><th>Payment</th><th>Amount</th></tr></thead>
        <tbody>${rows.map((r) => `<tr><td>${r["Sr."]}</td><td>${r["Customer"]}</td><td>${r["Unit"]}</td><td>${r["Check In"]}</td><td>${r["Check Out"]}</td><td>${r["Source"]}</td><td>${r["Payment"]}</td><td>${Number(r["Amount (₹)"]).toLocaleString("en-IN")}</td></tr>`).join("")}</tbody>
        <tfoot><tr><td colspan="6"></td><td>TOTAL</td><td>${totalAmount.toLocaleString("en-IN")}</td></tr></tfoot>
      </table></body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
    toast.success("PDF ready to print/save");
  };

  const hasData = !loading && entries.length > 0;

  return (
    <div
      className={cn(
        "flex flex-col min-h-screen pb-32 transition-colors duration-300",
        isLight ? "bg-[#F9F5F0] text-[#1A1A1A]" : "bg-black text-white",
      )}
    >
      <div
        className={cn(
          "sticky top-[61px] z-50 px-4 py-1.5 backdrop-blur-sm transition-colors duration-300",
          isLight ? "bg-[#F9F5F0]/90" : "",
        )}
      >
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              value: year,
              onChange: setYear,
              items: years.map((y) => ({ value: y, label: y })),
              placeholder: "Year",
            },
            {
              value: month,
              onChange: setMonth,
              items: MONTHS.map((m, i) => ({ value: String(i + 1), label: m })),
              placeholder: "Month",
            },
            {
              value: unit,
              onChange: setUnit,
              items: [
                { value: "all", label: "All Units" },
                ...units.map((u) => ({ value: String(u.id), label: u.name })),
              ],
              placeholder: "Unit",
            },
          ].map((sel, i) => (
            <Select key={i} value={sel.value} onValueChange={sel.onChange}>
              <SelectTrigger
                className={cn(
                  "h-8 border-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-bold focus:ring-0 focus:ring-offset-0 rounded-lg transition-colors duration-300",
                  isLight ? "bg-white/80" : "bg-[#1A1A1A]/80",
                )}
              >
                <SelectValue placeholder={sel.placeholder} />
              </SelectTrigger>
              <SelectContent
                className={cn(
                  "border-[#F59E0B]/30 transition-colors duration-300",
                  isLight
                    ? "bg-white text-[#1A1A1A]"
                    : "bg-[#1A1A1A] text-white",
                )}
              >
                {sel.items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2
            className={cn(
              "text-[10px] font-bold tracking-widest uppercase transition-colors duration-300",
              isLight ? "text-gray-500" : "text-white/70",
            )}
          >
            Bookings Ledger
          </h2>
          <div className="text-right">
            <span
              className={cn(
                "text-[10px] uppercase tracking-wider transition-colors duration-300",
                isLight ? "text-gray-500" : "text-white/70",
              )}
            >
              Total:{" "}
            </span>
            <span className="text-sm font-bold text-[#F59E0B]">
              ₹{totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#F59E0B]" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <AlertCircle className="w-10 h-10 mb-3 text-gray-600" />
            <p className="text-sm font-medium">No bookings found</p>
            <p className="text-[10px] mt-1">Try changing the filters above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries
              .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
              .map((entry, idx) => {
                const isNoShow =
                  entry.source === "website" &&
                  entry.booking_status === "NO_SHOW";
                const isCancelled = [
                  "CANCELLED",
                  "CANCELLED_BY_OWNER",
                  "CANCELLED_NO_REFUND",
                ].includes(entry.booking_status || "");

                return (
                  <Card
                    key={`${entry.source}-${entry.id}`}
                    onClick={() => setSelectedEntry(entry)}
                    className={cn(
                      "rounded-2xl overflow-hidden shadow-xl cursor-pointer active:scale-[0.98] transition-all",
                      isCancelled
                        ? "bg-red-950/40 border border-red-500/30"
                        : isLight
                          ? "bg-white border border-gray-200"
                          : "bg-[#1A1A1A] border border-[#F59E0B]/10",
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                            isCancelled
                              ? "bg-red-900/30 border-red-500/20"
                              : isLight
                                ? "bg-amber-50 border-[#F59E0B]/20"
                                : "bg-[#261F18] border-[#F59E0B]/10",
                          )}
                        >
                          <span
                            className={cn(
                              "text-sm font-bold",
                              isCancelled ? "text-red-400" : "text-[#F59E0B]",
                            )}
                          >
                            #{idx + 1}
                          </span>
                        </div>

                        <div className="flex-grow min-w-0">
                          <h3
                            className={cn(
                              "text-sm font-bold mb-0.5 leading-tight truncate transition-colors duration-300",
                              isCancelled
                                ? "text-red-300"
                                : isLight
                                  ? "text-[#1A1A1A]"
                                  : "text-white",
                            )}
                          >
                            {entry.customer_name || "Guest"}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] text-gray-400 truncate max-w-[80px]">
                              {entry.unit_name}
                            </span>
                            <div className="flex items-center gap-1 border border-gray-800 rounded px-1 py-0.25">
                              <span className="text-[8px] uppercase font-bold tracking-tighter text-gray-400">
                                {entry.source === "website"
                                  ? "online"
                                  : entry.payment_mode || "cash"}
                              </span>
                            </div>
                            {isNoShow && !isCancelled && (
                              <span className="text-[8px] uppercase font-bold tracking-tighter text-gray-500 border border-gray-700 rounded px-1">
                                No-Show
                              </span>
                            )}
                            {isCancelled && (
                              <span className="text-[8px] uppercase font-bold tracking-tighter text-red-400 border border-red-500/40 rounded px-1">
                                Cancelled
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-0.5 shrink-0">
                          <span
                            className={cn(
                              "text-base font-bold",
                              isCancelled
                                ? "text-red-400 line-through"
                                : "text-[#F59E0B]",
                            )}
                          >
                            ₹
                            {parseFloat(
                              String(entry.amount || 0),
                            ).toLocaleString("en-IN")}
                          </span>
                          <span className="text-[9px] font-medium text-gray-500">
                            {formatDate(entry.check_in)} -{" "}
                            {formatDate(entry.check_out)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            <PaginationBar
              currentPage={page}
              totalPages={Math.ceil(entries.length / PAGE_SIZE)}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <Dialog
        open={!!selectedEntry}
        onOpenChange={(open) => !open && setSelectedEntry(null)}
      >
        <DialogContent
          className={cn(
            "sm:max-w-[440px] w-[92vw] border-white/10 rounded-3xl max-h-[90vh] overflow-y-auto transition-colors duration-300",
            isLight ? "bg-white" : "bg-[#1A1A1A]",
          )}
        >
          <DialogHeader>
            <DialogTitle className="text-[#F59E0B] font-display capitalize">
              Booking Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {selectedEntry?.booking_date
                ? new Date(selectedEntry.booking_date).toLocaleString("en-IN")
                : selectedEntry?.check_in
                  ? new Date(selectedEntry.check_in).toLocaleString("en-IN")
                  : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedEntry &&
            (() => {
              const e = selectedEntry;
              const isCancelledModal = [
                "CANCELLED",
                "CANCELLED_BY_OWNER",
                "CANCELLED_NO_REFUND",
              ].includes(e.booking_status || "");

              const fmtDate = (s: string) =>
                new Date(s).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
              const fmtDateTime = (s: string) =>
                new Date(s).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                });

              return (
                <div className="mt-2 space-y-4">
                  <div
                    className={cn(
                      "border rounded-xl p-4 space-y-3 transition-colors duration-300",
                      isLight
                        ? "bg-gray-50 border-gray-200"
                        : "bg-white/5 border-white/5",
                    )}
                  >
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#F59E0B] mb-1">
                      Booking Details
                    </p>

                    {[
                      { label: "Guest", val: e.customer_name || "-" },
                      e.unit_name && e.unit_name !== "N/A"
                        ? { label: "Unit", val: e.unit_name }
                        : null,
                      e.booking_date
                        ? {
                            label: "Booking Date",
                            val: new Date(e.booking_date)
                              .toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                              .replace("am", "AM")
                              .replace("pm", "PM"),
                          }
                        : null,
                      e.check_in
                        ? {
                            label: "Check-in",
                            val: new Date(e.check_in)
                              .toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                              .replace("am", "AM")
                              .replace("pm", "PM"),
                          }
                        : null,
                      e.check_out
                        ? {
                            label: "Check-out",
                            val: new Date(e.check_out)
                              .toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                              .replace("am", "AM")
                              .replace("pm", "PM"),
                          }
                        : null,
                    ]
                      .filter(Boolean)
                      .map((row: any) => (
                        <div
                          key={row.label}
                          className="flex justify-between text-sm items-center"
                        >
                          <span
                            className={cn(
                              "transition-colors duration-300",
                              isLight ? "text-gray-500" : "text-white/60",
                            )}
                          >
                            {row.label}
                          </span>
                          <span
                            className={cn(
                              "font-medium text-right max-w-[60%] transition-colors duration-300",
                              isLight ? "text-[#1A1A1A]" : "text-white",
                            )}
                          >
                            {row.val}
                          </span>
                        </div>
                      ))}

                    {e.booking_status && (
                      <div className="flex justify-between text-sm items-center">
                        <span
                          className={cn(
                            "transition-colors duration-300",
                            isLight ? "text-gray-500" : "text-white/60",
                          )}
                        >
                          Status
                        </span>
                        <span
                          className={cn(
                            "font-medium text-right max-w-[55%]",
                            isCancelledModal
                              ? "text-red-400"
                              : "text-[#F59E0B]",
                          )}
                        >
                          {e.booking_status.replace(/_/g, " ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-24 left-0 right-0 px-4 flex gap-3 z-50">
        <button
          onClick={handleExcelExport}
          disabled={!hasData}
          className={cn(
            "flex-1 h-14 rounded-2xl flex items-center justify-center gap-3 shadow-2xl transition-all border border-green-500/30",
            hasData
              ? "active:scale-95 pointer-events-auto"
              : "opacity-40 cursor-not-allowed pointer-events-auto",
            isLight ? "bg-white" : "bg-[#1A1A1A]",
          )}
        >
          <FileSpreadsheet className="w-6 h-6 text-green-500" />
          <span
            className={cn(
              "font-bold uppercase tracking-widest text-sm transition-colors duration-300",
              isLight ? "text-[#1A1A1A]" : "text-white",
            )}
          >
            Excel
          </span>
        </button>
        <button
          onClick={handlePdfExport}
          disabled={!hasData}
          className={cn(
            "flex-1 h-14 rounded-2xl flex items-center justify-center gap-3 shadow-2xl transition-all border border-red-500/30",
            hasData
              ? "active:scale-95 pointer-events-auto"
              : "opacity-40 cursor-not-allowed pointer-events-auto",
            isLight ? "bg-white" : "bg-[#1A1A1A]",
          )}
        >
          <FileText className="w-6 h-6 text-red-500" />
          <span
            className={cn(
              "font-bold uppercase tracking-widest text-sm transition-colors duration-300",
              isLight ? "text-[#1A1A1A]" : "text-white",
            )}
          >
            PDF
          </span>
        </button>
      </div>
    </div>
  );
};

export default Bookings;
