import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCRM } from '../../context/CRMContext';
import { InvoiceItem, PaymentMethod } from '../../types';
import { formatINR } from '../../utils/formatters';
import { Plus, Trash2, ShoppingBag } from 'lucide-react';

interface NewSaleInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewSaleInvoiceModal: React.FC<NewSaleInvoiceModalProps> = ({ isOpen, onClose }) => {
  const { createInvoice, inventory, resaleDevices, currentStaff, sellResaleDevice } = useCRM();

  const [saleType, setSaleType] = useState<'Accessory Counter Sale' | 'Resale Device Sale'>('Accessory Counter Sale');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('+91 98000 00000');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [selectedResaleId, setSelectedResaleId] = useState('');
  const [resaleSalePrice, setResaleSalePrice] = useState(25000);

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 'it-1',
      description: 'Anker PowerPort 65W GaN Dual USB-C Fast Charger',
      quantity: 1,
      unitPrice: 2499,
      amount: 2499,
      type: 'Accessory',
    },
  ]);

  const [discount, setDiscount] = useState(0);

  const handleAddItem = () => {
    const accList = inventory.filter(i => i.type === 'Counter Accessory');
    const first = accList[0] || inventory[0];
    setItems(prev => [
      ...prev,
      {
        id: 'it-' + Date.now(),
        description: first.name,
        quantity: 1,
        unitPrice: first.sellingPrice,
        amount: first.sellingPrice,
        type: 'Accessory',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemSelect = (index: number, itemId: string) => {
    const inv = inventory.find(i => i.id === itemId);
    if (!inv) return;
    setItems(prev =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          description: inv.name,
          unitPrice: inv.sellingPrice,
          amount: item.quantity * inv.sellingPrice,
        };
      })
    );
  };

  const handleQtyChange = (index: number, qty: number) => {
    setItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, quantity: qty, amount: qty * item.unitPrice } : item))
    );
  };

  const subtotal = saleType === 'Accessory Counter Sale' ? items.reduce((sum, it) => sum + it.amount, 0) : resaleSalePrice;
  const netBeforeTax = Math.max(0, subtotal - discount);
  const taxAmount = (netBeforeTax * 18) / 100;
  const grandTotal = netBeforeTax + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (saleType === 'Resale Device Sale') {
      if (!selectedResaleId) return;
      sellResaleDevice(selectedResaleId, Number(resaleSalePrice), customerName, customerPhone, paymentMethod);
      onClose();
      return;
    }

    createInvoice({
      type: 'Accessory Counter Sale',
      customerName,
      customerPhone,
      date: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
      items,
      subtotal,
      discount,
      taxRate: 18,
      taxAmount,
      grandTotal,
      amountPaid: grandTotal,
      balanceDue: 0,
      paymentStatus: 'Paid',
      payments: [
        {
          id: 'pay-' + Date.now(),
          date: new Date().toISOString(),
          amount: grandTotal,
          method: paymentMethod,
          transactionRef: 'POS-REC-' + Date.now().toString().slice(-4),
          recordedBy: currentStaff.name,
        },
      ],
      tallyExported: false,
      notes: 'Over-the-counter accessory purchase with 18% GST invoice.',
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Counter Sale &amp; Instant Billing"
      subtitle="Generate GST invoice for counter accessories or certified resale phones"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sale Type Selector */}
        <div className="flex gap-2 p-1 glass-panel rounded-2xl border border-black/5 dark:border-white/5">
          <button
            type="button"
            onClick={() => setSaleType('Accessory Counter Sale')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              saleType === 'Accessory Counter Sale'
                ? 'bg-[#F5ED31] dark:bg-[#DAFC08] text-black shadow-sm font-extrabold'
                : 'text-gray-500 hover:text-black dark:hover:text-white'
            }`}
          >
            Counter Accessories Sale
          </button>
          <button
            type="button"
            onClick={() => setSaleType('Resale Device Sale')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              saleType === 'Resale Device Sale'
                ? 'bg-[#F5ED31] dark:bg-[#DAFC08] text-black shadow-sm font-extrabold'
                : 'text-gray-500 hover:text-black dark:hover:text-white'
            }`}
          >
            Pre-Owned Resale Device Sale
          </button>
        </div>

        {/* Customer Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            >
              <option value="UPI">UPI (GPay / PhonePe / QR)</option>
              <option value="Cash">Cash at Counter</option>
              <option value="Card">Card Swipe POS</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        {/* Accessory Items Line Builder */}
        {saleType === 'Accessory Counter Sale' ? (
          <div className="p-3.5 rounded-2xl glass-card border border-black/5 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                Cart Items
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#F5ED31] dark:bg-[#DAFC08] text-black"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-xl glass-panel border border-black/5 dark:border-white/5 text-xs"
                >
                  <select
                    onChange={e => handleItemSelect(idx, e.target.value)}
                    className="glass-input flex-1 px-2 py-1.5 rounded-lg text-gray-900 dark:text-white"
                  >
                    {inventory
                      .filter(i => i.type === 'Counter Accessory' || i.onHandQty > 0)
                      .map(inv => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name} (Stock: {inv.onHandQty}, Price: {formatINR(inv.sellingPrice)})
                        </option>
                      ))}
                  </select>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400 text-[10px]">Qty:</span>
                    <input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={e => handleQtyChange(idx, Number(e.target.value))}
                      className="glass-input w-14 px-2 py-1 rounded-lg text-center font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                  <span className="font-extrabold w-20 text-right">{formatINR(it.amount)}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-rose-500 hover:bg-rose-500/10 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Resale Device Selection */
          <div className="p-3.5 rounded-2xl glass-card border border-black/5 dark:border-white/10 space-y-3">
            <span className="text-xs font-bold uppercase text-gray-400 block">Select Resale Phone for Sale</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Device in Inventory</label>
                <select
                  value={selectedResaleId}
                  onChange={e => {
                    setSelectedResaleId(e.target.value);
                    const dev = resaleDevices.find(r => r.id === e.target.value);
                    if (dev) setResaleSalePrice(dev.askingPrice);
                  }}
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
                >
                  <option value="">-- Choose Ready for Sale Device --</option>
                  {resaleDevices
                    .filter(d => d.status === 'Ready for Sale')
                    .map(d => (
                      <option key={d.id} value={d.id}>
                        {d.brand} {d.model} ({d.storage}) — {d.conditionGrade} (Asking: {formatINR(d.askingPrice)})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Final Agreed Sale Price (₹)</label>
                <input
                  type="number"
                  value={resaleSalePrice}
                  onChange={e => setResaleSalePrice(Number(e.target.value))}
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs text-amber-600 dark:text-[#DAFC08] font-extrabold"
                />
              </div>
            </div>
          </div>
        )}

        {/* Invoice Summary calculation */}
        <div className="p-3.5 glass-panel rounded-2xl border border-black/5 dark:border-white/5 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal:</span>
            <span className="font-semibold">{formatINR(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Discount:</span>
            <input
              type="number"
              value={discount}
              onChange={e => setDiscount(Number(e.target.value))}
              className="glass-input w-20 px-2 py-0.5 rounded text-right text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">GST Tax (18%):</span>
            <span className="font-semibold">{formatINR(taxAmount)}</span>
          </div>
          <div className="flex justify-between text-sm font-extrabold pt-1 border-t border-black/5 dark:border-white/5">
            <span>Grand Total (Settled):</span>
            <span className="text-emerald-500">{formatINR(grandTotal)}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/5 dark:border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-extrabold bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Generate &amp; Print Sale Invoice</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
