import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCRM } from '../../context/CRMContext';
import { JobStatus } from '../../types';

interface NewJobCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewJobCardModal: React.FC<NewJobCardModalProps> = ({ isOpen, onClose }) => {
  const { addRepairJob, staff, setSelectedJob } = useCRM();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('Pimpri, Pune');
  const [deviceBrand, setDeviceBrand] = useState('Apple');
  const [deviceModel, setDeviceModel] = useState('');
  const [deviceColor, setDeviceColor] = useState('Black');
  const [imeiSerial, setImeiSerial] = useState('');
  const [passcodePin, setPasscodePin] = useState('');
  const [reportedFault, setReportedFault] = useState('');
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal');
  const [technicianId, setTechnicianId] = useState('staff-2');
  const [indicativePrice, setIndicativePrice] = useState(2500);
  const [labourCost, setLabourCost] = useState(1500);
  const [partsCost, setPartsCost] = useState(1000);
  const [promisedHours, setPromisedHours] = useState(4);
  const [internalNotes, setInternalNotes] = useState('');

  // Physical checklist
  const [bodyScratches, setBodyScratches] = useState(true);
  const [crackedScreen, setCrackedScreen] = useState(true);
  const [backGlassBroken, setBackGlassBroken] = useState(false);
  const [liquidDamage, setLiquidDamage] = useState(false);
  const [powerOn, setPowerOn] = useState(true);
  const [touchWorking, setTouchWorking] = useState(true);
  const [cameraWorking, setCameraWorking] = useState(true);
  const [speakerWorking, setSpeakerWorking] = useState(true);
  const [conditionNotes, setConditionNotes] = useState('Normal pre-repair physical condition.');

