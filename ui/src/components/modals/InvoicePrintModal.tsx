import React from 'react';
import { Modal } from '../common/Modal';
import { Invoice, ShopSettings } from '../../types';
import { formatINR, formatDate, formatDateTime } from '../../utils/formatters';
import { Printer, CheckCircle2, QrCode } from 'lucide-react';

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  settings: ShopSettings;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  isOpen,
  onClose,
  invoice,
  settings,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const halfTax = invoice.taxAmount / 2;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tax Invoice — #${invoice.invoiceNumber}`}
      subtitle="GST compliant tax invoice with QR payment reference & Tally ERP integration notes"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Printable Tax Invoice Paper Card */}
        <div
          id="invoice-printable"
          className="p-6 rounded-2xl bg-white text-black border border-gray-400 shadow-sm font-sans space-y-4"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b pb-4 border-gray-400">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-black">
                {settings.shopName.toUpperCase()}
              </h1>
              <p className="text-xs font-semibold text-gray-700">{settings.tagline}</p>
              <p className="text-[11px] text-gray-600 mt-1 max-w-sm">
                {settings.address}, {settings.area}, {settings.city} - {settings.pincode}
              </p>
              <p className="text-[11px] font-bold text-gray-800 mt-0.5">
                GSTIN: <span className="font-mono">{settings.gstNumber}</span> • Helpline: {settings.phone}
              </p>
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-1 rounded bg-black text-white text-xs font-extrabold tracking-wider uppercase mb-2">
                TAX INVOICE
              </div>
              <p className="text-xs text-gray-500 font-bold">INVOICE NUMBER</p>
              <p className="text-base font-extrabold font-mono text-black">{invoice.invoiceNumber}</p>
              <p className="text-[11px] text-gray-600 mt-1">Invoice Date: {formatDate(invoice.date)}</p>
              {invoice.tallyExported && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold mt-1 inline-block">
                  Tally Ref: {invoice.tallyVoucherNo || 'SYNCED'}
                </span>
              )}
            </div>
          </div>

          {/* Billed To Customer */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-300 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-500 font-bold block text-[10px]">BILLED TO:</span>
              <p className="font-extrabold text-sm text-gray-900">{invoice.customerName}</p>
              <p className="text-gray-700 font-mono">Phone: {invoice.customerPhone}</p>
              {invoice.customerAddress && <p className="text-gray-600 mt-0.5">{invoice.customerAddress}</p>}
            </div>
            <div className="text-right">
              <span className="text-gray-500 font-bold block text-[10px]">INVOICE TYPE:</span>
              <p className="font-bold text-gray-900">{invoice.type}</p>
              <span className="text-gray-500 font-bold block text-[10px] mt-1">PAYMENT STATUS:</span>
              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-extrabold ${invoice.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {invoice.paymentStatus.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-y border-gray-300">
                <th className="py-2 px-3 font-bold text-gray-700">#</th>
                <th className="py-2 px-3 font-bold text-gray-700">Description of Goods / Services</th>
                <th className="py-2 px-3 font-bold text-gray-700 text-center">Qty</th>
                <th className="py-2 px-3 font-bold text-gray-700 text-right">Rate</th>
                <th className="py-2 px-3 font-bold text-gray-700 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="py-2 px-3 text-gray-500">{idx + 1}</td>
                  <td className="py-2 px-3 font-medium text-gray-900">
                    {item.description}
                    <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-gray-200 text-gray-700">
                      {item.type}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">{item.quantity}</td>
                  <td className="py-2 px-3 text-right">{formatINR(item.unitPrice)}</td>
                  <td className="py-2 px-3 text-right font-semibold">{formatINR(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Calculation Breakdown */}
          <div className="flex justify-between items-start border-t border-gray-300 pt-3 text-xs">
            <div className="max-w-xs space-y-2">
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-300 text-[10px] space-y-1">
                <p className="font-bold text-gray-800 uppercase">Payment Summary &amp; Methods:</p>
                {invoice.payments.length === 0 ? (
                  <p className="text-gray-500 italic">No payments recorded</p>
                ) : (
                  invoice.payments.map((p, i) => (
                    <div key={p.id || i} className="flex justify-between text-gray-700 font-mono">
                      <span>• {p.method} ({p.transactionRef || 'Direct'})</span>
                      <span className="font-bold">{formatINR(p.amount)}</span>
                    </div>
                  ))
                )}
              </div>
              {invoice.notes && (
                <p className="text-[11px] text-gray-600 italic">
                  <strong>Notes:</strong> {invoice.notes}
                </p>
              )}
            </div>

            <div className="w-64 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatINR(invoice.subtotal)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-semibold">- {formatINR(invoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>CGST (9.0%):</span>
                <span>{formatINR(halfTax)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>SGST (9.0%):</span>
                <span>{formatINR(halfTax)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-black pt-1.5 border-t border-gray-400">
                <span>Grand Total:</span>
                <span>{formatINR(invoice.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Amount Paid:</span>
                <span>{formatINR(invoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-extrabold">
                <span>Balance Due:</span>
                <span>{formatINR(invoice.balanceDue)}</span>
              </div>
            </div>
          </div>

          {/* QR Code & Signatures Footer */}
          <div className="flex items-center justify-between border-t border-gray-300 pt-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gray-100 border border-gray-300 rounded-lg flex flex-col items-center justify-center text-center p-1">
                <QrCode className="w-8 h-8 text-gray-800" />
                <span className="text-[8px] font-bold mt-0.5">UPI / REVIEW</span>
              </div>
              <div className="text-[10px] text-gray-600 leading-tight">
                <p className="font-bold text-gray-900">Thank you for choosing One Repair!</p>
                <p>Scan to review us on Google or pay via UPI</p>
                <p className="text-gray-500 font-mono mt-0.5">UPI: onerepair.pimpri@hdfcbank</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-gray-500">Authorized Signatory</p>
              <div className="border-t border-gray-400 w-36 pt-1 text-center text-[10px] font-bold mt-6">
                For {settings.shopName}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#262626]"
          >
            Close Preview
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black shadow-sm transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Tax Invoice</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
