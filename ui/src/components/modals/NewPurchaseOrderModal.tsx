import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCRM } from '../../context/CRMContext';
import { PurchaseOrderItem } from '../../types';
import { formatINR } from '../../utils/formatters';
import { Plus, Trash2 } from 'lucide-react';

interface NewPurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewPurchaseOrderModal: React.FC<NewPurchaseOrderModalProps> = ({ isOpen, onClose }) => {
  const { addPurchaseOrder, suppliers, inventory } = useCRM();

  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [isForeign, setIsForeign] = useState(false);
  const [currency, setCurrency] = useState('INR');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );
  const [freightAndLandedCost, setFreightAndLandedCost] = useState(500);
  const [amountPaid, setAmountPaid] = useState(0);
  const [shipmentReference, setShipmentReference] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<PurchaseOrderItem[]>([
    {
      itemId: inventory[0]?.id || 'INV-001',
      itemName: inventory[0]?.name || 'Display Assembly',
      sku: inventory[0]?.sku || 'SCR-IP13-OEM',
      orderQty: 5,
      receivedQty: 0,
      unitPrice: inventory[0]?.purchaseCost || 4800,
      total: 5 * (inventory[0]?.purchaseCost || 4800),
    },
  ]);

  const handleSupplierChange = (supId: string) => {
    setSupplierId(supId);
    const sup = suppliers.find(s => s.id === supId);
    if (sup?.isForeign) {
      setIsForeign(true);
      setCurrency('USD');
      setExchangeRate(84.5);
      setFreightAndLandedCost(3500);
    } else {
      setIsForeign(false);
      setCurrency('INR');
      setExchangeRate(1);
      setFreightAndLandedCost(450);
    }
  };

  const handleAddItem = () => {
    const firstInv = inventory[0];
    setItems(prev => [
      ...prev,
      {
        itemId: firstInv?.id || 'INV-001',
        itemName: firstInv?.name || 'Item',
        sku: firstInv?.sku || 'SKU',
        orderQty: 5,
        receivedQty: 0,
        unitPrice: firstInv?.purchaseCost || 1000,
        total: 5 * (firstInv?.purchaseCost || 1000),
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
        const unitPrice = isForeign ? Math.round((inv.purchaseCost / exchangeRate) * 10) / 10 : inv.purchaseCost;
        return {
          ...item,
          itemId: inv.id,
          itemName: inv.name,
          sku: inv.sku,
          unitPrice,
          total: item.orderQty * unitPrice,
        };
      })
    );
  };

  const handleQtyChange = (index: number, qty: number) => {
    setItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, orderQty: qty, total: qty * item.unitPrice } : item))
    );
  };

  const handlePriceChange = (index: number, price: number) => {
    setItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, unitPrice: price, total: item.orderQty * price } : item))
    );
  };

  const subtotalRaw = items.reduce((sum, item) => sum + item.total, 0);
  const subtotalINR = isForeign ? Math.round(subtotalRaw * exchangeRate) : subtotalRaw;
  const grandTotalINR = subtotalINR + Number(freightAndLandedCost);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === supplierId);
    if (!sup || items.length === 0) return;

    addPurchaseOrder({
      supplierId,
      supplierName: sup.name,
      isForeign,
      currency,
      exchangeRate,
      orderDate,
      expectedDeliveryDate,
      status: 'Sent',
      items,
      subtotal: subtotalINR,
      freightAndLandedCost: Number(freightAndLandedCost),
      paymentStatus: amountPaid >= grandTotalINR ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Unpaid',
      amountPaid: Number(amountPaid),
      balanceDue: grandTotalINR - Number(amountPaid),
      shipmentReference,
      notes,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Purchase Order (Domestic & Foreign Imports)"
      subtitle="Issue spare parts & accessory restock order with landed cost calculation"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Supplier & Currency Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Select Supplier *
            </label>
            <select
              value={supplierId}
              onChange={e => handleSupplierChange(e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city}, {s.country})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Order Currency
            </label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            >
              <option value="INR">INR (₹ - Domestic)</option>
              <option value="USD">USD ($ - Import)</option>
              <option value="CNY">CNY (¥ - Shenzhen Direct)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          {isForeign && (
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Exchange Rate (to INR)
              </label>
              <input
                type="number"
                step="0.1"
                value={exchangeRate}
                onChange={e => setExchangeRate(Number(e.target.value))}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* PO Items Table */}
        <div className="p-3.5 rounded-2xl glass-card border border-black/5 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
              Order Items Breakdown
            </span>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#F5ED31] dark:bg-[#DAFC08] text-black"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Line Item</span>
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 rounded-xl glass-panel border border-black/5 dark:border-white/5 text-xs"
              >
                <select
                  value={item.itemId}
                  onChange={e => handleItemSelect(idx, e.target.value)}
                  className="glass-input flex-1 px-2 py-1.5 rounded-lg text-gray-900 dark:text-white"
                >
                  {inventory.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.sku} — {inv.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 text-[10px]">Qty:</span>
                  <input
                    type="number"
                    min={1}
                    value={item.orderQty}
                    onChange={e => handleQtyChange(idx, Number(e.target.value))}
                    className="glass-input w-16 px-2 py-1 rounded-lg text-center text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 text-[10px]">Unit {currency}:</span>
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={e => handlePriceChange(idx, Number(e.target.value))}
                    className="glass-input w-20 px-2 py-1 rounded-lg text-right text-gray-900 dark:text-white"
                  />
                </div>
                <span className="font-extrabold w-24 text-right">
                  {currency} {item.total}
                </span>
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

        {/* Freight, Landed Cost & Payment */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
              Freight, Customs &amp; Landed Cost (₹)
            </label>
            <input
              type="number"
              value={freightAndLandedCost}
              onChange={e => setFreightAndLandedCost(Number(e.target.value))}
              className="glass-input w-full px-3 py-2 rounded-xl text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
              Advance Paid to Supplier (₹)
            </label>
            <input
              type="number"
              value={amountPaid}
              onChange={e => setAmountPaid(Number(e.target.value))}
              className="glass-input w-full px-3 py-2 rounded-xl text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
              Courier / Shipment Ref
            </label>
            <input
              type="text"
              value={shipmentReference}
              onChange={e => setShipmentReference(e.target.value)}
              placeholder="e.g. DHL-884920 / VRL Cargo"
              className="glass-input w-full px-3 py-2 rounded-xl text-gray-900 dark:text-white font-mono"
            />
          </div>
        </div>

        {/* Summary Card */}
        <div className="p-3.5 glass-panel rounded-2xl border border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
          <div>
            <span className="text-gray-500">Total Items Subtotal: </span>
            <span className="font-bold">{formatINR(subtotalINR)}</span>
            {isForeign && <span className="text-gray-400"> ({currency} {subtotalRaw})</span>}
          </div>
          <div className="text-right">
            <span className="text-gray-500">Total Landed Cost: </span>
            <span className="text-base font-extrabold text-amber-600 dark:text-[#DAFC08]">
              {formatINR(grandTotalINR)}
            </span>
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
            className="px-5 py-2 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black shadow-sm transition active:scale-95"
          >
            Generate Purchase Order
          </button>
        </div>
      </form>
    </Modal>
  );
};
