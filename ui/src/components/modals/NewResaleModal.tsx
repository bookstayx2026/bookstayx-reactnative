import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCRM } from '../../context/CRMContext';
import { ResaleCondition, ResaleStatus } from '../../types';
import { formatINR } from '../../utils/formatters';

interface NewResaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewResaleModal: React.FC<NewResaleModalProps> = ({ isOpen, onClose }) => {
  const { addResaleDevice } = useCRM();

  const [brand, setBrand] = useState('Apple');
  const [model, setModel] = useState('');
  const [storage, setStorage] = useState('128 GB');
  const [color, setColor] = useState('Midnight');
  const [conditionGrade, setConditionGrade] = useState<ResaleCondition>('Excellent (Grade A)');
  const [imeiSerial, setImeiSerial] = useState('');
  const [batteryHealth, setBatteryHealth] = useState(90);
  const [acquisitionSource, setAcquisitionSource] = useState('Customer Walk-in Trade-in (Pimpri)');
  const [purchaseCost, setPurchaseCost] = useState(20000);
  const [refurbPartsCost, setRefurbPartsCost] = useState(1000);
  const [refurbLabourCost, setRefurbLabourCost] = useState(500);
  const [askingPrice, setAskingPrice] = useState(26999);
  const [warrantyDays, setWarrantyDays] = useState(90);
  const [status, setStatus] = useState<ResaleStatus>('Inspecting');
  const [notes, setNotes] = useState('Device acquired at counter, inspected for hardware authenticity.');

  const totalCost = purchaseCost + refurbPartsCost + refurbLabourCost;
  const projectedMargin = askingPrice - totalCost;
  const marginPct = askingPrice > 0 ? (projectedMargin / askingPrice) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!model || !imeiSerial) return;

    addResaleDevice({
      brand,
      model,
      storage,
      color,
      conditionGrade,
      imeiSerial,
      batteryHealth: Number(batteryHealth),
      acquisitionSource,
      purchaseCost: Number(purchaseCost),
      refurbPartsCost: Number(refurbPartsCost),
      refurbLabourCost: Number(refurbLabourCost),
      askingPrice: Number(askingPrice),
      warrantyDays: Number(warrantyDays),
      status,
      notes,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Acquire / Log Pre-Owned Resale Device"
      subtitle="Register resale phone with IMEI tracking, refurb costs, and margins"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Device Specifications */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Brand *
            </label>
            <select
              value={brand}
              onChange={e => setBrand(e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            >
              <option value="Apple">Apple</option>
              <option value="Samsung">Samsung</option>
              <option value="OnePlus">OnePlus</option>
              <option value="Google">Google</option>
              <option value="Xiaomi">Xiaomi</option>
              <option value="Vivo">Vivo</option>
              <option value="Oppo">Oppo</option>
              <option value="Motorola">Motorola</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Model *
            </label>
            <input
              type="text"
              required
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder="e.g. iPhone 13 Pro / S22 5G"
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Storage Variant
            </label>
            <input
              type="text"
              value={storage}
              onChange={e => setStorage(e.target.value)}
              placeholder="e.g. 128 GB / 256 GB"
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Condition Grade *
            </label>
            <select
              value={conditionGrade}
              onChange={e => setConditionGrade(e.target.value as ResaleCondition)}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white font-semibold"
            >
              <option value="Like New (Grade A+)">Like New (Grade A+)</option>
              <option value="Excellent (Grade A)">Excellent (Grade A)</option>
              <option value="Good (Grade B)">Good (Grade B)</option>
              <option value="Fair (Grade C)">Fair (Grade C)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Device IMEI / Serial *
            </label>
            <input
              type="text"
              required
              value={imeiSerial}
              onChange={e => setImeiSerial(e.target.value)}
              placeholder="15-digit hardware IMEI"
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Battery Health (%)
            </label>
            <input
              type="number"
              min={50}
              max={100}
              value={batteryHealth}
              onChange={e => setBatteryHealth(Number(e.target.value))}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-center font-bold text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Cost & Margin Setup */}
        <div className="p-3.5 rounded-2xl glass-card border border-black/5 dark:border-white/10 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Cost &amp; Profit Margin Setup
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Acquisition Cost (₹)
              </label>
              <input
                type="number"
                value={purchaseCost}
                onChange={e => setPurchaseCost(Number(e.target.value))}
                className="glass-input w-full px-3 py-2 rounded-xl text-gray-900 dark:text-white font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Refurb Parts Cost (₹)
              </label>
              <input
                type="number"
                value={refurbPartsCost}
                onChange={e => setRefurbPartsCost(Number(e.target.value))}
                className="glass-input w-full px-3 py-2 rounded-xl text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Refurb Labour Cost (₹)
              </label>
              <input
                type="number"
                value={refurbLabourCost}
                onChange={e => setRefurbLabourCost(Number(e.target.value))}
                className="glass-input w-full px-3 py-2 rounded-xl text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Asking Selling Price (₹)
              </label>
              <input
                type="number"
                value={askingPrice}
                onChange={e => setAskingPrice(Number(e.target.value))}
                className="glass-input w-full px-3 py-2 rounded-xl text-amber-600 dark:text-[#DAFC08] font-extrabold"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-xl glass-panel border border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-500">Total Landed Investment: </span>
              <span className="font-bold">{formatINR(totalCost)}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-500">Projected Margin: </span>
              <span className="font-extrabold text-emerald-500">
                {formatINR(projectedMargin)} ({marginPct.toFixed(1)}%)
              </span>
            </div>
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
            Add Resale Device
          </button>
        </div>
      </form>
    </Modal>
  );
};
