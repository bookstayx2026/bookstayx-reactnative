import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { calculateFinancialSummary } from '../utils/calculations';
import { formatINR, formatDate } from '../utils/formatters';
import {
  Download,
  FileSpreadsheet,
  FileText,
  AlertCircle,
} from 'lucide-react';

export const DownloadReportView: React.FC = () => {
  const {
    bookings,
    jobs,
    inventory,
    purchaseOrders,
    invoices,
    resaleDevices,
    expenses,
    staff,
    warrantyClaims,
    settings,
    showToast,
  } = useCRM();

  const [datePeriod, setDatePeriod] = useState<'today' | 'week' | 'month' | 'fy' | 'custom'>('month');
  const [customStart, setCustomStart] = useState('2026-09-01');
  const [customEnd, setCustomEnd] = useState('2026-09-30');

  const [sections, setSections] = useState({
    summary: true,
    bookings: true,
    repairs: true,
    inventory: true,
    purchases: true,
    sales: true,
    resale: true,
    expenses: true,
    staff: true,
    warranty: true,
  });

  const [isExporting, setIsExporting] = useState(false);

  // Compute selected period dates
  const getPeriodMetadata = () => {
    const now = new Date();
    if (datePeriod === 'today') {
      const today = now.toISOString().slice(0, 10);
      return { startDate: today, endDate: today, label: 'Today (24 Sep 2026)' };
    }
    if (datePeriod === 'week') {
      const start = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
      const end = now.toISOString().slice(0, 10);
      return { startDate: start, endDate: end, label: 'This Week (17 Sep - 24 Sep 2026)' };
    }
    if (datePeriod === 'fy') {
      return { startDate: '2026-04-01', endDate: '2027-03-31', label: 'Financial Year 2026-27' };
    }
    if (datePeriod === 'custom') {
      return { startDate: customStart, endDate: customEnd, label: `${formatDate(customStart)} – ${formatDate(customEnd)}` };
    }
    // Default this month
    return { startDate: '2026-09-01', endDate: '2026-09-30', label: 'September 2026 (Current Month)' };
  };

  const periodMeta = getPeriodMetadata();

  const summary = calculateFinancialSummary(
    invoices,
    expenses,
    jobs,
    resaleDevices,
    inventory,
    { startDate: periodMeta.startDate, endDate: periodMeta.endDate }
  );

  const toggleSection = (key: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAllSections = (enable: boolean) => {
    setSections({
      summary: enable,
      bookings: enable,
      repairs: enable,
      inventory: enable,
      purchases: enable,
      sales: enable,
      resale: enable,
      expenses: enable,
      staff: enable,
      warranty: enable,
    });
  };

  const handleDownloadExcel = () => {
    setIsExporting(true);
    try {
      exportToExcel({
        periodLabel: periodMeta.label,
        startDate: periodMeta.startDate,
        endDate: periodMeta.endDate,
        selectedSections: sections,
        bookings,
        jobs,
        inventory,
        purchaseOrders,
        invoices,
        resaleDevices,
        expenses,
        staff,
        warrantyClaims,
        settings,
      });
      showToast('Excel Generated', 'Multi-sheet workbook .xlsx downloaded successfully', 'success');
    } catch (err) {
      showToast('Export Error', 'Failed to generate Excel file', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPDF = () => {
    setIsExporting(true);
    try {
      exportToPDF({
        periodLabel: periodMeta.label,
        startDate: periodMeta.startDate,
        endDate: periodMeta.endDate,
        selectedSections: sections,
        bookings,
        jobs,
        inventory,
        purchaseOrders,
        invoices,
        resaleDevices,
        expenses,
        staff,
        warrantyClaims,
        settings,
      });
      showToast('PDF Generated', 'Branded multi-page PDF performance report downloaded', 'success');
    } catch (err) {
      showToast('Export Error', 'Failed to generate PDF document', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Download Operations &amp; Performance Reports
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Generate authentic browser-built multi-sheet Excel (.xlsx) and branded multi-page PDF documents
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-[#202020] px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#333]">
            Shop: {settings.shopName} ({settings.area})
          </span>
        </div>
      </div>

      {/* Scope Disclaimer Banner */}
      <div className="p-4 rounded-3xl bg-[#547BDE]/10 border border-[#547BDE]/30 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-300 backdrop-blur-md">
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#547BDE] mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-extrabold text-sm text-gray-900 dark:text-white">Real-time Browser Generation Notice</p>
          <p className="text-[11px] text-gray-700 dark:text-gray-300">
            Exports include all currently active and historical records available in this internal frontend. Sensitive hardware IMEIs are masked (e.g. 3598******1298) and lock codes are omitted from public sheets.
          </p>
        </div>
      </div>

      {/* Configurator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Report Controls & Section Toggles */}
        <div className="lg:col-span-1 space-y-4">
          {/* Period Selector */}
          <div className="p-5 rounded-3xl glass-panel space-y-3">
            <span className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider block">
              1. Select Report Period
            </span>
            <div className="space-y-1.5">
              {[
                { id: 'today', label: 'Today (Single Day)' },
                { id: 'week', label: 'This Week (Last 7 Days)' },
                { id: 'month', label: 'This Month (September 2026)' },
                { id: 'fy', label: 'This Financial Year (FY 2026-27)' },
                { id: 'custom', label: 'Custom Date Range' },
              ].map(opt => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition text-xs ${
                    datePeriod === opt.id
                      ? 'bg-[#F5ED31]/15 dark:bg-[#DAFC08]/15 border-[#F5ED31] dark:border-[#DAFC08]/50 text-gray-900 dark:text-[#DAFC08] font-bold'
                      : 'border-black/5 dark:border-white/5 glass-card hover:border-[#F5ED31] dark:hover:border-[#DAFC08]/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="datePeriod"
                    checked={datePeriod === opt.id}
                    onChange={() => setDatePeriod(opt.id as any)}
                    className="text-amber-500"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            {datePeriod === 'custom' && (
              <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-2 text-xs">
                <div>
                  <span className="text-gray-400 text-[10px] block font-bold">START DATE</span>
                  <input
                    type="date"
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg glass-input text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block font-bold">END DATE</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={e => setCustomEnd(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg glass-input text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section Inclusions */}
          <div className="p-5 rounded-3xl glass-panel space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                2. Report Sections
              </span>
              <div className="flex gap-2 text-[10px] font-bold">
                <button
                  onClick={() => handleSelectAllSections(true)}
                  className="text-[#FF934F] dark:text-[#DAFC08] hover:underline"
                >
                  All
                </button>
                <button
                  onClick={() => handleSelectAllSections(false)}
                  className="text-gray-400 hover:underline"
                >
                  None
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { key: 'summary', label: 'Executive P&L' },
                { key: 'repairs', label: `Repairs (${jobs.length})` },
                { key: 'bookings', label: `Bookings (${bookings.length})` },
                { key: 'inventory', label: `Spares (${inventory.length})` },
                { key: 'sales', label: `Invoices (${invoices.length})` },
                { key: 'resale', label: `Resale (${resaleDevices.length})` },
                { key: 'purchases', label: `POs (${purchaseOrders.length})` },
                { key: 'expenses', label: `Expenses (${expenses.length})` },
                { key: 'staff', label: `Staff (${staff.length})` },
                { key: 'warranty', label: `Warranty (${warrantyClaims.length})` },
              ].map(sec => (
                <label
                  key={sec.key}
                  className="flex items-center gap-2 p-2 rounded-xl glass-card border-black/5 dark:border-white/5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={(sections as any)[sec.key]}
                    onChange={() => toggleSection(sec.key as any)}
                    className="rounded text-amber-500"
                  />
                  <span className="truncate">{sec.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Live Preview and Download Action Cards */}
        <div className="lg:col-span-2 space-y-4">
          {/* Live Preview Card */}
          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
              <div>
                <span className="text-xs font-extrabold uppercase text-[#FF934F] dark:text-[#DAFC08] tracking-wider">
                  Live Export Preview &amp; Verification
                </span>
                <p className="text-sm font-extrabold text-gray-900 dark:text-white mt-0.5">
                  Period: {periodMeta.label}
                </p>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-gray-500">
                Generated from CRM state
              </span>
            </div>

            {/* Financial Totals in preview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl glass-card">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Net Sales</span>
                <span className="font-extrabold text-sm text-gray-900 dark:text-white mt-0.5 block">
                  {formatINR(summary.totalNetSales)}
                </span>
              </div>
              <div className="p-3 rounded-2xl glass-card">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Total COGS</span>
                <span className="font-extrabold text-sm text-rose-500 mt-0.5 block">
                  {formatINR(summary.totalCogs)}
                </span>
              </div>
              <div className="p-3 rounded-2xl glass-card">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Gross Profit</span>
                <span className="font-extrabold text-sm text-emerald-500 mt-0.5 block">
                  {formatINR(summary.grossProfit)} ({summary.grossMarginPct.toFixed(1)}%)
                </span>
              </div>
              <div className="p-3 rounded-2xl glass-card">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Est. Operating Profit</span>
                <span className="font-extrabold text-sm text-gray-900 dark:text-white mt-0.5 block">
                  {formatINR(summary.estimatedOperatingProfit)}
                </span>
              </div>
            </div>

            {/* Included Sheets and Record Counts */}
            <div className="p-4 glass-card rounded-2xl space-y-2 text-xs">
              <span className="font-bold text-gray-700 dark:text-gray-300 block">
                Workbook Sheets / Document Sections Summary:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-gray-600 dark:text-gray-400 font-medium">
                <div>✓ Executive Summary</div>
                <div>✓ Bookings ({bookings.length} records)</div>
                <div>✓ Repair Jobs ({jobs.length} records)</div>
                <div>✓ Inventory Spares ({inventory.length} SKUs)</div>
                <div>✓ Purchase Orders ({purchaseOrders.length} orders)</div>
                <div>✓ Sales Invoices ({invoices.length} invoices)</div>
                <div>✓ Resale Phones ({resaleDevices.length} units)</div>
                <div>✓ Operating Expenses ({expenses.length} records)</div>
                <div>✓ Staff Roster ({staff.length} staff)</div>
                <div>✓ Accounting Definitions Sheet</div>
              </div>
            </div>

            {/* Download Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Excel Download Button */}
              <button
                disabled={isExporting}
                onClick={handleDownloadExcel}
                className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-between shadow-lg transition active:scale-95 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-extrabold text-sm">Download Excel Workbook</p>
                    <p className="text-[11px] text-emerald-100">Multi-sheet formatted .XLSX</p>
                  </div>
                </div>
                <Download className="w-5 h-5 text-white/80 group-hover:translate-y-0.5 transition" />
              </button>

              {/* PDF Download Button */}
              <button
                disabled={isExporting}
                onClick={handleDownloadPDF}
                className="p-4 rounded-2xl bg-[#547BDE] hover:bg-blue-600 text-white flex items-center justify-between shadow-lg transition active:scale-95 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-extrabold text-sm">Download Branded PDF Report</p>
                    <p className="text-[11px] text-blue-100">Multi-page styled PDF document</p>
                  </div>
                </div>
                <Download className="w-5 h-5 text-white/80 group-hover:translate-y-0.5 transition" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