  const [accessoriesStr, setAccessoriesStr] = useState('Device with SIM tray');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !deviceModel || !reportedFault) return;

    const tech = staff.find(s => s.id === technicianId);
    const promisedDate = new Date(Date.now() + promisedHours * 3600 * 1000).toISOString();

    const subtotal = partsCost + labourCost;
    const taxAmount = (subtotal * 18) / 100;
    const total = subtotal + taxAmount;

    const newJob = addRepairJob({
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      customerAddress,
      deviceBrand,
      deviceModel,
      deviceColor,
      imeiSerial: imeiSerial || undefined,
      passcodePin: passcodePin || undefined,
      reportedFault,
      priority,
      technicianId,
      technicianName: tech?.name || 'Rahul Jadhav',
      status: 'Diagnosing' as JobStatus,
      intakeDate: new Date().toISOString(),
      promisedDate,
      diagnosis: 'Initial diagnostic scan in progress.',
      internalNotes,
      customerNotes: 'Device received at Pimpri workshop counter.',
      conditionPhotos: [],
      physicalCondition: {
        bodyScratches,
        crackedScreen,
        backGlassBroken,
        liquidDamage,
        powerOn,
        touchWorking,
        cameraWorking,
        speakerWorking,
        notes: conditionNotes,
      },
      accessoriesReceived: accessoriesStr.split(',').map(s => s.trim()).filter(Boolean),
      estimate: {
        id: `EST-${Date.now()}`,
        revisionNumber: 1,
        initialIndicativePrice: indicativePrice,
        confirmedPrice: subtotal,
        partsCost,
        labourCost,
        pickupFee: 0,
        discount: 0,
        taxRate: 18,
        taxAmount,
        total,
        estimatedCompletionDate: promisedDate,
        status: 'Draft',
      },
      partsUsed: [],
      qualityChecklist: [
        { id: 'qc-n1', item: 'Display touch, TrueTone & refresh rate', checked: false },
        { id: 'qc-n2', item: 'Front & rear camera focus and portrait test', checked: false },
        { id: 'qc-n3', item: 'Speaker, mic, and earpiece calling test', checked: false },
        { id: 'qc-n4', item: 'Fast charging & battery thermal test', checked: false },
      ],
      warrantyMonths: 6,
    });

    setSelectedJob(newJob);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Repair Job Card"
      subtitle="Direct counter intake with device physical inspection & diagnosis setup"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer & Priority Details */}
        <div className="p-3.5 rounded-2xl glass-card border border-black/5 dark:border-white/10 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            1. Customer &amp; Priority
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Customer Phone *
              </label>
              <input
                type="text"
                required
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="e.g. +91 98220 55667"
                className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white font-bold"
              >
                <option value="Normal">Normal (Standard Turnaround)</option>
                <option value="High">High Priority</option>
                <option value="Urgent">🚨 Urgent (Express TAT)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Device Information */}
        <div className="p-3.5 rounded-2xl glass-card border border-black/5 dark:border-white/10 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            2. Device Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Brand *
              </label>
              <select
                value={deviceBrand}
                onChange={e => setDeviceBrand(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
              >
                <option value="Apple">Apple iPhone</option>
                <option value="Samsung">Samsung</option>
                <option value="OnePlus">OnePlus</option>
                <option value="Google">Google Pixel</option>
                <option value="Xiaomi">Xiaomi / Redmi</option>
                <option value="Vivo">Vivo</option>
                <option value="Oppo">Oppo / Realme</option>
                <option value="Motorola">Motorola</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Model *
              </label>
              <input
                type="text"
                required
                value={deviceModel}
                onChange={e => setDeviceModel(e.target.value)}
                placeholder="e.g. iPhone 13 Pro Max"
                className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                IMEI / Serial (Optional)
              </label>
              <input
                type="text"
                value={imeiSerial}
                onChange={e => setImeiSerial(e.target.value)}
                placeholder="15-digit IMEI"
                className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Lock PIN / Passcode
              </label>
              <input
                type="text"
                value={passcodePin}
                onChange={e => setPasscodePin(e.target.value)}
                placeholder="e.g. 1234 or Pattern"
                className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Customer Reported Fault *
            </label>
            <input
              type="text"
              required
              value={reportedFault}
              onChange={e => setReportedFault(e.target.value)}
              placeholder="e.g. Display glass cracked, touch working, speaker buzzing at max volume..."
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Physical Condition Checklist */}
        <div className="p-3.5 rounded-2xl glass-card border border-black/5 dark:border-white/10 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            3. Intake Physical &amp; Functional Inspection Checklist
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg glass-panel border border-black/5 dark:border-white/5">
              <input
                type="checkbox"
                checked={crackedScreen}
                onChange={e => setCrackedScreen(e.target.checked)}
                className="rounded text-amber-500"
              />
              <span>Cracked Screen</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg glass-panel border border-black/5 dark:border-white/5">
              <input
                type="checkbox"
                checked={backGlassBroken}
                onChange={e => setBackGlassBroken(e.target.checked)}
                className="rounded text-amber-500"
              />
              <span>Back Glass Broken</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg glass-panel border border-black/5 dark:border-white/5">
              <input
                type="checkbox"
                checked={liquidDamage}
                onChange={e => setLiquidDamage(e.target.checked)}
                className="rounded text-rose-500"
              />
              <span>Liquid / Water Trace</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg glass-panel border border-black/5 dark:border-white/5">
              <input
                type="checkbox"
                checked={bodyScratches}
                onChange={e => setBodyScratches(e.target.checked)}
                className="rounded text-amber-500"
              />
              <span>Body / Frame Dents</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg glass-panel border border-black/5 dark:border-white/5">
              <input
                type="checkbox"
                checked={powerOn}
                onChange={e => setPowerOn(e.target.checked)}
                className="rounded text-emerald-500"
              />
              <span>Power On (Booting)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg glass-panel border border-black/5 dark:border-white/5">
              <input
                type="checkbox"
                checked={touchWorking}
                onChange={e => setTouchWorking(e.target.checked)}
                className="rounded text-emerald-500"
              />
              <span>Touch Responsive</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg glass-panel border border-black/5 dark:border-white/5">
              <input
                type="checkbox"
                checked={cameraWorking}
                onChange={e => setCameraWorking(e.target.checked)}
                className="rounded text-emerald-500"
              />
              <span>Cameras Working</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg glass-panel border border-black/5 dark:border-white/5">
              <input
                type="checkbox"
                checked={speakerWorking}
                onChange={e => setSpeakerWorking(e.target.checked)}
                className="rounded text-emerald-500"
              />
              <span>Speakers &amp; Mic OK</span>
            </label>
          </div>
        </div>

        {/* Technician & Estimate Setup */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Assign Technician
            </label>
            <select
              value={technicianId}
              onChange={e => setTechnicianId(e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            >
              {staff.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.specialization})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Est. Parts Cost (₹)
            </label>
            <input
              type="number"
              value={partsCost}
              onChange={e => setPartsCost(Number(e.target.value))}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Est. Labour Cost (₹)
            </label>
            <input
              type="number"
              value={labourCost}
              onChange={e => setLabourCost(Number(e.target.value))}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Action Buttons */}
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
            Generate Job Card &amp; Start Diagnosis
          </button>
        </div>
      </form>
    </Modal>
  );
};
