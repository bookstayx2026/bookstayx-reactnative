import React from 'react';
import { Modal } from '../common/Modal';
import { RepairJob, ShopSettings } from '../../types';
import { formatDateTime, maskIMEI, formatINR } from '../../utils/formatters';
import { Printer, Wrench, Cpu, CheckSquare } from 'lucide-react';

interface JobSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: RepairJob;
  settings: ShopSettings;
}

export const JobSheetModal: React.FC<JobSheetModalProps> = ({
  isOpen,
  onClose,
  job,
  settings,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Workshop Job Sheet — #${job.jobCardNumber}`}
      subtitle="Technician work order with passcodes, hardware diagnosis, and quality checklist"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Printable Job Sheet */}
        <div
          id="job-sheet-printable"
          className="p-6 rounded-2xl bg-white text-black border border-gray-400 shadow-sm font-sans space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-3 border-gray-400">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-black">{settings.shopName.toUpperCase()} WORKSHOP</span>
                <span className="px-2 py-0.5 rounded bg-black text-white text-[10px] font-bold uppercase">
                  {settings.area} HUB
                </span>
              </div>
              <p className="text-xs text-gray-600">INTERNAL TECHNICAL WORK ORDER &amp; QC SHEET</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 font-bold block">PRIORITY</span>
              <span
                className={`inline-block px-2.5 py-0.5 rounded text-xs font-extrabold ${
                  job.priority === 'Urgent'
                    ? 'bg-rose-600 text-white'
                    : job.priority === 'High'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {job.priority.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Job & Tech Details */}
          <div className="grid grid-cols-3 gap-3 text-xs border-b pb-3 border-gray-300">
            <div>
              <p className="text-gray-500 font-bold">JOB CARD NUMBER</p>
              <p className="text-base font-extrabold font-mono">{job.jobCardNumber}</p>
              <p className="text-gray-500 font-bold mt-1">STATUS</p>
              <p className="font-bold text-blue-700">{job.status}</p>
            </div>
            <div>
              <p className="text-gray-500 font-bold">ASSIGNED TECHNICIAN</p>
              <p className="font-extrabold text-sm">{job.technicianName}</p>
              <p className="text-gray-500 font-bold mt-1">INTAKE TIMESTAMP</p>
              <p className="font-medium">{formatDateTime(job.intakeDate)}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 font-bold">PROMISED DELIVERY</p>
              <p className="font-extrabold text-sm text-red-700">{formatDateTime(job.promisedDate)}</p>
              <p className="text-gray-500 font-bold mt-1">CUSTOMER NAME</p>
              <p className="font-semibold">{job.customerName}</p>
            </div>
          </div>

          {/* Hardware & Passcode Information */}
          <div className="p-3 bg-gray-100 rounded-xl border border-gray-300 text-xs space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-gray-500 font-bold block">DEVICE</span>
                <span className="font-extrabold">{job.deviceBrand} {job.deviceModel}</span>
              </div>
              <div>
                <span className="text-gray-500 font-bold block">COLOR</span>
                <span className="font-semibold">{job.deviceColor || 'Standard'}</span>
              </div>
              <div>
                <span className="text-gray-500 font-bold block">DEVICE PASSCODE / PIN</span>
                <span className="font-mono font-extrabold text-sm bg-yellow-200 px-1.5 py-0.5 rounded">
                  {job.passcodePin || 'None / Pattern'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 font-bold block">IMEI / SERIAL</span>
                <span className="font-mono font-medium">{maskIMEI(job.imeiSerial)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-300">
              <span className="text-gray-600 font-bold block">CUSTOMER REPORTED FAULT:</span>
              <p className="font-semibold text-gray-900 mt-0.5">{job.reportedFault}</p>
            </div>
          </div>

          {/* Physical Condition Checklist */}
          <div className="border border-gray-300 rounded-xl p-3 text-xs space-y-2">
            <span className="font-bold text-gray-800 uppercase block">Intake Physical Inspection State:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>Cracked Screen: <span className="font-bold">{job.physicalCondition.crackedScreen ? 'YES' : 'NO'}</span></div>
              <div>Back Glass Broken: <span className="font-bold">{job.physicalCondition.backGlassBroken ? 'YES' : 'NO'}</span></div>
              <div>Liquid Trace: <span className="font-bold text-red-600">{job.physicalCondition.liquidDamage ? 'YES' : 'NO'}</span></div>
              <div>Frame Dents: <span className="font-bold">{job.physicalCondition.bodyScratches ? 'YES' : 'NO'}</span></div>
              <div>Power On: <span className="font-bold">{job.physicalCondition.powerOn ? 'YES' : 'NO'}</span></div>
              <div>Touch Working: <span className="font-bold">{job.physicalCondition.touchWorking ? 'YES' : 'NO'}</span></div>
              <div>Cameras Working: <span className="font-bold">{job.physicalCondition.cameraWorking ? 'YES' : 'NO'}</span></div>
              <div>Speakers/Mic: <span className="font-bold">{job.physicalCondition.speakerWorking ? 'YES' : 'NO'}</span></div>
            </div>
            {job.physicalCondition.notes && (
              <p className="text-[11px] text-gray-600 italic">Notes: {job.physicalCondition.notes}</p>
            )}
          </div>

          {/* Technical Diagnosis & Internal Work Instructions */}
          <div className="border border-gray-300 rounded-xl p-3 text-xs space-y-1.5">
            <span className="font-bold text-gray-800 uppercase block">Technical Diagnosis &amp; Bench Instructions:</span>
            <p className="font-semibold text-gray-900">{job.diagnosis || 'Diagnostic inspection pending.'}</p>
            {job.internalNotes && (
              <p className="text-gray-700 bg-amber-50 p-2 rounded border border-amber-200">
                <span className="font-bold text-amber-900">Internal Workshop Note:</span> {job.internalNotes}
              </p>
            )}
          </div>

          {/* Machine & Parts Allocated */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="border border-gray-300 rounded-xl p-3">
              <span className="font-bold text-gray-800 uppercase block mb-1">Scheduled Machine:</span>
              <p className="font-semibold">{job.assignedMachineId ? `Machine ${job.assignedMachineId}` : 'Manual Hand Bench'}</p>
              <p className="text-gray-600">Slot: {job.machineSlot || 'Standard bench queue'}</p>
            </div>
            <div className="border border-gray-300 rounded-xl p-3">
              <span className="font-bold text-gray-800 uppercase block mb-1">Parts Reserved / Used:</span>
              {job.partsUsed.length === 0 ? (
                <p className="text-gray-500 italic">No inventory parts allocated yet</p>
              ) : (
                <ul className="list-disc list-inside space-y-0.5">
                  {job.partsUsed.map(p => (
                    <li key={p.inventoryId}>
                      {p.quantity}x {p.name} ({p.sku})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Quality Checklist */}
          <div className="border border-gray-300 rounded-xl p-3 text-xs space-y-2">
            <span className="font-bold text-gray-800 uppercase block">Mandatory Quality Check Protocol:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {job.qualityChecklist.map(qc => (
                <div key={qc.id} className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${qc.checked ? 'bg-black text-white' : 'border-gray-500'}`}>
                    {qc.checked && '✓'}
                  </div>
                  <span className={qc.checked ? 'font-bold line-through text-gray-600' : 'text-gray-800'}>
                    {qc.item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end pt-4 text-xs font-semibold text-gray-700">
            <div>
              <div className="border-t border-gray-400 w-36 pt-1 text-center text-[10px]">
                Technician Signature
              </div>
            </div>
            <div className="text-right">
              <div className="border-t border-gray-400 w-40 pt-1 text-center text-[10px] font-bold">
                Quality Inspector Signature
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
            <span>Print Workshop Job Sheet</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
