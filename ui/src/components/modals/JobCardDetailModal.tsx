import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCRM } from '../../context/CRMContext';
import { RepairJob, JobStatus, Estimate } from '../../types';
import { formatINR, formatDate, formatDateTime, maskIMEI } from '../../utils/formatters';
import { StatusBadge } from '../common/StatusBadge';
import {
  Wrench,
  Cpu,
  Boxes,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Smartphone,
  FileText,
  DollarSign,
  ShieldCheck,
  CheckSquare,
  Sparkles,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import { IntakeReceiptModal } from './IntakeReceiptModal';
import { JobSheetModal } from './JobSheetModal';

interface JobCardDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: RepairJob;
}

export const JobCardDetailModal: React.FC<JobCardDetailModalProps> = ({ isOpen, onClose, job }) => {
  const {
    updateJobStatus,
    updateJobEstimate,
    approveEstimate,
    rejectEstimate,
    assignJobMachine,
    assignJobTechnician,
    toggleQualityCheckItem,
    addJobPart,
    completeRepairAndInvoice,
    handoverDevice,
    recordPayment,
    staff,
    machines,
    inventory,
    settings,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'overview' | 'estimate' | 'parts_machines' | 'quality' | 'invoice_handover' | 'timeline'>('overview');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showJobSheetModal, setShowJobSheetModal] = useState(false);

  // Diagnosis Edit State
  const [diagnosis, setDiagnosis] = useState(job.diagnosis);
  const [internalNotes, setInternalNotes] = useState(job.internalNotes);
  const [customerNotes, setCustomerNotes] = useState(job.customerNotes);

  // Part allocation state
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [partQty, setPartQty] = useState(1);

  // Machine allocation state
  const [selectedMachineId, setSelectedMachineId] = useState(job.assignedMachineId || 'MCH-01');
  const [machineSlot, setMachineSlot] = useState(job.machineSlot || '11:00 AM - 12:30 PM');

  // Estimate edit state
  const [estLabour, setEstLabour] = useState(job.estimate.labourCost);
  const [estParts, setEstParts] = useState(job.estimate.partsCost);
  const [estDiscount, setEstDiscount] = useState(job.estimate.discount);

  // Handover state
  const [handoverRemarks, setHandoverRemarks] = useState('');

  // Payment state
  const [paymentAmount, setPaymentAmount] = useState(job.invoiceSummary?.balanceDue || job.estimate.total);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Bank Transfer'>('UPI');

  const allStatuses: JobStatus[] = [
    'Received',
    'Diagnosing',
    'Awaiting Customer Approval',
    'Waiting for Parts',
    'Queued',
    'Repairing',
    'Quality Check',
    'Ready for Pickup',
    'Completed',
    'Cancelled',
    'Unrepairable',
  ];

  const handleSaveDiagnosis = () => {
    job.diagnosis = diagnosis;
    job.internalNotes = internalNotes;
    job.customerNotes = customerNotes;
    updateJobStatus(job.id, job.status, 'Diagnosis notes updated');
  };

  const handleUpdateEstimate = () => {
    const subtotal = estParts + estLabour;
    const taxAmount = (Math.max(0, subtotal - estDiscount) * 18) / 100;
    const total = Math.max(0, subtotal - estDiscount) + taxAmount;

    const newEstimate: Estimate = {
      ...job.estimate,
      revisionNumber: job.estimate.revisionNumber + 1,
      partsCost: estParts,
      labourCost: estLabour,
      discount: estDiscount,
      taxAmount,
      total,
      confirmedPrice: total,
      status: 'Revised',
    };
    updateJobEstimate(job.id, newEstimate);
  };

  const handleAddPart = () => {
    if (!selectedInventoryId) return;
    addJobPart(job.id, selectedInventoryId, Number(partQty) || 1);
    setSelectedInventoryId('');
  };

  const handleAssignMachine = () => {
    assignJobMachine(job.id, selectedMachineId, machineSlot);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Job Card #${job.jobCardNumber} — ${job.deviceBrand} ${job.deviceModel}`}
        subtitle={`Intake: ${formatDate(job.intakeDate)} | Tech: ${job.technicianName} | Customer: ${job.customerName}`}
        maxWidth="5xl"
      >
        <div className="space-y-4">
          {/* Top Bar: Live Status & Quick Advance Actions */}
          <div className="p-3.5 rounded-2xl glass-card border border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                Current Status:
              </span>
              <StatusBadge type="job" status={job.status} />
              {job.status === 'Awaiting Customer Approval' && (
                <span className="text-xs font-extrabold text-amber-500 bg-amber-500/15 px-2 py-0.5 rounded-md animate-pulse">
                  ⚠️ BLOCKED BY APPROVAL
                </span>
              )}
              {job.status === 'Waiting for Parts' && (
                <span className="text-xs font-extrabold text-rose-500 bg-rose-500/15 px-2 py-0.5 rounded-md">
                  📦 MISSING STOCK BLOCKED
                </span>
              )}
            </div>

            {/* Quick Printable Triggers */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReceiptModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold glass-card border border-black/5 dark:border-white/10 hover:border-black/20 text-gray-800 dark:text-gray-200 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Intake Receipt</span>
              </button>
              <button
                onClick={() => setShowJobSheetModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold glass-card border border-black/5 dark:border-white/10 hover:border-black/20 text-gray-800 dark:text-gray-200 transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Workshop Job Sheet</span>
              </button>
            </div>
          </div>

          {/* Status Pipeline Advancement Selector */}
          <div className="overflow-x-auto pb-1">
            <div className="flex items-center gap-1.5 min-w-max">
              {allStatuses.map(st => {
                const isCurrent = job.status === st;
                return (
                  <button
                    key={st}
                    onClick={() => updateJobStatus(job.id, st)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1 ${
                      isCurrent
                        ? 'bg-[#F5ED31] text-black font-extrabold shadow dark:bg-[#DAFC08] dark:text-black scale-105'
                        : 'glass-card text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white border-black/5 dark:border-white/5'
                    }`}
                  >
                    {isCurrent && <CheckCircle2 className="w-3 h-3 text-black" />}
                    <span>{st}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-black/5 dark:border-white/5 overflow-x-auto pb-1">
            {[
              { id: 'overview', label: '1. Overview & Diagnosis', icon: Wrench },
              { id: 'estimate', label: '2. Estimate & Approval', icon: DollarSign },
              { id: 'parts_machines', label: '3. Parts & Machines', icon: Boxes },
              { id: 'quality', label: '4. QC Checklist', icon: CheckSquare },
              { id: 'invoice_handover', label: '5. Invoice & Handover', icon: Receipt },
              { id: 'timeline', label: '6. Activity Timeline', icon: Clock },
            ].map(t => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-600 dark:bg-[#DAFC08]/15 dark:text-[#DAFC08] border-b-2 border-amber-500 dark:border-[#DAFC08]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Overview & Diagnosis */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Details */}
                <div className="p-4 rounded-2xl glass-card border border-black/5 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-gray-400">Customer Profile</span>
                    <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">Verified</span>
                  </div>
                  <p className="font-extrabold text-sm text-gray-900 dark:text-white">{job.customerName}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 font-mono">📞 {job.customerPhone}</p>
                  {job.customerEmail && <p className="text-xs text-gray-500">✉️ {job.customerEmail}</p>}
                  {job.customerAddress && <p className="text-xs text-gray-500">📍 {job.customerAddress}</p>}
                </div>

                {/* Device Hardware Info */}
                <div className="p-4 rounded-2xl glass-card border border-black/5 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-gray-400">Device Hardware</span>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">
                      Priority: {job.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-500 dark:text-[#DAFC08]" />
                    <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                      {job.deviceBrand} {job.deviceModel}
                    </span>
                    <span className="text-xs text-gray-500">({job.deviceColor || 'Standard'})</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-gray-400 text-[10px] block">IMEI / SERIAL</span>
                      <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                        {maskIMEI(job.imeiSerial)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">LOCK PASSCODE</span>
                      <span className="font-mono font-extrabold text-amber-600 dark:text-[#DAFC08]">
                        {job.passcodePin || 'None'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reported Fault vs Diagnosis Notes */}
              <div className="p-4 rounded-2xl glass-card border border-black/5 dark:border-white/10 space-y-3">
                <div>
                  <span className="text-xs font-bold uppercase text-gray-400 block mb-1">
                    Customer Reported Fault:
                  </span>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 p-2.5 rounded-xl glass-panel border border-black/5 dark:border-white/5">
                    {job.reportedFault}
                  </p>
                </div>

                {/* Technician Diagnosis Editor */}
                <div>
                  <span className="text-xs font-bold uppercase text-gray-400 block mb-1">
                    Technician Bench Diagnosis:
                  </span>
                  <textarea
                    rows={2}
                    value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                    className="glass-input w-full p-2.5 rounded-xl text-xs text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase text-gray-400 block mb-1">
                      Internal Workshop Notes (Staff Only):
                    </span>
                    <textarea
                      rows={2}
                      value={internalNotes}
                      onChange={e => setInternalNotes(e.target.value)}
                      placeholder="Specialist instructions, thermal settings, part references..."
                      className="glass-input w-full p-2.5 rounded-xl text-xs text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-gray-400 block mb-1">
                      Customer-Visible Notes:
                    </span>
                    <textarea
                      rows={2}
                      value={customerNotes}
                      onChange={e => setCustomerNotes(e.target.value)}
                      placeholder="Notes printed on invoice and intake slips..."
                      className="glass-input w-full p-2.5 rounded-xl text-xs text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleSaveDiagnosis}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black transition"
                  >
                    Save Diagnosis &amp; Notes
                  </button>
                </div>
              </div>

              {/* Physical Condition Inspection State */}
              <div className="p-4 rounded-2xl glass-card border border-black/5 dark:border-white/10 space-y-2">
                <span className="text-xs font-bold uppercase text-gray-400 block">
                  Intake Physical Inspection Record:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-xl glass-panel border border-black/5 dark:border-white/5">
                    Screen Cracked: <span className="font-bold">{job.physicalCondition.crackedScreen ? 'YES ⚠️' : 'NO'}</span>
                  </div>
                  <div className="p-2 rounded-xl glass-panel border border-black/5 dark:border-white/5">
                    Back Glass Broken: <span className="font-bold">{job.physicalCondition.backGlassBroken ? 'YES ⚠️' : 'NO'}</span>
                  </div>
                  <div className="p-2 rounded-xl glass-panel border border-black/5 dark:border-white/5">
                    Liquid Trace: <span className="font-bold text-rose-500">{job.physicalCondition.liquidDamage ? 'YES 🚨' : 'NO'}</span>
                  </div>
                  <div className="p-2 rounded-xl glass-panel border border-black/5 dark:border-white/5">
                    Power On: <span className="font-bold text-emerald-500">{job.physicalCondition.powerOn ? 'YES' : 'NO (Dead)'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Estimate & Customer Approval */}
          {activeTab === 'estimate' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl glass-card border border-black/5 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-gray-400">
                    Estimate Revision #{job.estimate.revisionNumber}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      job.estimate.status === 'Approved'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : job.estimate.status === 'Rejected'
                        ? 'bg-rose-500/15 text-rose-600'
                        : 'bg-amber-500/15 text-amber-600 animate-pulse'
                    }`}
                  >
                    Status: {job.estimate.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Parts Cost (₹)</label>
                    <input
                      type="number"
                      value={estParts}
                      onChange={e => setEstParts(Number(e.target.value))}
                      className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Labour Cost (₹)</label>
                    <input
                      type="number"
                      value={estLabour}
                      onChange={e => setEstLabour(Number(e.target.value))}
                      className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Discount (₹)</label>
                    <input
                      type="number"
                      value={estDiscount}
                      onChange={e => setEstDiscount(Number(e.target.value))}
                      className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="p-3 glass-panel rounded-xl border border-black/5 dark:border-white/5 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Initial Indicative Quote:</span>
                    <span className="font-semibold">{formatINR(job.estimate.initialIndicativePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Confirmed Subtotal:</span>
                    <span className="font-bold">{formatINR(estParts + estLabour - estDiscount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">GST Tax (18%):</span>
                    <span className="font-medium">{formatINR(((estParts + estLabour - estDiscount) * 18) / 100)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold pt-1 border-t border-black/5 dark:border-white/5">
                    <span>Total Estimated Price:</span>
                    <span className="text-amber-600 dark:text-[#DAFC08]">
                      {formatINR((estParts + estLabour - estDiscount) * 1.18)}
                    </span>
                  </div>
                </div>

                {/* Estimate Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <button
                    onClick={handleUpdateEstimate}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold glass-card border border-black/5 dark:border-white/10 hover:border-black/20 text-gray-800 dark:text-gray-200"
                  >
                    Save &amp; Generate Revision
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => rejectEstimate(job.id, 'Customer declined estimate revision')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 transition"
                    >
                      Mark Rejected
                    </button>
                    <button
                      onClick={() => approveEstimate(job.id)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-500 text-white hover:bg-emerald-600 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Customer Approved</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Parts & Machine Scheduling */}
          {activeTab === 'parts_machines' && (
            <div className="space-y-4">
              {/* Part Reservation Section */}
              <div className="p-4 rounded-2xl glass-card border border-black/5 dark:border-white/10 space-y-3">
                <span className="text-xs font-bold uppercase text-gray-400 block">
                  1. Allocate Repair Parts from Stock
                </span>

                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                  <select
                    value={selectedInventoryId}
                    onChange={e => setSelectedInventoryId(e.target.value)}
                    className="glass-input flex-1 px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
                  >
                    <option value="">-- Select Inventory Spare Part --</option>
                    {inventory
                      .filter(i => i.type === 'Repair Part')
                      .map(i => (
                        <option key={i.id} value={i.id} disabled={i.availableQty <= 0}>
                          {i.sku} — {i.name} (Stock: {i.onHandQty}, Avail: {i.availableQty}, Price: {formatINR(i.sellingPrice)})
                        </option>
                      ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={partQty}
                    onChange={e => setPartQty(Number(e.target.value))}
                    className="glass-input w-16 px-2 py-2 rounded-xl text-xs text-gray-900 dark:text-white text-center"
                  />
                  <button
                    onClick={handleAddPart}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black whitespace-nowrap"
                  >
                    + Reserve Part
                  </button>
                </div>

                {/* Reserved Parts Table */}
                <div className="space-y-1 mt-2">
                  <span className="text-[11px] font-bold text-gray-500">Currently Allocated Parts:</span>
                  {job.partsUsed.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No parts allocated to this repair yet.</p>
                  ) : (
                    <div className="space-y-1">
                      {job.partsUsed.map(part => (
                        <div
                          key={part.inventoryId}
                          className="flex items-center justify-between p-2 rounded-xl glass-panel border border-black/5 dark:border-white/5 text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-amber-600 dark:text-[#DAFC08] mr-2">
                              {part.sku}
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-white">{part.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500">Qty: {part.quantity}</span>
                            <span className="font-bold">{formatINR(part.unitPrice * part.quantity)}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-bold">
                              {part.consumed ? 'Consumed' : 'Reserved'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Machine Scheduling */}
              <div className="p-4 rounded-2xl glass-card border border-black/5 dark:border-white/10 space-y-3">
                <span className="text-xs font-bold uppercase text-gray-400 block">
                  2. Workshop Machine Scheduling (3–4 Machines)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Select Machine</label>
                    <select
                      value={selectedMachineId}
                      onChange={e => setSelectedMachineId(e.target.value)}
                      className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
                    >
                      {machines.map(m => (
                        <option key={m.id} value={m.id} disabled={m.status === 'Maintenance'}>
                          {m.id}: {m.name} ({m.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Time Slot</label>
                    <input
                      type="text"
                      value={machineSlot}
                      onChange={e => setMachineSlot(e.target.value)}
                      placeholder="e.g. 11:30 AM - 01:00 PM"
                      className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleAssignMachine}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#547BDE] text-white hover:bg-blue-600 transition shadow-sm"
                  >
                    Confirm Machine Schedule
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Quality Check Checklist */}
          {activeTab === 'quality' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl glass-card border border-black/5 dark:border-white/10 space-y-3">
                <span className="text-xs font-bold uppercase text-gray-400 block">
                  Mandatory Quality Assurance Checklist (Technician Sign-off)
                </span>
                <div className="space-y-2">
                  {job.qualityChecklist.map(qc => (
                    <div
                      key={qc.id}
                      onClick={() => toggleQualityCheckItem(job.id, qc.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        qc.checked
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-300'
                          : 'glass-panel border-black/5 dark:border-white/5 hover:border-amber-400 dark:hover:border-[#DAFC08]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={qc.checked}
                          onChange={() => {}}
                          className="rounded text-emerald-500 pointer-events-none"
                        />
                        <span className="text-xs font-bold">{qc.item}</span>
                      </div>
                      {qc.checked && qc.checkedBy && (
                        <span className="text-[10px] font-mono text-gray-500">
                          Verified by {qc.checkedBy} ({formatDateTime(qc.checkedAt)})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Invoice, Payment & Customer Handover */}
          {activeTab === 'invoice_handover' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl glass-card border border-black/5 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-gray-400">Invoice &amp; Settlement</span>
                  {job.invoiceSummary && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        job.invoiceSummary.paymentStatus === 'Paid'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-amber-500/15 text-amber-500'
                      }`}
                    >
                      {job.invoiceSummary.paymentStatus}
                    </span>
                  )}
                </div>

                {!job.invoiceSummary ? (
                  <div className="text-center py-6">
                    <p className="text-xs text-gray-500 mb-3">
                      Repair is not invoiced yet. Once all technical quality checks are complete, click below to finalize.
                    </p>
                    <button
                      onClick={() => completeRepairAndInvoice(job.id)}
                      className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black shadow transition active:scale-95"
                    >
                      Complete Repair &amp; Generate Tax Invoice
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl glass-panel border border-black/5 dark:border-white/5">
                        <span className="text-gray-400 text-[10px] block">INVOICE NO</span>
                        <span className="font-extrabold">{job.invoiceSummary.invoiceNumber || 'INV-PENDING'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl glass-panel border border-black/5 dark:border-white/5">
                        <span className="text-gray-400 text-[10px] block">TOTAL AMOUNT</span>
                        <span className="font-extrabold">{formatINR(job.invoiceSummary.total)}</span>
                      </div>
                      <div className="p-2.5 rounded-xl glass-panel border border-black/5 dark:border-white/5">
                        <span className="text-gray-400 text-[10px] block">AMOUNT PAID</span>
                        <span className="font-extrabold text-emerald-500">{formatINR(job.invoiceSummary.amountPaid)}</span>
                      </div>
                      <div className="p-2.5 rounded-xl glass-panel border border-black/5 dark:border-white/5">
                        <span className="text-gray-400 text-[10px] block">BALANCE DUE</span>
                        <span className="font-extrabold text-rose-500">{formatINR(job.invoiceSummary.balanceDue)}</span>
                      </div>
                    </div>

                    {/* Record Payment Form */}
                    {job.invoiceSummary.balanceDue > 0 && (
                      <div className="p-3 glass-panel rounded-xl border border-black/5 dark:border-white/5 space-y-2">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                          Record Counter Payment:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <input
                            type="number"
                            value={paymentAmount}
                            onChange={e => setPaymentAmount(Number(e.target.value))}
                            className="glass-input w-28 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                          />
                          <select
                            value={paymentMethod}
                            onChange={e => setPaymentMethod(e.target.value as any)}
                            className="glass-input px-3 py-1.5 rounded-xl text-xs text-gray-900 dark:text-white"
                          >
                            <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                            <option value="Cash">Cash at Counter</option>
                            <option value="Card">Debit / Credit Card POS</option>
                            <option value="Bank Transfer">Bank NEFT/IMPS</option>
                          </select>
                          <button
                            onClick={() => {
                              if (job.invoiceSummary?.invoiceId) {
                                recordPayment(job.invoiceSummary.invoiceId, Number(paymentAmount), paymentMethod);
                              }
                            }}
                            className="px-4 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-500 text-white hover:bg-emerald-600 transition shadow-sm"
                          >
                            Record Payment
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Customer Handover Section */}
                    <div className="p-3 glass-panel rounded-xl border border-black/5 dark:border-white/5 space-y-2">
                      <span className="text-xs font-bold uppercase text-gray-400 block">
                        Customer Device Handover &amp; Sign-off:
                      </span>
                      {job.handoverAcknowledgment?.acknowledged ? (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">
                            ✓ Handed over on {formatDateTime(job.handoverAcknowledgment.handedOverAt)} by {job.handoverAcknowledgment.handedOverBy}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                            Customer Remarks: "{job.handoverAcknowledgment.customerRemarks}"
                          </p>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={handoverRemarks}
                            onChange={e => setHandoverRemarks(e.target.value)}
                            placeholder="Customer remarks / signature acknowledgment..."
                            className="glass-input flex-1 px-3 py-1.5 rounded-xl text-xs text-gray-900 dark:text-white"
                          />
                          <button
                            onClick={() => handoverDevice(job.id, handoverRemarks)}
                            className="px-4 py-1.5 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black whitespace-nowrap"
                          >
                            Hand Over to Customer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 6: Activity Timeline */}
          {activeTab === 'timeline' && (
            <div className="p-4 rounded-2xl glass-card border border-black/5 dark:border-white/10 space-y-3">
              <span className="text-xs font-bold uppercase text-gray-400 block">Audit Activity Timeline</span>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-black/10 dark:before:bg-white/10">
                {job.timeline.map(t => (
                  <div key={t.id} className="relative">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-amber-500 dark:bg-[#DAFC08] border-2 border-white dark:border-[#1F1F1F]"></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{t.title}</span>
                        <span className="text-[10px] text-gray-400">{formatDateTime(t.timestamp)}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{t.description}</p>
                      <span className="text-[10px] font-semibold text-gray-400">By: {t.staffName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Printable Modals */}
      {showReceiptModal && (
        <IntakeReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          job={job}
          settings={settings}
        />
      )}
      {showJobSheetModal && (
        <JobSheetModal
          isOpen={showJobSheetModal}
          onClose={() => setShowJobSheetModal(false)}
          job={job}
          settings={settings}
        />
      )}
    </>
  );
};
