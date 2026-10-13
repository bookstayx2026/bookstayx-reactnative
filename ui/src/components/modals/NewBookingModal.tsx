import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCRM } from '../../context/CRMContext';
import { ServiceMode, BookingSource } from '../../types';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewBookingModal: React.FC<NewBookingModalProps> = ({ isOpen, onClose }) => {
  const { addBooking, staff } = useCRM();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceBrand, setDeviceBrand] = useState('Apple');
  const [deviceModel, setDeviceModel] = useState('');
  const [faultDescription, setFaultDescription] = useState('');
  const [serviceMode, setServiceMode] = useState<ServiceMode>('Shop Walk-in');
  const [source, setSource] = useState<BookingSource>('Walk-in');
  const [preferredDate, setPreferredDate] = useState(new Date().toISOString().slice(0, 10));
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('11:00 AM');
  const [address, setAddress] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState('staff-5');
  const [travelCharge, setTravelCharge] = useState(0);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !deviceModel || !faultDescription) return;

    const assignedStaff = staff.find(s => s.id === assignedStaffId);

    addBooking({
      customerName,
      customerPhone,
      deviceBrand,
      deviceModel,
      faultDescription,
      serviceMode,
      source,
      preferredDate,
      preferredTimeSlot,
      address: serviceMode !== 'Shop Walk-in' ? address : undefined,
      status: 'Confirmed',
      assignedStaffId,
      assignedStaffName: assignedStaff?.name,
      travelCharge: Number(travelCharge) || 0,
      handoverStatus: 'Not Picked Up',
      notes,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Customer Booking & Device Intake"
      subtitle="Register a walk-in, phone call, pickup request, or doorstep visit"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Customer Full Name *
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="e.g. Nilesh Patil"
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Phone Number *
            </label>
            <input
              type="text"
              required
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              placeholder="e.g. +91 98220 11223"
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Device Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Device Brand *
            </label>
            <select
              value={deviceBrand}
              onChange={e => setDeviceBrand(e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            >
              <option value="Apple">Apple (iPhone / iPad)</option>
              <option value="Samsung">Samsung Galaxy</option>
              <option value="OnePlus">OnePlus</option>
              <option value="Google">Google Pixel</option>
              <option value="Xiaomi">Xiaomi / Poco / Redmi</option>
              <option value="Vivo">Vivo / iQOO</option>
              <option value="Oppo">Oppo / Realme</option>
              <option value="Motorola">Motorola</option>
              <option value="Other">Other Brand</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Exact Device Model *
            </label>
            <input
              type="text"
              required
              value={deviceModel}
              onChange={e => setDeviceModel(e.target.value)}
              placeholder="e.g. iPhone 14 Pro / S23 Ultra"
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Fault Description */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Reported Fault &amp; Customer Symptoms *
          </label>
          <textarea
            required
            rows={2}
            value={faultDescription}
            onChange={e => setFaultDescription(e.target.value)}
            placeholder="e.g. Screen glass broken, touch working, green vertical line appearing when heated..."
            className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
          />
        </div>

        {/* Service Mode & Source */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Service Mode
            </label>
            <select
              value={serviceMode}
              onChange={e => {
                const mode = e.target.value as ServiceMode;
                setServiceMode(mode);
                if (mode === 'Doorstep Service') setTravelCharge(200);
                else if (mode === 'Pickup & Delivery') setTravelCharge(150);
                else setTravelCharge(0);
              }}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            >
              <option value="Shop Walk-in">Shop Walk-in (Pimpri Counter)</option>
              <option value="Pickup & Delivery">Pickup &amp; Delivery (Courier/Boy)</option>
              <option value="Doorstep Service">Doorstep Inspection / Repair</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Booking Channel / Source
            </label>
            <select
              value={source}
              onChange={e => setSource(e.target.value as BookingSource)}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            >
              <option value="Walk-in">Walk-in Customer</option>
              <option value="Call">Phone Call / WhatsApp</option>
              <option value="Pickup Request">Pickup Request</option>
              <option value="Doorstep Visit">Doorstep Visit</option>
              <option value="Website">Website Form</option>
            </select>
          </div>
        </div>

        {/* Address if Doorstep or Pickup */}
        {serviceMode !== 'Shop Walk-in' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Pickup / Doorstep Address in Pimpri-Chinchwad / Pune *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Flat/Shop No, Society, Area, Pincode"
                className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Travel / Visit Fee (₹)
              </label>
              <input
                type="number"
                value={travelCharge}
                onChange={e => setTravelCharge(Number(e.target.value))}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Date, Time Slot & Staff Assignment */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Preferred Date
            </label>
            <input
              type="date"
              value={preferredDate}
              onChange={e => setPreferredDate(e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Time Slot
            </label>
            <select
              value={preferredTimeSlot}
              onChange={e => setPreferredTimeSlot(e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            >
              <option value="10:00 AM">10:00 AM - 11:30 AM</option>
              <option value="11:30 AM">11:30 AM - 01:00 PM</option>
              <option value="02:00 PM">02:00 PM - 03:30 PM</option>
              <option value="04:00 PM">04:00 PM - 05:30 PM</option>
              <option value="06:00 PM">06:00 PM - 07:30 PM</option>
              <option value="08:00 PM">08:00 PM - 09:00 PM</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Assign Staff Member
            </label>
            <select
              value={assignedStaffId}
              onChange={e => setAssignedStaffId(e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            >
              {staff.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Buttons */}
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
            Confirm &amp; Create Booking
          </button>
        </div>
      </form>
    </Modal>
  );
};
