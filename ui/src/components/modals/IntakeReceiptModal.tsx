import React from 'react';
import { Modal } from '../common/Modal';
import { RepairJob, ShopSettings } from '../../types';
import { formatINR, formatDate, formatDateTime, maskIMEI } from '../../utils/formatters';
import { Printer, CheckCircle2, ShieldCheck, Phone, MapPin } from 'lucide-react';

interface IntakeReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: RepairJob;
  settings: ShopSettings;
}

export const IntakeReceiptModal: React.FC<IntakeReceiptModalProps> = ({
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
      title={`Customer Intake Receipt — #${job.jobCardNumber}`}
      subtitle="Printable customer proof of device intake with terms and warranty policy"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Printable Paper Card */}
        <div
          id="intake-receipt-printable"
          className="p-6 rounded-2xl bg-white text-black border border-gray-300 shadow-sm font-sans space-y-4"
        >
          {/* Header */}
          <div className="text-center border-b pb-3 border-gray-300">
            <h2 className="text-xl font-extrabold tracking-tight">{settings.shopName.toUpperCase()}</h2>
            <p className="text-xs font-semibold text-gray-700">{settings.tagline}</p>
            <p className="text-[11px] text-gray-600 mt-0.5">
              {settings.address}, {settings.area}, {settings.city} - {settings.pincode}
            </p>
            <div className="flex items-center justify-center gap-4 text-[11px] font-bold text-gray-800 mt-1">
              <span>📞 {settings.phone}</span>
              <span>GSTIN: {settings.gstNumber}</span>
            </div>
            <div className="mt-2 inline-block px-3 py-1 rounded bg-black text-white text-xs font-bold uppercase tracking-wider">
              DEVICE INTAKE ACKNOWLEDGMENT SLIP
            </div>
          </div>

          {/* Job & Customer Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs border-b pb-3 border-gray-300">
            <div>
              <p className="text-gray-500 font-semibold">JOB CARD NUMBER</p>
              <p className="font-extrabold text-sm">{job.jobCardNumber}</p>
              <p className="text-gray-500 font-semibold mt-2">CUSTOMER DETAILS</p>
              <p className="font-bold">{job.customerName}</p>
              <p className="text-gray-700 font-mono">{job.customerPhone}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 font-semibold">INTAKE DATE &amp; TIME</p>
              <p className="font-bold">{formatDateTime(job.intakeDate)}</p>
              <p className="text-gray-500 font-semibold mt-2">PROMISED READY DATE</p>
              <p className="font-extrabold text-amber-700">{formatDateTime(job.promisedDate)}</p>
            </div>
          </div>

          {/* Device & Fault Summary */}
          <div className="space-y-2 text-xs border-b pb-3 border-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-600 font-bold">DEVICE:</span>
              <span className="font-extrabold">{job.deviceBrand} {job.deviceModel} ({job.deviceColor || 'Standard'})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-bold">IMEI / SERIAL:</span>
              <span className="font-mono font-bold">{maskIMEI(job.imeiSerial)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-bold">REPORTED FAULT:</span>
              <span className="font-semibold text-right max-w-[260px]">{job.reportedFault}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-bold">ACCESSORIES RECEIVED:</span>
              <span className="font-medium">{job.accessoriesReceived.join(', ') || 'Device only'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-bold">INITIAL INDICATIVE ESTIMATE:</span>
              <span className="font-extrabold text-sm text-black">
                {formatINR(job.estimate.confirmedPrice || job.estimate.initialIndicativePrice)} (Excl. Tax)
              </span>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="text-[10px] text-gray-600 space-y-1 leading-tight border-b pb-3 border-gray-300">
            <p className="font-bold text-gray-800 uppercase">Intake Terms &amp; Policy:</p>
            <p>1. Original estimate is indicative. Final quote will be confirmed post deep diagnosis.</p>
            <p>2. Please back up your device data. One Repair is not liable for software data loss during motherboard/OS operations.</p>
            <p>3. Devices not collected within 30 days after ready notification may incur storage fees.</p>
            <p>4. Repair warranty covers replaced parts against functional defects for {job.warrantyMonths} months.</p>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end pt-4 text-xs font-semibold text-gray-700">
            <div>
              <div className="border-t border-gray-400 w-32 pt-1 text-center text-[10px]">
                Customer Signature
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500">Received By: {job.technicianName || 'Pooja Sharma'}</p>
              <div className="border-t border-gray-400 w-36 pt-1 text-center text-[10px] font-bold">
                For {settings.shopName} (Pimpri)
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
            <span>Print Intake Receipt</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
