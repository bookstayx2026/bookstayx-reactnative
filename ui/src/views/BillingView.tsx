import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Invoice, PaymentMethod } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Plus,
  Search,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { InvoicePrintModal } from '../components/modals/InvoicePrintModal';
import { NewSaleInvoiceModal } from '../components/modals/NewSaleInvoiceModal';
import { Modal } from '../components/common/Modal';

export const BillingView: React.FC = () => {
  const { invoices, recordPayment, settings, showToast } = useCRM();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modals
  const [newSaleModalOpen, setNewSaleModalOpen] = useState(false);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentRef, setPaymentRef] = useState('');

  // Tally Export Modal Placeholder
  const [tallyModalOpen, setTallyModalOpen] = useState(false);

  const filteredInvoices = invoices.filter((inv: Invoice) => {
    const q = searchQuery.toLowerCase().trim();
    if (
      q &&
      !inv.invoiceNumber.toLowerCase().includes(q) &&
      !inv.customerName.toLowerCase().includes(q) &&
      !inv.customerPhone.includes(q) &&
      !inv.type.toLowerCase().includes(q)
    ) {
      return false;
    }
    if (statusFilter !== 'ALL' && inv.paymentStatus !== statusFilter) return false;
    if (typeFilter !== 'ALL' && inv.type !== typeFilter) return false;
    return true;
  });

  const totalInvoicedSales = invoices.reduce((sum: number, i: Invoice) => sum + i.grandTotal, 0);
  const totalCashCollected = invoices.reduce(
    (sum: number, i: Invoice) => sum + i.payments.reduce((pSum: number, p) => pSum + p.amount, 0),
    0
  );
  const totalOutstandingDue = invoices.reduce((sum: number, i: Invoice) => sum + i.balanceDue, 0);

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment || paymentAmount <= 0) return;
    recordPayment(selectedInvoiceForPayment.id, Number(paymentAmount), paymentMethod, paymentRef);
    setPaymentModalOpen(false);
  };

  const handleSimulateTallyExport = () => {
    showToast(
      'Tally Export Generated',
      'XML voucher payload generated for Tally Prime ledger sync (Simulated UI)',
      'info'
    );
    setTallyModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Billing, Invoices &amp; Counter Sales
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            GST tax invoicing for repairs, accessories, resale devices, collections, and Tally sync
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTallyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-500/30 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Tally ERP Export</span>
          </button>

          <button
            onClick={() => setNewSaleModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Counter Sale</span>
          </button>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl glass-card">
          <p className="text-xs font-bold uppercase text-gray-400">Total Invoiced Gross Revenue</p>
          <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
            {formatINR(totalInvoicedSales)}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">{invoices.length} total tax invoices issued</p>
        </div>

        <div className="p-4 rounded-2xl glass-card">
          <p className="text-xs font-bold uppercase text-gray-400">Actual Cash Collected</p>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatINR(totalCashCollected)}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">UPI, Cash, Card &amp; Bank collections</p>
        </div>

        <div className="p-4 rounded-2xl glass-card">
          <p className="text-xs font-bold uppercase text-gray-400">Total Outstanding Customer Dues</p>
          <p className="text-xl font-extrabold text-rose-500 mt-1">
            {formatINR(totalOutstandingDue)}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {invoices.filter((i: Invoice) => i.balanceDue > 0).length} invoices with pending balance
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl glass-panel flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search invoice #, customer name, phone..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white focus:outline-none font-semibold"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="Paid">Paid in Full</option>
            <option value="Partial">Partial Paid</option>
            <option value="Unpaid">Unpaid Due</option>
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">All Invoice Types</option>
            <option value="Repair Job">Repair Job Invoices</option>
            <option value="Accessory Counter Sale">Accessory Counter Sales</option>
            <option value="Resale Device Sale">Resale Device Sales</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="p-4 rounded-3xl glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Type &amp; Date</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Grand Total (GST)</th>
                <th className="py-3 px-3">Amount Paid</th>
                <th className="py-3 px-3">Balance Due</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Tally ERP</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    No invoices found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv: Invoice) => (
                  <tr key={inv.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition">
                    <td className="py-3 px-3 font-mono font-extrabold text-gray-900 dark:text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold block text-gray-900 dark:text-white">{inv.type}</span>
                      <span className="text-[10px] text-gray-400">{formatDate(inv.date)}</span>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-gray-900 dark:text-white">{inv.customerName}</p>
                      <p className="text-[11px] text-gray-500 font-mono">{inv.customerPhone}</p>
                    </td>
                    <td className="py-3 px-3 font-extrabold text-gray-900 dark:text-white">
                      {formatINR(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-500">{formatINR(inv.amountPaid)}</td>
                    <td className="py-3 px-3 font-extrabold text-rose-500">{formatINR(inv.balanceDue)}</td>
                    <td className="py-3 px-3">
                      <StatusBadge type="payment" status={inv.paymentStatus} />
                    </td>
                    <td className="py-3 px-3">
                      {inv.tallyExported ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-bold">
                          ✓ Synced
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-gray-500">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.balanceDue > 0 && (
                          <button
                            onClick={() => {
                              setSelectedInvoiceForPayment(inv);
                              setPaymentAmount(inv.balanceDue);
                              setPaymentModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-sm transition active:scale-95"
                          >
                            Pay
                          </button>
                        )}
                        <button
                          onClick={() => setPrintInvoice(inv)}
                          className="p-1.5 rounded-xl glass-card hover:border-[#F5ED31] dark:hover:border-[#DAFC08] text-gray-700 dark:text-gray-300 transition"
                          title="Print Tax Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {paymentModalOpen && selectedInvoiceForPayment && (
        <Modal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          title={`Record Payment — ${selectedInvoiceForPayment.invoiceNumber}`}
          subtitle={`Customer: ${selectedInvoiceForPayment.customerName} | Balance Due: ${formatINR(selectedInvoiceForPayment.balanceDue)}`}
          maxWidth="md"
        >
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Payment Amount Received (₹) *
              </label>
              <input
                type="number"
                required
                max={selectedInvoiceForPayment.balanceDue}
                value={paymentAmount}
                onChange={e => setPaymentAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-sm glass-input text-gray-900 dark:text-white font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Payment Channel / Mode
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white font-semibold"
              >
                <option value="UPI">UPI (Google Pay / PhonePe / QR)</option>
                <option value="Cash">Cash at Counter</option>
                <option value="Card">Debit / Credit Card POS Swipe</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Transaction / UTR Reference
              </label>
              <input
                type="text"
                value={paymentRef}
                onChange={e => setPaymentRef(e.target.value)}
                placeholder="e.g. UPI-HDFC-9928192 / POS Slip 201"
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition active:scale-95"
              >
                Confirm Payment Receipt
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Tally ERP Export Modal Placeholder */}
      {tallyModalOpen && (
        <Modal
          isOpen={tallyModalOpen}
          onClose={() => setTallyModalOpen(false)}
          title="Tally ERP / Prime Export (Placeholder)"
          subtitle="Generate XML Voucher payload for automated accounting ledger import"
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 space-y-1">
              <span className="font-bold block uppercase text-[10px]">Tally Integration Note:</span>
              <p>
                This CRM exports standardized Tally XML voucher files matching your configured ledger chart (Repair Revenue, Counter Accessories, Refurbished Phones, HDFC Current A/C).
              </p>
            </div>

            <div className="p-3 glass-panel rounded-2xl space-y-1.5 font-mono text-[11px]">
              <p className="text-gray-400 uppercase font-sans font-bold text-[10px]">Configured Ledger Mappings:</p>
              <p>• Sales Ledger (Repairs): <span className="text-emerald-500">{settings.tallyLedgerMapping.repairSales}</span></p>
              <p>• Sales Ledger (Accessories): <span className="text-emerald-500">{settings.tallyLedgerMapping.accessorySales}</span></p>
              <p>• Sales Ledger (Resale): <span className="text-emerald-500">{settings.tallyLedgerMapping.resaleSales}</span></p>
              <p>• Bank Account: <span className="text-[#547BDE] dark:text-[#8AA8F8]">{settings.tallyLedgerMapping.bankAccount}</span></p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/5 dark:border-white/5">
              <button
                onClick={() => setTallyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Close
              </button>
              <button
                onClick={handleSimulateTallyExport}
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-[#547BDE] text-white hover:bg-blue-600 shadow-sm transition active:scale-95"
              >
                Download Tally XML Payload
              </button>
            </div>
          </div>
        </Modal>
      )}

      {printInvoice && (
        <InvoicePrintModal
          isOpen={!!printInvoice}
          onClose={() => setPrintInvoice(null)}
          invoice={printInvoice}
          settings={settings}
        />
      )}

      {newSaleModalOpen && (
        <NewSaleInvoiceModal
          isOpen={newSaleModalOpen}
          onClose={() => setNewSaleModalOpen(false)}
        />
      )}
    </div>
  );
};
