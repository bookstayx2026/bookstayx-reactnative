import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { calculateFinancialSummary } from '../utils/calculations';
import { formatINR, formatDate } from '../utils/formatters';
import { StaffMember } from '../types';
import {
  Download,
  Calendar,
} from 'lucide-react';

interface ReportsViewProps {
  onNavigate: (viewId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onNavigate }) => {
  const { invoices, expenses, jobs, resaleDevices, inventory, staff } = useCRM();

  const [dateRangeOption, setDateRangeOption] = useState<'today' | 'week' | 'month' | 'fy' | 'custom'>('month');
  const [customStart, setCustomStart] = useState('2026-09-01');
  const [customEnd, setCustomEnd] = useState('2026-09-30');

  // Compute date range
  const getDateRange = () => {
    const now = new Date();
    if (dateRangeOption === 'today') {
      const today = now.toISOString().slice(0, 10);
      return { startDate: today, endDate: today, label: 'Today' };
    }
    if (dateRangeOption === 'week') {
      const start = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
      const end = now.toISOString().slice(0, 10);
      return { startDate: start, endDate: end, label: 'This Week (Last 7 Days)' };
    }
    if (dateRangeOption === 'fy') {
      return { startDate: '2026-04-01', endDate: '2027-03-31', label: 'FY 2026-27' };
    }
    if (dateRangeOption === 'custom') {
      return { startDate: customStart, endDate: customEnd, label: `${formatDate(customStart)} – ${formatDate(customEnd)}` };
    }
    // Default this month
    return { startDate: '2026-09-01', endDate: '2026-09-30', label: 'September 2026 (This Month)' };
  };

  const range = getDateRange();
  const summary = calculateFinancialSummary(
    invoices,
    expenses,
    jobs,
    resaleDevices,
    inventory,
    { startDate: range.startDate, endDate: range.endDate }
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Financial Reports &amp; Profit Analytics
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            GAAP compliant mobile repair unit economics, gross margins, and estimated operating profit
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('download_report')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black shadow-sm transition active:scale-95"
          >
            <Download className="w-4 h-4 stroke-[3]" />
            <span>Download PDF / Excel Report</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="p-4 rounded-2xl glass-panel flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#FF934F] dark:text-[#DAFC08]" />
          <span className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
            Period: {range.label}
          </span>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-gray-400 font-mono">
            Demo Estimates
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 glass-card p-1 rounded-xl">
          {[
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'fy', label: 'This Financial Year' },
            { id: 'custom', label: 'Custom' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setDateRangeOption(opt.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                dateRangeOption === opt.id
                  ? 'bg-white dark:bg-[#121212] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Inputs if selected */}
      {dateRangeOption === 'custom' && (
        <div className="p-4 rounded-2xl glass-card flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold">Start Date:</span>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="px-2 py-1 rounded-lg glass-input text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold">End Date:</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="px-2 py-1 rounded-lg glass-input text-gray-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Executive Financial P&L Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Net Sales */}
        <div className="p-5 rounded-3xl glass-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-400">Total Net Sales</span>
            <span className="text-[10px] font-bold text-[#547BDE] bg-[#547BDE]/15 px-2.5 py-0.5 rounded-full">Excl. Tax</span>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {formatINR(summary.totalNetSales)}
          </p>
          <div className="text-[11px] text-gray-500 space-y-0.5 pt-1 border-t border-black/5 dark:border-white/5">
            <p>• Repairs: {formatINR(summary.repairNetSales)}</p>
            <p>• Accessories: {formatINR(summary.accessoryNetSales)}</p>
            <p>• Resale Phones: {formatINR(summary.resaleNetSales)}</p>
          </div>
        </div>

        {/* Cost of Goods Sold (COGS) */}
        <div className="p-5 rounded-3xl glass-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-400">Cost of Goods (COGS)</span>
            <span className="text-[10px] font-bold text-rose-500 bg-rose-500/15 px-2.5 py-0.5 rounded-full">Direct Cost</span>
          </div>
          <p className="text-2xl font-extrabold text-rose-500">
            {formatINR(summary.totalCogs)}
          </p>
          <div className="text-[11px] text-gray-500 space-y-0.5 pt-1 border-t border-black/5 dark:border-white/5">
            <p>• Consumed Parts: {formatINR(summary.repairPartsCogs)}</p>
            <p>• Sold Accessories: {formatINR(summary.accessoryCogs)}</p>
            <p>• Resale Acquisition: {formatINR(summary.resaleCogs)}</p>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="p-5 rounded-3xl glass-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-400">Gross Profit</span>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/15 px-2.5 py-0.5 rounded-full">
              Margin: {summary.grossMarginPct.toFixed(1)}%
            </span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-500">
            {formatINR(summary.grossProfit)}
          </p>
          <p className="text-[11px] text-gray-500 pt-1 border-t border-black/5 dark:border-white/5">
            Net Sales minus Total COGS
          </p>
        </div>

        {/* Operating Profit */}
        <div className="p-5 rounded-3xl glass-card border-[#F5ED31] dark:border-[#DAFC08]/50 shadow-glow-yellow dark:shadow-glow-lime space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-600 dark:text-[#DAFC08]">
              Est. Operating Profit
            </span>
            <span className="text-[10px] font-bold text-black bg-[#F5ED31] dark:bg-[#DAFC08] px-2.5 py-0.5 rounded-full">
              {summary.operatingMarginPct.toFixed(1)}% Margin
            </span>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {formatINR(summary.estimatedOperatingProfit)}
          </p>
          <p className="text-[11px] text-gray-500 pt-1 border-t border-black/5 dark:border-white/5">
            Gross Profit minus Operating Overheads ({formatINR(summary.totalOperatingExpenses)})
          </p>
        </div>
      </div>

      {/* Cash Flow vs Invoiced Receivables Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cash Inflow */}
        <div className="p-5 rounded-3xl glass-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-gray-800 dark:text-gray-200 tracking-wider">
              Cash Inflow &amp; Realized Collections
            </span>
            <span className="text-xs font-bold text-emerald-500 font-mono">
              {formatINR(summary.totalCashCollected)}
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
            <div className="flex justify-between">
              <span>Total Invoices Issued (Incl. GST):</span>
              <span className="font-bold">{formatINR(summary.totalGrossInvoiced)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total GST Collected (Payable to Govt):</span>
              <span className="font-bold">{formatINR(summary.totalCollectedTax)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Cash Received (Bank + UPI + Cash):</span>
              <span className="font-extrabold text-emerald-500">{formatINR(summary.totalCashCollected)}</span>
            </div>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="p-5 rounded-3xl glass-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-gray-800 dark:text-gray-200 tracking-wider">
              Outstanding Invoices &amp; Balances
            </span>
            <span className="text-xs font-bold text-rose-500 font-mono">
              {formatINR(summary.totalOutstandingReceivables)}
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
            <div className="flex justify-between">
              <span>Fully Paid Invoices:</span>
              <span className="font-bold text-emerald-500">{summary.paidInvoiceCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Partially Paid Invoices:</span>
              <span className="font-bold text-amber-500">{summary.partialInvoiceCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Unpaid Dues (Immediate Follow-up):</span>
              <span className="font-extrabold text-rose-500">{summary.unpaidInvoiceCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Technician Volume & Turnaround Time Metrics */}
      <div className="p-5 rounded-3xl glass-panel space-y-4">
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
          Technician Turnaround Time (TAT) &amp; Productivity
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {staff
            .filter((s: StaffMember) => s.role.includes('Technician') || s.role === 'Owner')
            .map((tech: StaffMember) => (
              <div
                key={tech.id}
                className="p-4 rounded-2xl glass-card space-y-2 text-xs hover:border-[#F5ED31] dark:hover:border-[#DAFC08]/60 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-gray-900 dark:text-white">{tech.name}</span>
                  <span className="font-bold text-emerald-500">{tech.completedJobsMonth} Done</span>
                </div>
                <p className="text-[11px] text-gray-400">{tech.specialization}</p>
                <div className="pt-2 border-t border-black/5 dark:border-white/5 flex justify-between text-[11px]">
                  <span className="text-gray-500">Avg TAT: <strong>2.4 Hours</strong></span>
                  <span className="text-[#FF934F] dark:text-[#DAFC08] font-bold">{tech.activeJobsCount} in Queue</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
