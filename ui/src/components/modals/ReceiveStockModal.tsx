import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCRM } from '../../context/CRMContext';
import { PurchaseOrder } from '../../types';
import { formatINR, formatDate } from '../../utils/formatters';
import { CheckCircle2, PackageCheck } from 'lucide-react';

interface ReceiveStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  po: PurchaseOrder;
}

export const ReceiveStockModal: React.FC<ReceiveStockModalProps> = ({ isOpen, onClose, po }) => {
  const { receivePurchaseOrderStock } = useCRM();

  const [receivedMap, setReceivedMap] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    po.items.forEach(item => {
      initial[item.itemId] = Math.max(0, item.orderQty - item.receivedQty);
    });
    return initial;
  });

  const [actualFreight, setActualFreight] = useState(po.freightAndLandedCost);

  const handleQtyChange = (itemId: string, qty: number) => {
    setReceivedMap(prev => ({ ...prev, [itemId]: qty }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    receivePurchaseOrderStock(po.id, receivedMap, Number(actualFreight));
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Receive Stock — PO #${po.poNumber}`}
      subtitle={`Supplier: ${po.supplierName} | Type: ${po.isForeign ? 'Foreign Import' : 'Domestic'}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 glass-panel rounded-2xl border border-black/5 dark:border-white/5 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Order Date:</span>
            <span className="font-semibold">{formatDate(po.orderDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Shipment Reference:</span>
            <span className="font-mono font-bold">{po.shipmentReference || 'Direct Courier'}</span>
          </div>
        </div>

        {/* Received Item Rows */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase text-gray-400 block">
            Verify Quantities Received Against PO:
          </span>
          {po.items.map(item => (
            <div
              key={item.itemId}
              className="flex items-center justify-between p-3 rounded-xl glass-panel border border-black/5 dark:border-white/5 text-xs"
            >
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{item.itemName}</p>
                <p className="text-[11px] font-mono text-amber-600 dark:text-[#DAFC08]">{item.sku}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Ordered: {item.orderQty} • Previously Received: {item.receivedQty}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500">Receiving Now:</span>
                <input
                  type="number"
                  min={0}
                  max={item.orderQty}
                  value={receivedMap[item.itemId] ?? 0}
                  onChange={e => handleQtyChange(item.itemId, Number(e.target.value))}
                  className="glass-input w-20 px-3 py-1.5 rounded-lg text-center font-bold text-gray-900 dark:text-white"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Landed Cost Adjustment */}
        <div className="p-3 glass-panel rounded-2xl border border-black/5 dark:border-white/5">
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Actual Final Freight &amp; Landed Cost (₹ INR)
          </label>
          <input
            type="number"
            value={actualFreight}
            onChange={e => setActualFreight(Number(e.target.value))}
            className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
          />
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
            <PackageCheck className="w-4 h-4" />
            <span>Confirm Inward &amp; Update Inventory</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
